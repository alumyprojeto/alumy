"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { atualizarEtapaAction } from "../actions";
import { STATUS_LISTA } from "@/lib/setores";

const STATUS_ROTULO: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  travada: "Travada / Gargalo",
};

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Salvando..." : "Salvar atualização"}
    </button>
  );
}

export function EtapaForm({
  etapaObraId,
  statusAtual,
  mobile,
  aberto,
}: {
  etapaObraId: number;
  statusAtual: string;
  mobile: boolean;
  aberto: boolean;
}) {
  const [estado, formAction] = useFormState(atualizarEtapaAction, {} as { ok?: boolean; erro?: string });
  const [expandido, setExpandido] = useState(aberto);

  if (!expandido) {
    return (
      <button
        onClick={() => setExpandido(true)}
        className="btn-ghost w-full justify-center text-sm mt-2"
      >
        Atualizar esta etapa
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 rounded-xl bg-creme-50 border border-navy-100 p-4 space-y-3">
      <input type="hidden" name="etapaObraId" value={etapaObraId} />

      <div>
        <label className="label">Status</label>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_LISTA.map((s) => (
            <label
              key={s}
              className="flex items-center gap-2 rounded-lg border border-navy-100 bg-white px-3 py-2 text-sm cursor-pointer has-[:checked]:border-purpura-400 has-[:checked]:bg-purpura-50"
            >
              <input
                type="radio"
                name="status"
                value={s}
                defaultChecked={s === statusAtual}
                className="accent-purpura-500"
              />
              {STATUS_ROTULO[s]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`coment-${etapaObraId}`}>
          Comentário / atualização
        </label>
        <textarea
          id={`coment-${etapaObraId}`}
          name="comentario"
          className="input min-h-[70px]"
          placeholder="O que aconteceu nesta etapa?"
        />
      </div>

      {/* Foto: em setores mobile, abre câmera direto */}
      <div>
        <label className="label" htmlFor={`fotos-${etapaObraId}`}>
          📷 Fotos {mobile ? "(pode tirar na hora)" : ""}
        </label>
        <input
          id={`fotos-${etapaObraId}`}
          name="fotos"
          type="file"
          accept="image/*"
          multiple
          {...(mobile ? { capture: "environment" as const } : {})}
          className="block w-full text-sm text-navy-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-700 file:px-3 file:py-2 file:text-white file:text-sm"
        />
      </div>

      <div>
        <label className="label" htmlFor={`pend-${etapaObraId}`}>
          ⚠️ Registrar pendência (opcional)
        </label>
        <input
          id={`pend-${etapaObraId}`}
          name="pendencia"
          className="input"
          placeholder="Ex.: faltou 1 vidro temperado 8mm"
        />
      </div>

      {estado?.erro ? (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {estado.erro}
        </p>
      ) : null}
      {estado?.ok ? (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          ✓ Atualização salva!
        </p>
      ) : null}

      <div className="flex gap-2">
        <Botao />
        <button type="button" onClick={() => setExpandido(false)} className="btn-ghost">
          Fechar
        </button>
      </div>
    </form>
  );
}
