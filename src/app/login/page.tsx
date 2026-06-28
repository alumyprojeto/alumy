"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "./actions";

function BotaoEntrar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full text-base py-3" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}

export default function LoginPage() {
  const [estado, formAction] = useFormState(loginAction, { erro: "" } as { erro: string });

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-creme-100 to-navy-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-navy-700 text-white flex items-center justify-center text-2xl font-serif font-bold shadow-lg">
            A
          </div>
          <h1 className="font-serif text-3xl font-bold text-navy-800">Alumy PCP</h1>
          <p className="text-sm text-navy-600 mt-1">Acompanhamento de Obras</p>
        </div>

        <form action={formAction} className="card p-6 space-y-4">
          <div>
            <label className="label" htmlFor="username">
              Usuário
            </label>
            <input
              id="username"
              name="username"
              className="input"
              placeholder="seu.usuario"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {estado?.erro ? (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {estado.erro}
            </p>
          ) : null}

          <BotaoEntrar />
        </form>

        <p className="text-center text-xs text-navy-500 mt-6">
          Não tem acesso? Fale com a gestão (Nayla) para criar seu usuário.
        </p>
      </div>
    </main>
  );
}
