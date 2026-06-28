import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const COOKIE = "alumy_sessao";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-troque-em-producao"
);

export type Sessao = {
  id: number;
  username: string;
  nome: string;
  isAdmin: boolean;
  setores: string[]; // códigos dos setores
};

// ----- Login / sessão -----

export async function verificarCredenciais(username: string, senha: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { username: username.trim().toLowerCase() },
    include: { setores: { include: { setor: true } } },
  });
  if (!usuario || !usuario.ativo) return null;
  const ok = await bcrypt.compare(senha, usuario.senhaHash);
  if (!ok) return null;
  return usuario;
}

export async function criarSessao(sessao: Sessao) {
  const token = await new SignJWT(sessao as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function lerSessao(): Promise<Sessao | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as number,
      username: payload.username as string,
      nome: payload.nome as string,
      isAdmin: payload.isAdmin as boolean,
      setores: (payload.setores as string[]) ?? [],
    };
  } catch {
    return null;
  }
}

export function encerrarSessao() {
  cookies().delete(COOKIE);
}

// ----- Helpers de permissão -----

// Setores que o usuário enxerga. Admin vê todos.
export async function setoresVisiveis(sessao: Sessao): Promise<string[]> {
  if (sessao.isAdmin) {
    const todos = await prisma.setor.findMany({ orderBy: { ordem: "asc" } });
    return todos.map((s) => s.codigo);
  }
  return sessao.setores;
}

export function podeVerSetor(sessao: Sessao, setorCodigo: string): boolean {
  return sessao.isAdmin || sessao.setores.includes(setorCodigo);
}

export async function hashSenha(senha: string) {
  return bcrypt.hash(senha, 10);
}
