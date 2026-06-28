import { redirect } from "next/navigation";
import { lerSessao, type Sessao } from "./auth";

// Exige sessão válida em Server Components. Redireciona para /login se não houver.
export async function exigirSessao(): Promise<Sessao> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");
  return sessao;
}

// Exige que o usuário seja admin (gestão).
export async function exigirAdmin(): Promise<Sessao> {
  const sessao = await exigirSessao();
  if (!sessao.isAdmin) redirect("/painel");
  return sessao;
}
