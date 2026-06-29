import Link from "next/link";
import { exigirSessao } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { calcularAlerta, ALERTA_META, faseAtual } from "@/lib/semaforo";

export const dynamic = "force-dynamic";

function diasRestantes(data: Date | null): number | null {
  if (!data) return null;
  return Math.ceil((new Date(data).getTime() - Date.now()) / 86400000);
}

export default async function ObrasPage() {
  const sessao = await exigirSessao();

  const obras = await prisma.obra.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      etapas: { include: { template: { include: { setor: true } } } },
      _count: { select: { pendencias: true } },
    },
  });

  // Contadores de alerta para o painel
  const contadores = { em_dia: 0, atencao: 0, atrasado: 0, aguardando_obra: 0 };
  for (const obra of obras) {
    if (obra.status !== "em_andamento") continue;
    const total = obra.etapas.length;
    const concluidas = obra.etapas.filter((e) => e.status === "concluida").length;
    const pct = total ? Math.round((concluidas / total) * 100) : 0;
    const alerta = calcularAlerta(obra.dataInstalacao, pct);
    contadores[alerta]++;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy-800">Obras</h1>
          <p className="text-navy-600 mt-1">{obras.length} obra(s) no sistema.</p>
        </div>
        {sessao.isAdmin ? (
          <Link href="/obras/nova" className="btn-primary">+ Nova obra</Link>
        ) : null}
      </div>

      {/* Semáforo resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["atrasado", "atencao", "em_dia", "aguardando_obra"] as const).map((k) => {
          const m = ALERTA_META[k];
          return (
            <div key={k} className={`card p-3 border ${m.bg}`}>
              <p className="text-xs text-navy-500">{m.emoji} {m.rotulo}</p>
              <p className={`text-2xl font-bold mt-0.5 ${m.cor}`}>{contadores[k]}</p>
            </div>
          );
        })}
      </div>

      {obras.length === 0 ? (
        <div className="card p-8 text-center text-navy-500">
          Nenhuma obra cadastrada ainda.
          {sessao.isAdmin ? (
            <div className="mt-4">
              <Link href="/obras/nova" className="btn-primary">Cadastrar primeira obra</Link>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3">
          {obras.map((obra) => {
            const total = obra.etapas.length;
            const concluidas = obra.etapas.filter((e) => e.status === "concluida").length;
            const travadas = obra.etapas.filter((e) => e.status === "travada").length;
            const pct = total ? Math.round((concluidas / total) * 100) : 0;
            const atual = obra.etapas
              .slice()
              .sort((a, b) => a.template.numero - b.template.numero)
              .find((e) => e.status !== "concluida");
            const alerta = calcularAlerta(obra.dataInstalacao, pct);
            const am = ALERTA_META[alerta];
            const fase = faseAtual(pct, obra.dataInstalacao);
            const dias = diasRestantes(obra.dataInstalacao);

            return (
              <Link
                key={obra.id}
                href={`/obras/${obra.id}`}
                className={`card p-4 hover:shadow transition border-l-4 ${
                  alerta === "atrasado" ? "border-l-rose-400" :
                  alerta === "atencao" ? "border-l-amber-400" :
                  alerta === "aguardando_obra" ? "border-l-blue-400" :
                  "border-l-emerald-400"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-navy-400">{obra.codigo}</span>
                      <span className={`chip border text-xs ${am.bg} ${am.cor}`}>
                        {am.emoji} {am.rotulo}
                      </span>
                      <span className="chip bg-navy-50 text-navy-600 border-navy-100 text-xs">
                        {fase}
                      </span>
                      {travadas > 0 ? (
                        <span className="chip bg-rose-50 text-rose-700 border-rose-200 text-xs">
                          {travadas} travada(s)
                        </span>
                      ) : null}
                      {obra._count.pendencias > 0 ? (
                        <span className="chip bg-orange-50 text-orange-700 border-orange-200 text-xs">
                          {obra._count.pendencias} pendência(s)
                        </span>
                      ) : null}
                    </div>
                    <h2 className="font-semibold text-navy-800 text-lg mt-1 truncate">
                      {obra.clienteNome}
                    </h2>
                    <div className="flex flex-wrap gap-3 mt-0.5">
                      {obra.dataInstalacao ? (
                        <p className="text-sm text-navy-500">
                          📅 Instalação: {new Date(obra.dataInstalacao).toLocaleDateString("pt-BR")}
                          {dias !== null ? (
                            <span className={`ml-1 font-medium ${dias < 0 ? "text-rose-600" : dias <= 7 ? "text-blue-600" : "text-navy-700"}`}>
                              ({dias < 0 ? `${Math.abs(dias)}d atraso` : `${dias}d restantes`})
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                      {atual ? (
                        <p className="text-sm text-navy-500">
                          Etapa: <span className="font-medium text-navy-700">#{atual.template.numero} {atual.template.nome}</span>
                        </p>
                      ) : (
                        <p className="text-sm text-emerald-600 font-medium">Todas as etapas concluídas ✓</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-purpura-600">{pct}%</div>
                    <div className="text-xs text-navy-400">{concluidas}/{total}</div>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-navy-50 overflow-hidden">
                  <div className="h-full bg-purpura-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
