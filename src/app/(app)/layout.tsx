import { exigirSessao } from "@/lib/sessao";
import { NavBar } from "./_components/NavBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await exigirSessao();

  return (
    <div className="min-h-screen">
      <NavBar sessao={sessao} />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-24">{children}</main>
    </div>
  );
}
