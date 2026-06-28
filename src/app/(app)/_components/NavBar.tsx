import Link from "next/link";
import { type Sessao } from "@/lib/auth";
import { sairAction } from "../sair/actions";

export function NavBar({ sessao }: { sessao: Sessao }) {
  const iniciais = sessao.nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-navy-700 text-white shadow-md">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between gap-3">
        <Link href="/painel" className="flex items-center gap-2 font-serif font-bold text-lg">
          <span className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center">A</span>
          Alumy PCP
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link href="/painel" className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition">
            Painel
          </Link>
          <Link href="/obras" className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition">
            Obras
          </Link>
          {sessao.isAdmin ? (
            <Link href="/admin/usuarios" className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition">
              Usuários
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-medium">{sessao.nome}</span>
            <span className="text-[11px] text-white/60">
              {sessao.isAdmin ? "Gestão" : sessao.setores.join(", ") || "—"}
            </span>
          </div>
          <span className="h-8 w-8 rounded-full bg-purpura-500 flex items-center justify-center text-xs font-bold">
            {iniciais}
          </span>
          <form action={sairAction}>
            <button
              type="submit"
              className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
              title="Sair"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
