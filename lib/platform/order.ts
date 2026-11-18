export type OrderItemInput = {
  produto_codigo: string;
  volume_solicitado: string;
  previsao_venda_d1: string;
};

export type OrderInput = {
  cliente_id: string;
  base_id: string;
  itens: OrderItemInput[];
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const volume = /^(?:0|[1-9][0-9]{0,5})(?:\.[0-9]{1,3})?$/;

export function parseOrderInput(value: unknown): OrderInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.cliente_id !== "string" || !uuid.test(body.cliente_id)) return null;
  if (typeof body.base_id !== "string" || !uuid.test(body.base_id)) return null;
  if (!Array.isArray(body.itens) || body.itens.length < 1 || body.itens.length > 20) return null;

  const items: OrderItemInput[] = [];
  const seen = new Set<string>();
  let total = 0;
  for (const entry of body.itens) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const item = entry as Record<string, unknown>;
    const code = item.produto_codigo;
    const requested = item.volume_solicitado;
    const forecast = item.previsao_venda_d1;
    if (typeof code !== "string" || !/^[A-Z0-9_]{1,30}$/.test(code) || seen.has(code)) return null;
    if (typeof requested !== "string" || !volume.test(requested)) return null;
    if (typeof forecast !== "string" || !volume.test(forecast)) return null;
    seen.add(code);
    total += Number(requested) + Number(forecast);
    items.push({ produto_codigo: code, volume_solicitado: requested, previsao_venda_d1: forecast });
  }
  if (total <= 0) return null;
  return { cliente_id: body.cliente_id, base_id: body.base_id, itens: items };
}

export function validIdempotencyKey(value: string | null) {
  return Boolean(value && uuid.test(value));
}
