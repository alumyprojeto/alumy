import Link from "next/link";
import { exigirSessao } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { setorMeta } from "@/lib/setores";

export const dynamic = "force-dynamic";

const STATUS_OBRA: Record<string, { rotulo: string; cor: string }> = {
  em_andamento: { rotulo: "Em andamento", cor: "bg-amber-50 text-amber-700 border-amber-200" },
  concluida: { rotulo: "Concluída", cor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelada: { rotulo: "Cancelada", cor: "bg-navy-50 text-navy-500 border-navy-100" },
};

export default async function ObrasPage() {
  const sessao = await exigirSessao();

  const obras = await prisma.obra.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      etapas: { include: { template: { include: { setor: true } } } },
      _count: { select: { pendencias: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy-800">Obras</h1>
          <p className="text-navy-600 mt-1">{obras.length} obra(s) no sistema.</p>
        </div>
        {sessao.isAdmin ? (
          <Link href="/obras/nova" className="btn-primary">
            + Nova obra
          </Link>
        ) : null}
      </div>

      {obras.length === 0 ? (
        <div className="card p-8 text-center text-navy-500">
          Nenhuma obra cadastrada ainda.
          {sessao.isAdmin ? (
            <div className="mt-4">
              <Link href="/obras/nova" className="btn-primary">
                Cadastrar primeira obra
              </Link>
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
            // etapa atual = primeira não concluída
            const atual = obra.etapas
              .slice()
              .sort((a, b) => a.template.numero - b.template.numero)
              .find((e) => e.status !== "concluida");
            const so = STATUS_OBRA[obra.status] ?? STATUS_OBRA.em_andamento;

            return (
              <Link
                key={obra.id}
                href={`/obras/${obra.id}`}
                className="card p-4 hover:border-purpura-200 hover:shadow transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-navy-400">{obra.codigo}</span>
                      <span className={`chip ${so.cor}`}>{so.rotulo}</span>
                      {travadas > 0 ? (
                        <span className="chip bg-rose-50 text-rose-700 border-rose-200">
                          {travadas} travada(s)
                        </span>
                      ) : null}
                      {obra._count.pendencias > 0 ? (
                        <span className="chip bg-orange-50 text-orange-700 border-orange-200">
                          {obra._count.pendencias} pendência(s)
                        </span>
                      ) : null}
                    </div>
                    <h2 className="font-semibold text-navy-800 text-lg mt-1 truncate">
                      {obra.clienteNome}
                    </h2>
                    {atual ? (
                      <p className="text-sm text-navy-600 mt-0.5">
                        Etapa atual:{" "}
                        <span className="font-medium">
                          {setorMeta(atual.template.setor.codigo).emoji} #{atual.template.numero}{" "}
                          {atual.template.nome}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-emerald-600 mt-0.5 font-medium">
                        Todas as etapas concluídas ✓
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-purpura-600">{pct}%</div>
                    <div className="text-xs text-navy-400">
                      {concluidas}/{total}
                    </div>
                  </div>
                </div>
                {/* barra de progresso */}
                <div className="mt-3 h-2 rounded-full bg-navy-50 overflow-hidden">
                  <div
                    className="h-full bg-purpura-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
