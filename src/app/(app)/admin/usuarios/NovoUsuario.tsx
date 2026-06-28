"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { criarUsuarioAction } from "./actions";
import { setorMeta } from "@/lib/setores";

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Criando..." : "Criar usuário"}
    </button>
  );
}

export function NovoUsuario({ setores }: { setores: { codigo: string; nome: string }[] }) {
  const [aberto, setAberto] = useState(false);
  const [estado, formAction] = useFormState(criarUsuarioAction, {} as { ok?: boolean; erro?: string });

  if (estado?.ok && aberto) {
    // fecha automaticamente após sucesso
    setTimeout(() => setAberto(false), 50);
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="btn-primary">
        + Novo usuário
      </button>
    );
  }

  return (
    <form action={formAction} className="card p-6 space-y-4">
      <h2 className="font-semibold text-navy-800 text-lg">Novo usuário</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="nome">Nome</label>
          <input id="nome" name="nome" className="input" required placeholder="Ex.: Eduardo Souza" />
        </div>
        <div>
          <label className="label" htmlFor="username">Usuário (login)</label>
          <input id="username" name="username" className="input" required placeholder="eduardo" autoCapitalize="none" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="senha">Senha inicial</label>
        <input id="senha" name="senha" className="input" required placeholder="mínimo 4 caracteres" />
      </div>

      <div>
        <label className="label">Setores de acesso</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {setores.map((s) => {
            const m = setorMeta(s.codigo);
            return (
              <label
                key={s.codigo}
                className="flex items-center gap-2 rounded-lg border border-navy-100 bg-white px-3 py-2 text-sm cursor-pointer has-[:checked]:border-purpura-400 has-[:checked]:bg-purpura-50"
              >
                <input type="checkbox" name="setores" value={s.codigo} className="accent-purpura-500" />
                <span>{m.emoji} {m.curto}</span>
              </label>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isAdmin" className="accent-purpura-500" />
        É da gestão (vê tudo e administra usuários)
      </label>

      {estado?.erro ? (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{estado.erro}</p>
      ) : null}

      <div className="flex gap-2">
        <Botao />
        <button type="button" onClick={() => setAberto(false)} className="btn-ghost">Cancelar</button>
      </div>
    </form>
  );
}
