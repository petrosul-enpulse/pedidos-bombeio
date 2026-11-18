import { NextResponse } from "next/server";
import { PLATFORM_SCHEMA, platformConfigured } from "@/lib/platform/config";
import { parseOrderInput, validIdempotencyKey } from "@/lib/platform/order";
import { createPlatformServerClient } from "@/lib/platform/server";

export const runtime = "nodejs";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const volume = /^(?:0|[1-9][0-9]{0,5})(?:\.[0-9]{1,3})?$/;

export async function POST(request: Request, { params }: {
  params: Promise<{ id: string; acao: string }>;
}) {
  if (!platformConfigured()) return NextResponse.json({ codigo: "unavailable", mensagem: "Plataforma ainda não configurada." }, { status: 503 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ codigo: "forbidden", mensagem: "Origem não autorizada." }, { status: 403 });
  const { id, acao } = await params;
  if (!uuid.test(id) || !["assumir", "confirmar", "recusar", "reenvios"].includes(acao)) return NextResponse.json({ codigo: "not_found", mensagem: "Ação inexistente." }, { status: 404 });
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("body");
    body = parsed as Record<string, unknown>;
  } catch { return NextResponse.json({ codigo: "invalid", mensagem: "JSON inválido." }, { status: 400 }); }
  if (acao === "reenvios") {
    const key = request.headers.get("Idempotency-Key");
    const order = parseOrderInput(body);
    if (!validIdempotencyKey(key) || !order) {
      return NextResponse.json({ codigo: "invalid", mensagem: "Confira os volumes e a chave da tentativa." }, { status: 422 });
    }
    const supabase = await createPlatformServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ codigo: "unauthorized", mensagem: "Entre novamente." }, { status: 401 });
    const { data, error } = await supabase.schema(PLATFORM_SCHEMA).rpc("criar_pedido", {
      p_cliente_id: order.cliente_id, p_base_id: order.base_id,
      p_chave_idempotencia: key, p_itens: order.itens,
      p_pedido_substituido_id: id,
    });
    if (error) {
      const status = error.code === "42501" ? 403 : ["40001", "23505"].includes(error.code) ? 409 : error.code === "22023" ? 422 : 500;
      return NextResponse.json({ codigo: status === 500 ? "internal" : "rejected", mensagem: status === 500 ? "Não foi possível reenviar o pedido." : error.message }, { status });
    }
    return NextResponse.json({ pedido: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  }
  if (!Number.isInteger(body.versao) || Number(body.versao) < 1) return NextResponse.json({ codigo: "invalid", mensagem: "Versão inválida." }, { status: 422 });

  const args: Record<string, unknown> = { p_pedido_id: id, p_versao: body.versao };
  if (acao === "confirmar") {
    if (!Array.isArray(body.itens) || body.itens.length === 0 || body.itens.some((item) =>
      !item || typeof item !== "object" || typeof item.produto_codigo !== "string" ||
      typeof item.volume_confirmado !== "string" || !volume.test(item.volume_confirmado))) {
      return NextResponse.json({ codigo: "invalid", mensagem: "Volumes confirmados inválidos." }, { status: 422 });
    }
    args.p_itens = body.itens;
    args.p_motivo = typeof body.motivo === "string" ? body.motivo.trim() : null;
  }
  if (acao === "recusar") {
    if (typeof body.motivo !== "string" || !body.motivo.trim()) return NextResponse.json({ codigo: "invalid", mensagem: "Informe o motivo da recusa." }, { status: 422 });
    args.p_motivo = body.motivo.trim();
  }

  const supabase = await createPlatformServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ codigo: "unauthorized", mensagem: "Entre novamente." }, { status: 401 });
  const { data, error } = await supabase.schema(PLATFORM_SCHEMA).rpc(`${acao}_pedido`, args);
  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "40001" ? 409 : error.code === "22023" ? 422 : 500;
    return NextResponse.json({ codigo: status === 500 ? "internal" : "rejected", mensagem: status === 500 ? "Não foi possível concluir a ação." : error.message }, { status });
  }
  return NextResponse.json({ pedido: data }, { headers: { "Cache-Control": "no-store" } });
}
