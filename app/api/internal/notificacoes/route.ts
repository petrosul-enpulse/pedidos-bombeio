import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { PLATFORM_SCHEMA } from "@/lib/platform/config";

export const runtime = "nodejs";

type Notification = {
  id: number; destinatario: string; modelo: string; protocolo: string;
  pedido_id: string; motivo: string | null; tentativas: number;
};

function authorized(header: string | null, secret: string) {
  const received = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(received);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const token = process.env.NOTIFICATION_WORKER_TOKEN;
  const serviceKey = process.env.SUPABASE_PLATFORM_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.ENPULSE_EMAIL_FROM;
  const site = process.env.PLATFORM_PUBLIC_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!token || token.length < 32 || !serviceKey || !resendKey || !from || !site || !supabaseUrl) {
    return NextResponse.json({ codigo: "unavailable" }, { status: 503 });
  }
  if (!authorized(request.headers.get("authorization"), token)) {
    return NextResponse.json({ codigo: "unauthorized" }, { status: 401 });
  }
  let publicUrl: URL;
  try {
    publicUrl = new URL(site);
    if (publicUrl.protocol !== "https:") throw new Error("protocol");
  } catch { return NextResponse.json({ codigo: "configuration_error" }, { status: 503 }); }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }).schema(PLATFORM_SCHEMA);
  const { data, error } = await admin.rpc("reservar_notificacoes", { p_limite: 10 });
  if (error) return NextResponse.json({ codigo: "queue_error" }, { status: 503 });
  let sent = 0;
  let failed = 0;
  for (const notification of (data ?? []) as Notification[]) {
    const url = new URL(`/cliente/pedidos/${notification.pedido_id}`, publicUrl).toString();
    const confirmed = notification.modelo === "pedido_confirmado";
    const subject = `Enpulse · pedido ${notification.protocolo} ${confirmed ? "confirmado" : "recusado"}`;
    const body = `O pedido ${notification.protocolo} foi ${confirmed ? "confirmado" : "recusado"}.\n` +
      (notification.motivo ? `Motivo: ${notification.motivo}\n` : "") +
      `Consulte o histórico em ${url}`;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `enpulse-bombeio-${notification.id}`,
        },
        body: JSON.stringify({ from, to: [notification.destinatario], subject, text: body }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { error: updateError } = await admin.from("notificacoes_outbox")
        .update({ estado: "enviada", enviada_em: new Date().toISOString(), reserva_ate: null })
        .eq("id", notification.id);
      if (updateError) throw new Error("Falha de registro após envio");
      sent++;
    } catch (cause) {
      failed++;
      const reason = cause instanceof Error ? cause.message.slice(0, 100) : "Falha de envio";
      const seconds = Math.min(3600, 30 * 2 ** Math.min(notification.tentativas, 7));
      await admin.from("notificacoes_outbox").update({
        estado: "falha", reserva_ate: null, ultimo_erro: reason,
        proximo_envio_em: new Date(Date.now() + seconds * 1000).toISOString(),
      }).eq("id", notification.id);
    }
  }
  return NextResponse.json({ processadas: (data ?? []).length, enviadas: sent, falhas: failed }, {
    headers: { "Cache-Control": "no-store" },
  });
}
