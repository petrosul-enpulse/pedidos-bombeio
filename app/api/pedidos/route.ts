import { NextResponse } from "next/server";
import { limparCnpj, validarCnpj } from "@/lib/cnpj.mjs";
import { PRODUTOS, LIMITE_MAXIMO, parseQuantidade } from "@/lib/produtos";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const erros: Record<string, string> = {};
  const cnpj = limparCnpj(body.cnpj);
  if (!validarCnpj(cnpj)) erros.cnpj = "CNPJ inválido.";

  const linha: Record<string, number | string> = { cnpj };
  let totalInformado = 0;
  for (const p of PRODUTOS) {
    for (const campo of ["bombeio", "previsao_venda"] as const) {
      const nome = `${p.chave}_${campo}`;
      const v = parseQuantidade(body[nome]);
      if (Number.isNaN(v) || v < 0) erros[nome] = "Valor inválido.";
      else if (v > LIMITE_MAXIMO) erros[nome] = `Máximo ${LIMITE_MAXIMO.toLocaleString("pt-BR")}.`;
      else {
        linha[nome] = v;
        totalInformado += v;
      }
    }
  }
  if (Object.keys(erros).length === 0 && totalInformado === 0)
    erros.geral = "Informe ao menos uma quantidade.";

  if (Object.keys(erros).length > 0) return NextResponse.json({ erros }, { status: 422 });

  linha.user_agent = (req.headers.get("user-agent") ?? "").slice(0, 300);

  try {
    // data_pedido, hora_envio_local e dentro_prazo são carimbados pelo trigger no banco
    const { data, error } = await supabaseAdmin()
      .from("pedidos_bombeio")
      .insert(linha)
      .select("id, data_pedido, hora_envio_local, dentro_prazo")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, pedido: data }, { status: 201 });
  } catch (e) {
    console.error("Falha ao gravar pedido de bombeio", e);
    return NextResponse.json(
      { erro: "Não foi possível registrar o pedido. Tente novamente ou contate a base." },
      { status: 500 }
    );
  }
}
