import { setorMeta, STATUS_META } from "@/lib/setores";

export function SetorBadge({ codigo }: { codigo: string }) {
  const m = setorMeta(codigo);
  return (
    <span className={`chip ${m.cor} ${m.texto} border-transparent`}>
      <span>{m.emoji}</span>
      {m.curto}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.pendente;
  return (
    <span className={`chip ${m.cor}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.ponto}`} />
      {m.rotulo}
    </span>
  );
}

export function GargaloBadge() {
  return (
    <span className="chip bg-rose-50 text-rose-700 border-rose-200" title="Etapa marcada como gargalo no PCP">
      ⚠️ Gargalo
    </span>
  );
}
