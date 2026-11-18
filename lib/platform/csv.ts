type ExportItem = {
  produto: string; unidade: string; solicitado: number; previsao_d1: number; confirmado: number | null;
};
type ExportOrder = {
  protocolo: string; cliente_cnpj: string; cliente_nome: string; base: string;
  data_operacional: string; enviado_em: string; status: string; dentro_prazo: boolean;
  pedido_substituido_id: string | null; itens: ExportItem[];
};

function cell(value: string | number | boolean | null | undefined) {
  const raw = value == null ? "" : String(value);
  // Excel pode executar texto vindo de cadastros como fórmula ao abrir CSV.
  const safe = /^[\s]*[=+@-]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function ordersToCsv(orders: ExportOrder[]) {
  const headings = ["Protocolo", "CNPJ", "Cliente", "Base", "Data operacional",
    "Envio UTC", "Situação", "No prazo", "Pedido anterior", "Produto", "Unidade",
    "Solicitado", "Previsão D+1", "Confirmado"];
  const lines = [headings.map(cell).join(";")];
  for (const order of orders) for (const item of order.itens) {
    lines.push([
      order.protocolo, order.cliente_cnpj, order.cliente_nome, order.base,
      order.data_operacional, order.enviado_em, order.status,
      order.dentro_prazo ? "sim" : "não", order.pedido_substituido_id,
      item.produto, item.unidade, item.solicitado, item.previsao_d1, item.confirmado,
    ].map(cell).join(";"));
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
