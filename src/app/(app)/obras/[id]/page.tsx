import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirSessao } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { podeVerSetor } from "@/lib/auth";
import { setorMeta } from "@/lib/setores";
import { SetorBadge, StatusBadge, GargaloBadge } from "../../_components/Badges";
import { EtapaForm } from "./EtapaForm";
import { resolverPendenciaAction } from "../actions";

export const dynamic = "force-dynamic";

function fmtData(d: Date | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ObraDetalhePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { etapa?: string };
}) {
  const sessao = await exigirSessao();
  const obraId = Number(params.id);
  if (!obraId) notFound();

  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: {
      criadoPor: true,
      etapas: {
        include: {
          template: { include: { setor: true } },
          responsavel: true,
          fotos: true,
          atualizacoes: { include: { usuario: true }, orderBy: { criadoEm: "desc" } },
        },
        orderBy: { template: { numero: "asc" } },
      },
      pendencias: {
        include: { criadoPor: true, etapaObra: { include: { template: true } } },
        orderBy: { criadoEm: "desc" },
      },
    },
  });
  if (!obra) notFound();

  const etapaFoco = searchParams.etapa ? Number(searchParams.etapa) : null;
  const total = obra.etapas.length;
  const concluidas = obra.etapas.filter((e) => e.status === "concluida").length;
  const pct = total ? Math.round((concluidas / total) * 100) : 0;
  const pendenciasAbertas = obra.pendencias.filter((p) => p.status === "aberta");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/obras" className="text-sm text-purpura-600 hover:underline">
          ← Voltar para obras
        </Link>
        <div className="flex items-start justify-between gap-3 mt-2">
          <div>
            <span className="font-mono text-xs text-navy-400">{obra.codigo}</span>
            <h1 className="font-serif text-3xl font-bold text-navy-800">{obra.clienteNome}</h1>
            <div className="text-sm text-navy-600 mt-1 space-y-0.5">
              {obra.endereco ? <p>📍 {obra.endereco}</p> : null}
              {obra.clienteContato ? <p>📞 {obra.clienteContato}</p> : null}
              {obra.descricao ? <p className="text-navy-700">{obra.descricao}</p> : null}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-bold text-purpura-600">{pct}%</div>
            <div className="text-xs text-navy-400">
              {concluidas}/{total} etapas
            </div>
          </div>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-navy-50 overflow-hidden">
          <div className="h-full bg-purpura-500 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Pendências abertas */}
      {pendenciasAbertas.length > 0 ? (
        <section className="card p-4 border-orange-200 bg-orange-50/40">
          <h2 className="font-semibold text-orange-800 mb-2">
            ⚠️ Pendências abertas ({pendenciasAbertas.length})
          </h2>
          <ul className="space-y-2">
            {pendenciasAbertas.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="text-navy-800">{p.descricao}</p>
                  <p className="text-xs text-navy-400 mt-0.5">
                    {p.etapaObra?.template ? `#${p.etapaObra.template.numero} ${p.etapaObra.template.nome} · ` : ""}
                    {p.criadoPor.nome} · {fmtData(p.criadoEm)}
                  </p>
                </div>
                <form action={resolverPendenciaAction}>
                  <input type="hidden" name="pendenciaId" value={p.id} />
                  <input type="hidden" name="obraId" value={obra.id} />
                  <button className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                    Resolver
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Timeline das etapas */}
      <section className="space-y-2">
        <h2 className="font-semibold text-navy-800 text-lg">Andamento — 33 etapas</h2>
        <ol className="space-y-2">
          {obra.etapas.map((e) => {
            const m = setorMeta(e.template.setor.codigo);
            const podeEditar = podeVerSetor(sessao, e.template.setor.codigo);
            const foco = etapaFoco === e.id;
            return (
              <li
                key={e.id}
                id={`etapa-${e.id}`}
                className={`card p-4 ${foco ? "ring-2 ring-purpura-300" : ""} ${
                  e.status === "concluida" ? "opacity-80" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      e.status === "concluida"
                        ? "bg-emerald-500 text-white"
                        : e.status === "travada"
                        ? "bg-rose-500 text-white"
                        : e.status === "em_andamento"
                        ? "bg-amber-500 text-white"
                        : "bg-navy-100 text-navy-600"
                    }`}
                  >
                    {e.status === "concluida" ? "✓" : e.template.numero}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-navy-800">{e.template.nome}</h3>
                      {e.template.isGargalo ? <GargaloBadge /> : null}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      <SetorBadge codigo={e.template.setor.codigo} />
                      <StatusBadge status={e.status} />
                      {e.template.prazoMax > 0 ? (
                        <span className="text-xs text-navy-400">
                          prazo {e.template.prazoMin === e.template.prazoMax ? e.template.prazoMax : `${e.template.prazoMin}–${e.template.prazoMax}`}d
                        </span>
                      ) : null}
                    </div>
                    {e.template.observacoes ? (
                      <p className="text-xs text-navy-500 mt-1.5">{e.template.observacoes}</p>
                    ) : null}

                    {/* Fotos */}
                    {e.fotos.length > 0 ? (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {e.fotos.map((f) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <a key={f.id} href={f.caminho} target="_blank" rel="noreferrer">
                            <img
                              src={f.caminho}
                              alt="Foto da etapa"
                              className="h-16 w-16 rounded-lg object-cover border border-navy-100"
                            />
                          </a>
                        ))}
                      </div>
                    ) : null}

                    {/* Histórico de atualizações */}
                    {e.atualizacoes.length > 0 ? (
                      <ul className="mt-2 space-y-1 border-l-2 border-navy-100 pl-3">
                        {e.atualizacoes.slice(0, 4).map((a) => (
                          <li key={a.id} className="text-xs text-navy-600">
                            <span className="text-navy-400">{fmtData(a.criadoEm)} · {a.usuario.nome}:</span>{" "}
                            {a.texto}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {/* Form de atualização (só quem tem acesso ao setor) */}
                    {podeEditar ? (
                      <EtapaForm
                        etapaObraId={e.id}
                        statusAtual={e.status}
                        mobile={m.codigo === "instalacao" || m.codigo === "almoxarifado"}
                        aberto={foco}
                      />
                    ) : (
                      <p className="text-xs text-navy-400 mt-2 italic">
                        Somente o setor {m.curto} atualiza esta etapa.
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
