import Link from "next/link";
import { exigirSessao } from "@/lib/sessao";
import { setoresVisiveis } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setorMeta } from "@/lib/setores";
import { calcularAlerta, ALERTA_META } from "@/lib/semaforo";
import { SetorBadge, StatusBadge, GargaloBadge } from "../_components/Badges";

export const dynamic = "force-dynamic";

export default async function PainelPage() {
  const sessao = await exigirSessao();
  const setores = await setoresVisiveis(sessao);

  const etapas = await prisma.etapaObra.findMany({
    where: {
      status: { in: ["pendente", "em_andamento", "travada"] },
      obra: { status: "em_andamento" },
      template: { setor: { codigo: { in: setores } } },
    },
    include: { obra: true, template: { include: { setor: true } } },
    orderBy: [{ obra: { criadoEm: "desc" } }, { template: { numero: "asc" } }],
  });

  const [totalObras, obrasAndamento, pendenciasAbertas, todasObras] = await Promise.all([
    prisma.obra.count(),
    prisma.obra.count({ where: { status: "em_andamento" } }),
    prisma.pendencia.count({ where: { status: "aberta" } }),
    prisma.obra.findMany({
      where: { status: "em_andamento" },
      include: { etapas: true },
    }),
  ]);

  // KPIs
  const contadores = { em_dia: 0, atencao: 0, atrasado: 0, aguardando_obra: 0 };
  let somaLeadTime = 0;
  let qtdLeadTime = 0;
  let obrasProntasInstalacao = 0;

  for (const obra of todasObras) {
    const total = obra.etapas.length;
    const concluidas = obra.etapas.filter((e) => e.status === "concluida").length;
    const pct = total ? Math.round((concluidas / total) * 100) : 0;
    const alerta = calcularAlerta(obra.dataInstalacao, pct);
    contadores[alerta]++;
    if (pct >= 80 && pct < 100) obrasProntasInstalacao++;
    if (obra.dataInstalacao) {
      const dias = Math.ceil((new Date(obra.dataInstalacao).getTime() - new Date(obra.criadoEm).getTime()) / 86400000);
      if (dias > 0) { somaLeadTime += dias; qtdLeadTime++; }
    }
  }
  const leadTimeMedio = qtdLeadTime ? Math.round(somaLeadTime / qtdLeadTime) : null;

  const travadas = etapas.filter((e) => e.status === "travada").length;

  const porSetor = new Map<string, typeof etapas>();
  for (const e of etapas) {
    const c = e.template.setor.codigo;
    if (!porSetor.has(c)) porSetor.set(c, []);
    porSetor.get(c)!.push(e);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy-800">
          Olá, {sessao.nome.split(" ")[0]} 👋
        </h1>
        <p className="text-navy-600 mt-1">
          {sessao.isAdmin ? "Visão geral de todas as obras e setores." : "Aqui estão as etapas que dependem de você."}
        </p>
      </div>

      {/* KPIs admin */}
      {sessao.isAdmin ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Metric label="Obras ativas" valor={obrasAndamento} cor="text-navy-700" />
            <Metric label="Prontas p/ instalar" valor={obrasProntasInstalacao} cor="text-purpura-600" />
            <Metric label="Pendências abertas" valor={pendenciasAbertas} cor="text-orange-600" />
            <Metric label="Etapas travadas" valor={travadas} cor="text-rose-600" />
          </div>

          {/* Semáforo */}
          <section>
            <h2 className="font-semibold text-navy-800 mb-3">Semáforo de prazos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(["atrasado", "atencao", "em_dia", "aguardando_obra"] as const).map((k) => {
                const m = ALERTA_META[k];
                return (
                  <Link key={k} href="/obras" className={`card p-3 border hover:shadow transition ${m.bg}`}>
                    <p className="text-xs text-navy-500">{m.emoji} {m.rotulo}</p>
                    <p className={`text-2xl font-bold mt-0.5 ${m.cor}`}>{contadores[k]}</p>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Lead time */}
          {leadTimeMedio ? (
            <div className="card p-4 flex items-center gap-4">
              <div>
                <p className="text-xs text-navy-500">Lead time médio (venda → instalação)</p>
                <p className="text-3xl font-bold text-purpura-600 mt-0.5">{leadTimeMedio} dias</p>
              </div>
              <div className="text-xs text-navy-400 border-l border-navy-100 pl-4">
                Meta: &lt; 50 dias<br />
                {leadTimeMedio <= 50 ? "✅ Dentro da meta" : "⚠️ Acima da meta"}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label="Obras ativas" valor={obrasAndamento} cor="text-navy-700" />
          <Metric label="Total de obras" valor={totalObras} cor="text-navy-700" />
          <Metric label="Minhas etapas" valor={etapas.length} cor="text-purpura-600" />
          <Metric label="Travadas / pendências" valor={travadas + pendenciasAbertas} cor="text-rose-600" />
        </div>
      )}

      {/* Filas por setor */}
      {porSetor.size === 0 ? (
        <div className="card p-8 text-center text-navy-500">
          <p className="text-lg">Nenhuma etapa pendente no seu setor agora. 🎉</p>
          <Link href="/obras" className="btn-ghost mt-4">Ver todas as obras</Link>
        </div>
      ) : (
        [...porSetor.entries()].map(([codigo, lista]) => {
          const m = setorMeta(codigo);
          return (
            <section key={codigo} className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-navy-800 text-lg">{m.emoji} {m.nome}</h2>
                <span className="text-sm text-navy-400">({lista.length})</span>
              </div>
              <div className="grid gap-3">
                {lista.map((e) => (
                  <Link
                    key={e.id}
                    href={`/obras/${e.obraId}?etapa=${e.id}`}
                    className="card p-4 hover:border-purpura-200 hover:shadow transition flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-navy-400">{e.obra.codigo}</span>
                        <span className="font-medium text-navy-800 truncate">{e.obra.clienteNome}</span>
                      </div>
                      <p className="text-navy-700 mt-1">
                        <span className="text-navy-400 text-sm mr-1">#{e.template.numero}</span>
                        {e.template.nome}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <StatusBadge status={e.status} />
                        {e.template.isGargalo ? <GargaloBadge /> : null}
                      </div>
                    </div>
                    <span className="text-purpura-500 text-sm font-semibold whitespace-nowrap">Atualizar →</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}

      {sessao.isAdmin ? (
        <section className="space-y-3">
          <h2 className="font-semibold text-navy-800 text-lg">Setores</h2>
          <div className="flex flex-wrap gap-2">
            {setores.map((c) => <SetorBadge key={c} codigo={c} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Metric({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-navy-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${cor}`}>{valor}</p>
    </div>
  );
}
