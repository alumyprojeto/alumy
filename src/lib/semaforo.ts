// Semáforo de prazo e marcos D- para obras

export type AlertaObra = "em_dia" | "atencao" | "atrasado" | "aguardando_obra";

export function calcularAlerta(dataInstalacao: Date | null, pct: number): AlertaObra {
  if (!dataInstalacao) return "em_dia";
  const hoje = new Date();
  const dias = Math.ceil((dataInstalacao.getTime() - hoje.getTime()) / 86400000);
  if (dias < 0) return "atrasado";
  if (dias <= 7) return "aguardando_obra";
  if (dias <= 15 || pct < 50) return "atencao";
  return "em_dia";
}

export const ALERTA_META: Record<AlertaObra, { emoji: string; rotulo: string; cor: string; bg: string }> = {
  em_dia:         { emoji: "✅", rotulo: "Em dia",           cor: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  atencao:        { emoji: "⚠️", rotulo: "Atenção",          cor: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
  atrasado:       { emoji: "🔴", rotulo: "Atrasado / Risco", cor: "text-rose-700",    bg: "bg-rose-50 border-rose-200" },
  aguardando_obra:{ emoji: "🔵", rotulo: "Aguard. obra civil",cor: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
};

// Marcos D- calculados a partir da data de instalação
export interface Marco { rotulo: string; data: Date; passado: boolean }

export function calcularMarcos(dataInstalacao: Date): Marco[] {
  const add = (d: number) => {
    const dt = new Date(dataInstalacao);
    dt.setDate(dt.getDate() + d);
    return dt;
  };
  const hoje = new Date();
  const marcos = [
    { rotulo: "D-40 Pedido material", data: add(-40) },
    { rotulo: "D-25 Receb. materiais", data: add(-25) },
    { rotulo: "D-20 Início produção", data: add(-20) },
    { rotulo: "D-10 Saída fábrica", data: add(-10) },
    { rotulo: "D-7 Confirm. obra civil", data: add(-7) },
    { rotulo: "D+1 Pós-instalação", data: add(1) },
    { rotulo: "D+7 Entrega formal", data: add(7) },
  ];
  return marcos.map((m) => ({ ...m, passado: m.data <= hoje }));
}

export function faseAtual(pct: number, dataInstalacao: Date | null): string {
  if (pct === 100) return "Entregue";
  if (!dataInstalacao) {
    if (pct === 0) return "Vendas";
    if (pct < 20) return "Suprimentos";
    if (pct < 50) return "Produção";
    if (pct < 80) return "Pronto p/ instalação";
    return "Instalando";
  }
  const hoje = new Date();
  const dias = Math.ceil((dataInstalacao.getTime() - hoje.getTime()) / 86400000);
  if (dias > 20) return pct < 30 ? "Suprimentos" : "Produção";
  if (dias > 7) return "Pronto p/ instalação";
  if (dias >= 0) return "Aguardando obra civil";
  return "Instalando";
}
