import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { setorMeta } from "@/lib/setores";
import { NovoUsuario } from "./NovoUsuario";
import { alternarAtivoAction } from "./actions";
import { SetorBadge } from "../../_components/Badges";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  await exigirAdmin();

  const [usuarios, setores] = await Promise.all([
    prisma.usuario.findMany({
      orderBy: [{ isAdmin: "desc" }, { nome: "asc" }],
      include: { setores: { include: { setor: true } } },
    }),
    prisma.setor.findMany({ orderBy: { ordem: "asc" } }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy-800">Usuários</h1>
          <p className="text-navy-600 mt-1">
            A gestão cria os acessos e define o setor de cada pessoa.
          </p>
        </div>
        <NovoUsuario setores={setores} />
      </div>

      <div className="grid gap-3">
        {usuarios.map((u) => (
          <div key={u.id} className="card p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-semibold text-navy-800">{u.nome}</h2>
                <span className="font-mono text-xs text-navy-400">@{u.username}</span>
                {u.isAdmin ? (
                  <span className="chip bg-navy-700 text-white border-transparent">Gestão / Admin</span>
                ) : null}
                {!u.ativo ? (
                  <span className="chip bg-navy-50 text-navy-500 border-navy-100">Inativo</span>
                ) : null}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {u.setores.length ? (
                  u.setores.map((s) => <SetorBadge key={s.setorId} codigo={s.setor.codigo} />)
                ) : (
                  <span className="text-xs text-navy-400">Sem setor</span>
                )}
              </div>
            </div>

            <form action={alternarAtivoAction}>
              <input type="hidden" name="usuarioId" value={u.id} />
              <input type="hidden" name="ativo" value={String(u.ativo)} />
              <button
                className={`text-xs px-2.5 py-1.5 rounded-lg ${
                  u.ativo
                    ? "bg-navy-50 text-navy-600 hover:bg-navy-100"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {u.ativo ? "Desativar" : "Reativar"}
              </button>
            </form>
          </div>
        ))}
      </div>

      <p className="text-xs text-navy-400">
        {setores.length} setores: {setores.map((s) => setorMeta(s.codigo).curto).join(" · ")}
      </p>
    </div>
  );
}
