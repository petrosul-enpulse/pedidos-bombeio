// Produtos do formulário. Para incluir um produto: adicionar aqui + 2 colunas na tabela.
export const UNIDADE = "m³";

export const PRODUTOS = [
  { chave: "gas_a", nome: "GAS A" },
  { chave: "s500_a", nome: "S500 A" },
  { chave: "s10_a", nome: "S10 A" },
] as const;

export type ChaveProduto = (typeof PRODUTOS)[number]["chave"];

export const LIMITE_MAXIMO = 100_000; // trava contra erro de digitação (ex.: litros no lugar de m³)

/** Aceita "1.500,25", "1500,25" ou "1500.25". Vazio = 0. Retorna NaN se inválido. */
export function parseQuantidade(v: unknown): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "").trim().replace(/\s/g, "");
  if (s === "") return 0;
  const normalizado = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  if (!/^\d+(\.\d{1,3})?$/.test(normalizado)) return NaN;
  return Number(normalizado);
}
