import Link from "next/link";
import { exigirSessao } from "@/lib/sessao";
import { setoresVisiveis } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setorMeta } from "@/lib/setores";
import { SetorBadge, StatusBadge, GargaloBadge } from "../_components/Badges";

export const dynamic = "force-dynamic";

export default async function PainelPage() {
  const sessao = await exigirSessao();
  const setores = await setoresVisiveis(sessao);

  // Etapas "ativas" (pendente/em_andamento/travada) dos setores visíveis,
  // de obras em andamento. É a fila de trabalho do usuário.
  const etapas = await prisma.etapaObra.findMany({
    where: {
      status: { in: ["pendente", "em_andamento", "travada"] },
      obra: { status: "em_andamento" },
      template: { setor: { codigo: { in: setores } } },
    },
    include: { obra: true, template: { include: { setor: true } } },
    orderBy: [{ obra: { criadoEm: "desc" } }, { template: { numero: "asc" } }],
  });

  // Métricas gerais
  const [totalObras, obrasAndamento, pendenciasAbertas] = await Promise.all([
    prisma.obra.count(),
    prisma.obra.count({ where: { status: "em_andamento" } }),
    prisma.pendencia.count({ where: { status: "aberta" } }),
  ]);

  // Agrupa etapas por setor
  const porSetor = new Map<string, typeof etapas>();
  for (const e of etapas) {
    const c = e.template.setor.codigo;
    if (!porSetor.has(c)) porSetor.set(c, []);
    porSetor.get(c)!.push(e);
  }

  const travadas = etapas.filter((e) => e.status === "travada").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy-800">
          Olá, {sessao.nome.split(" ")[0]} 👋
        </h1>
        <p className="text-navy-600 mt-1">
          {sessao.isAdmin
            ? "Visão geral de todas as obras e setores."
            : "Aqui estão as etapas que dependem de você."}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric label="Obras ativas" valor={obrasAndamento} cor="text-navy-700" />
        <Metric label="Total de obras" valor={totalObras} cor="text-navy-700" />
        <Metric label="Minhas etapas" valor={etapas.length} cor="text-purpura-600" />
        <Metric
          label="Travadas / pendências"
          valor={travadas + pendenciasAbertas}
          cor="text-rose-600"
        />
      </div>

      {/* Filas por setor */}
      {porSetor.size === 0 ? (
        <div className="card p-8 text-center text-navy-500">
          <p className="text-lg">Nenhuma etapa pendente no seu setor agora. 🎉</p>
          <Link href="/obras" className="btn-ghost mt-4">
            Ver todas as obras
          </Link>
        </div>
      ) : (
        [...porSetor.entries()].map(([codigo, lista]) => {
          const m = setorMeta(codigo);
          return (
            <section key={codigo} className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-navy-800 text-lg">
                  {m.emoji} {m.nome}
                </h2>
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
                        <span className="text-xs font-mono text-navy-400">
                          {e.obra.codigo}
                        </span>
                        <span className="font-medium text-navy-800 truncate">
                          {e.obra.clienteNome}
                        </span>
                      </div>
                      <p className="text-navy-700 mt-1">
                        <span className="text-navy-400 text-sm mr-1">
                          #{e.template.numero}
                        </span>
                        {e.template.nome}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <StatusBadge status={e.status} />
                        {e.template.isGargalo ? <GargaloBadge /> : null}
                      </div>
                    </div>
                    <span className="text-purpura-500 text-sm font-semibold whitespace-nowrap">
                      Atualizar →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}

      {/* Atalho setores (admin) */}
      {sessao.isAdmin ? (
        <section className="space-y-3">
          <h2 className="font-semibold text-navy-800 text-lg">Setores</h2>
          <div className="flex flex-wrap gap-2">
            {setores.map((c) => (
              <SetorBadge key={c} codigo={c} />
            ))}
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
