import { NextResponse } from "next/server";
import { PLATFORM_SCHEMA, platformConfigured } from "@/lib/platform/config";
import { parseOrderInput, validIdempotencyKey } from "@/lib/platform/order";
import { createPlatformServerClient } from "@/lib/platform/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!platformConfigured()) return NextResponse.json({ codigo: "unavailable", mensagem: "Plataforma ainda não configurada." }, { status: 503 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ codigo: "forbidden", mensagem: "Origem não autorizada." }, { status: 403 });
  }
  const key = request.headers.get("Idempotency-Key");
  if (!validIdempotencyKey(key)) {
    return NextResponse.json({ codigo: "invalid", mensagem: "Chave de tentativa inválida." }, { status: 422 });
  }

  let input: unknown;
  try { input = await request.json(); } catch {
    return NextResponse.json({ codigo: "invalid", mensagem: "JSON inválido." }, { status: 400 });
  }
  const order = parseOrderInput(input);
  if (!order) return NextResponse.json({ codigo: "invalid", mensagem: "Confira cliente, base e volumes." }, { status: 422 });

  const supabase = await createPlatformServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ codigo: "unauthorized", mensagem: "Entre novamente para enviar." }, { status: 401 });

  const { data, error } = await supabase.schema(PLATFORM_SCHEMA).rpc("criar_pedido", {
    p_cliente_id: order.cliente_id,
    p_base_id: order.base_id,
    p_chave_idempotencia: key,
    p_itens: order.itens,
    p_pedido_substituido_id: null,
  });
  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "23505" ? 409 : error.code === "22023" ? 422 : 500;
    return NextResponse.json({ codigo: status === 500 ? "internal" : "rejected", mensagem: status === 500 ? "Não foi possível registrar o pedido." : error.message }, { status });
  }
  return NextResponse.json({ pedido: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
