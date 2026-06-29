"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { criarObraAction } from "../actions";

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Criando..." : "Criar obra"}
    </button>
  );
}

export default function NovaObraPage() {
  const [estado, formAction] = useFormState(criarObraAction, { erro: "" } as { erro: string });

  return (
    <div className="max-w-xl">
      <Link href="/obras" className="text-sm text-purpura-600 hover:underline">
        ← Voltar para obras
      </Link>
      <h1 className="font-serif text-3xl font-bold text-navy-800 mt-2 mb-1">Nova obra</h1>
      <p className="text-navy-600 mb-5">
        Ao criar, as 33 etapas do processo são geradas automaticamente.
      </p>

      <form action={formAction} className="card p-6 space-y-4">
        <div>
          <label className="label" htmlFor="clienteNome">Nome do cliente *</label>
          <input id="clienteNome" name="clienteNome" className="input" required placeholder="Ex.: João da Silva" />
        </div>
        <div>
          <label className="label" htmlFor="clienteContato">Contato (WhatsApp / telefone)</label>
          <input id="clienteContato" name="clienteContato" className="input" placeholder="(00) 00000-0000" />
        </div>
        <div>
          <label className="label" htmlFor="endereco">Endereço da obra</label>
          <input id="endereco" name="endereco" className="input" placeholder="Rua, nº, bairro, cidade" />
        </div>
        <div>
          <label className="label" htmlFor="dataInstalacao">
            Data prevista de instalação
          </label>
          <input id="dataInstalacao" name="dataInstalacao" type="date" className="input" />
          <p className="text-xs text-navy-400 mt-1">
            Usada para calcular semáforo de prazo e marcos D-40 a D+7.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="descricao">Descrição / observações</label>
          <textarea
            id="descricao"
            name="descricao"
            className="input min-h-[90px]"
            placeholder="Ex.: 3 janelas de correr + 1 porta de vidro temperado"
          />
        </div>

        {estado?.erro ? (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {estado.erro}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Botao />
          <Link href="/obras" className="btn-ghost">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
