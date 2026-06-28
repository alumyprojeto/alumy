// Metadados dos setores usados na UI (cores, ícones, rótulos).
// A fonte da verdade dos setores é o banco; isto é só apresentação.

export type SetorMeta = {
  codigo: string;
  nome: string;
  curto: string;
  cor: string; // classe tailwind de fundo
  texto: string; // classe tailwind de texto
  emoji: string;
};

export const SETOR_META: Record<string, SetorMeta> = {
  gestao: { codigo: "gestao", nome: "Gestão / PCP", curto: "Gestão", cor: "bg-navy-700", texto: "text-white", emoji: "🧭" },
  vendas: { codigo: "vendas", nome: "Vendas / Pré-venda", curto: "Vendas", cor: "bg-purpura-500", texto: "text-white", emoji: "💬" },
  financeiro: { codigo: "financeiro", nome: "Financeiro / Contrato", curto: "Financeiro", cor: "bg-emerald-600", texto: "text-white", emoji: "💰" },
  almoxarifado: { codigo: "almoxarifado", nome: "Almoxarifado", curto: "Almoxarifado", cor: "bg-orange-500", texto: "text-white", emoji: "📦" },
  compras: { codigo: "compras", nome: "Compras", curto: "Compras", cor: "bg-amber-500", texto: "text-white", emoji: "🛒" },
  producao: { codigo: "producao", nome: "Produção", curto: "Produção", cor: "bg-sky-600", texto: "text-white", emoji: "🏭" },
  instalacao: { codigo: "instalacao", nome: "Instalação", curto: "Instalação", cor: "bg-rose-600", texto: "text-white", emoji: "🔧" },
};

export function setorMeta(codigo: string): SetorMeta {
  return (
    SETOR_META[codigo] ?? {
      codigo,
      nome: codigo,
      curto: codigo,
      cor: "bg-navy-700",
      texto: "text-white",
      emoji: "•",
    }
  );
}

// Status das etapas: rótulo + cor.
export const STATUS_META: Record<string, { rotulo: string; cor: string; ponto: string }> = {
  pendente: { rotulo: "Pendente", cor: "bg-navy-50 text-navy-700 border-navy-100", ponto: "bg-navy-300" },
  em_andamento: { rotulo: "Em andamento", cor: "bg-amber-50 text-amber-700 border-amber-200", ponto: "bg-amber-500" },
  concluida: { rotulo: "Concluída", cor: "bg-emerald-50 text-emerald-700 border-emerald-200", ponto: "bg-emerald-500" },
  travada: { rotulo: "Travada / Gargalo", cor: "bg-rose-50 text-rose-700 border-rose-200", ponto: "bg-rose-500" },
};

export const STATUS_LISTA = ["pendente", "em_andamento", "concluida", "travada"] as const;
