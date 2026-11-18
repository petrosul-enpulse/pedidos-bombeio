import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PLATFORM_SCHEMA, platformConfigured } from "@/lib/platform/config";
import { createPlatformServerClient } from "@/lib/platform/server";
import { SetupPending } from "../../../setup-pending";

export const dynamic = "force-dynamic";

const formatarData = (value: string) => new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo",
}).format(new Date(value));

export default async function PedidoClientePage({ params }: { params: Promise<{ id: string }> }) {
  if (!platformConfigured()) return <SetupPending />;
  const { id } = await params;
  const supabase = await createPlatformServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acesso?destino=cliente");
  const db = supabase.schema(PLATFORM_SCHEMA);
  const { data: pedido } = await db.from("pedidos").select(
    "id, protocolo, cliente_id, base_id, data_operacional, status, enviado_em, dentro_prazo, corte_aplicado, fuso_aplicado, pedido_substituido_id",
  ).eq("id", id).maybeSingle();
  if (!pedido) notFound();
  const { data: vinculo } = await db.from("usuarios_cliente").select("cliente_id")
    .eq("user_id", user.id).eq("cliente_id", pedido.cliente_id).eq("ativo", true).maybeSingle();
  if (!vinculo) notFound();

  const [{ data: cliente }, { data: base }, { data: itens }, { data: eventos }, { data: novo }] = await Promise.all([
    db.from("clientes").select("razao_social, cnpj").eq("id", pedido.cliente_id).maybeSingle(),
    db.from("bases").select("nome").eq("id", pedido.base_id).maybeSingle(),
    db.from("pedido_itens").select("produto_codigo, produto_nome, unidade, volume_solicitado, previsao_venda_d1, volume_confirmado, motivo_ajuste").eq("pedido_id", id).order("produto_codigo"),
    db.from("pedido_eventos").select("id, tipo, criado_em, dados").eq("pedido_id", id).order("criado_em"),
    db.from("pedidos").select("id, protocolo").eq("pedido_substituido_id", id).limit(1).maybeSingle(),
  ]);

  return <main className="platform-content">
    <div className="platform-page-heading"><div><Link href="/cliente">← Voltar aos pedidos</Link>
      <span className="platform-kicker" style={{ display: "block", marginTop: 20 }}>Acompanhamento do cliente</span>
      <h1>{pedido.protocolo}</h1><p>{cliente?.razao_social ?? "Cliente"} · {base?.nome ?? "Base"} · {pedido.data_operacional}</p></div>
      {["recebido", "em_analise"].includes(pedido.status) && <Link className="platform-button platform-button-secondary" href={`/cliente/novo?substituir=${pedido.id}`}>Reenviar pedido</Link>}
    </div>
    <div className="platform-grid">
      <div className="platform-card platform-stat"><span className="platform-kicker">Situação</span><strong style={{ fontSize: 22, textTransform: "capitalize" }}>{pedido.status.replaceAll("_", " ")}</strong></div>
      <div className="platform-card platform-stat"><span className="platform-kicker">Prazo</span><strong style={{ fontSize: 22 }}>{pedido.dentro_prazo ? "No prazo" : "Após o corte"}</strong><small>Corte {pedido.corte_aplicado} · {pedido.fuso_aplicado}</small></div>
      <div className="platform-card platform-stat"><span className="platform-kicker">Envio oficial</span><strong style={{ fontSize: 22 }}>{formatarData(pedido.enviado_em)}</strong></div>
    </div>
    {(pedido.pedido_substituido_id || novo) && <section className="platform-card platform-section"><h2>Versões do pedido</h2>
      {pedido.pedido_substituido_id && <p>Este pedido substitui <Link href={`/cliente/pedidos/${pedido.pedido_substituido_id}`}>o protocolo anterior</Link>.</p>}
      {novo && <p>Este pedido foi substituído por <Link href={`/cliente/pedidos/${novo.id}`}>{novo.protocolo}</Link>.</p>}
    </section>}
    <section className="platform-section"><h2>Volumes em m³</h2><div className="platform-table-wrap"><table className="platform-table">
      <thead><tr><th>Produto</th><th>Solicitado</th><th>Previsão D+1</th><th>Confirmado</th><th>Justificativa</th></tr></thead>
      <tbody>{(itens ?? []).map((item) => <tr key={item.produto_codigo}><td><strong>{item.produto_nome}</strong></td>
        <td>{item.volume_solicitado} {item.unidade}</td><td>{item.previsao_venda_d1} {item.unidade}</td>
        <td>{item.volume_confirmado == null ? "—" : `${item.volume_confirmado} ${item.unidade}`}</td>
        <td>{item.motivo_ajuste ?? "—"}</td></tr>)}</tbody>
    </table></div></section>
    <section className="platform-section"><h2>Histórico</h2><div className="platform-card">
      {(eventos ?? []).length ? <ol>{eventos?.map((evento) => <li key={evento.id}>
        <strong>{evento.tipo.replaceAll("_", " ")}</strong> · {formatarData(evento.criado_em)}
        {typeof evento.dados?.motivo_publico === "string" ? ` · ${evento.dados.motivo_publico}` : ""}
      </li>)}</ol> : <p>Nenhum evento registrado.</p>}
    </div></section>
  </main>;
}
