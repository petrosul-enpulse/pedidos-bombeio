import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin()
      .from("config_bombeio")
      .select("horario_corte, fuso")
      .eq("id", 1)
      .single();
    if (error || !data) throw error ?? new Error("Configuração não encontrada");
    return NextResponse.json(
      { corte: String(data.horario_corte).slice(0, 5), fuso: data.fuso },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Falha ao consultar horário de corte", error);
    return NextResponse.json({ erro: "Horário de corte indisponível." }, { status: 503 });
  }
}
