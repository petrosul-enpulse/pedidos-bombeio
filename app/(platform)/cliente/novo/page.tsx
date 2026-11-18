import { notFound, redirect } from "next/navigation";
import { PLATFORM_SCHEMA, platformConfigured } from "@/lib/platform/config";
import { createPlatformServerClient } from "@/lib/platform/server";
import { SetupPending } from "../../setup-pending";
import { PedidoForm } from "./pedido-form";

export const dynamic = "force-dynamic";

export default async function NovoPedidoPage({ searchParams }: {
  searchParams: Promise<{ substituir?: string }>;
}) {
  if (!platformConfigured()) return <SetupPending />;
  const supabase = await createPlatformServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acesso?destino=cliente");
  const db = supabase.schema(PLATFORM_SCHEMA);
  const { substituir } = await searchParams;
  const { data: anterior } = substituir
    ? await db.from("pedidos").select("id, protocolo, cliente_id, base_id, status")
      .eq("id", substituir).maybeSingle()
    : { data: null };
  if (substituir && (!anterior || !["recebido", "em_analise"].includes(anterior.status))) notFound();
  const { data: vinculos, error: vinculosErro } = await db.from("usuarios_cliente")
    .select("cliente_id").eq("user_id", user.id).eq("ativo", true);
  if (vinculosErro || !vinculos?.length) return <main className="platform-content"><p className="platform-error">Nenhum cliente autorizado para seu acesso.</p></main>;
  const ids = anterior ? [anterior.cliente_id] : vinculos.map((v) => v.cliente_id);
  if (anterior && !vinculos.some((v) => v.cliente_id === anterior.cliente_id)) notFound();
  const [{ data: clientes }, { data: permissoes }, { data: bases }, { data: produtos }] = await Promise.all([
    db.from("clientes").select("id, razao_social, cnpj").in("id", ids).eq("ativo", true),
    db.from("clientes_bases").select("cliente_id, base_id").in("cliente_id", ids).eq("ativo", true),
    anterior ? db.from("bases").select("id, nome, codigo").eq("id", anterior.base_id).eq("ativo", true)
      : db.from("bases").select("id, nome, codigo").eq("ativo", true),
    db.from("produtos").select("codigo, nome, unidade").eq("ativo", true).order("ordem"),
  ]);
  if (!clientes?.length || !permissoes?.length || !bases?.length || !produtos?.length) {
    return <main className="platform-content"><p className="platform-error">Cadastro operacional incompleto. Solicite à Enpulse a liberação do cliente e da base.</p></main>;
  }
  const { data: itensAnteriores } = anterior
    ? await db.from("pedido_itens").select("produto_codigo, volume_solicitado, previsao_venda_d1").eq("pedido_id", anterior.id)
    : { data: null };
  const valoresIniciais = Object.fromEntries((itensAnteriores ?? []).map((item) => [item.produto_codigo, {
    solicitado: String(item.volume_solicitado), previsao: String(item.previsao_venda_d1),
  }]));
  return <main className="platform-content"><div className="platform-page-heading"><div>
    <span className="platform-kicker">Portal do cliente · {anterior ? "reenvio" : "novo pedido"}</span><h1>{anterior ? "Reenviar pedido" : "Solicitar bombeio"}</h1>
    <p>Informe os volumes em m³ e revise antes de enviar. O prazo é registrado pelo banco no momento do envio.</p>
  </div></div><PedidoForm clientes={clientes} bases={bases} permissoes={permissoes} produtos={produtos}
    anteriorId={anterior?.id} anteriorProtocolo={anterior?.protocolo} valoresIniciais={valoresIniciais} /></main>;
}
