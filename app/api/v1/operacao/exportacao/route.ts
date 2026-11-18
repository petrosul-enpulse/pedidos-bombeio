import { NextResponse } from "next/server";
import { PLATFORM_SCHEMA, platformConfigured } from "@/lib/platform/config";
import { ordersToCsv } from "@/lib/platform/csv";
import { createPlatformServerClient } from "@/lib/platform/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!platformConfigured()) return NextResponse.json({ codigo: "unavailable" }, { status: 503 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ codigo: "forbidden" }, { status: 403 });
  let body: { data?: unknown; base?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ codigo: "invalid" }, { status: 400 }); }
  if (!body || typeof body.data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.data) ||
    (body.base != null && typeof body.base !== "string")) {
    return NextResponse.json({ codigo: "invalid", mensagem: "Filtro inválido." }, { status: 422 });
  }
  const supabase = await createPlatformServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ codigo: "unauthorized" }, { status: 401 });
  const { data, error } = await supabase.schema(PLATFORM_SCHEMA).rpc("exportar_pedidos", {
    p_data: body.data, p_base_id: body.base || null,
  });
  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "22023" ? 422 : 500;
    return NextResponse.json({ codigo: "rejected", mensagem: status === 500 ? "Exportação indisponível." : error.message }, { status });
  }
  return new Response(ordersToCsv(data ?? []), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="enpulse-bombeio-${body.data}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
