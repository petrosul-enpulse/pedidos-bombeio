import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PLATFORM_SCHEMA, platformConfigured } from "@/lib/platform/config";
import { createPlatformServerClient } from "@/lib/platform/server";
import { SetupPending } from "../../../setup-pending";
import { OperacaoActions } from "./operacao-actions";

export const dynamic = "force-dynamic";

export default async function PedidoOperacaoPage({ params }: { params: Promise<{ id: string }> }) {
  if (!platformConfigured()) return <SetupPending />;
  const { id } = await params;
  const supabase = await createPlatformServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acesso?destino=operacao");
  const db = supabase.schema(PLATFORM_SCHEMA);
  const { data: pedido } = await db.from("pedidos").select("id, protocolo, cliente_id, base_id, data_operacional, status, dentro_prazo, enviado_em, versao")
    .eq("id", id).maybeSingle();
  if (!pedido) notFound();
  const [{ data: itens }, { data: eventos }, { data: cliente }, { data: integrante }] = await Promise.all([
    db.from("pedido_itens").select("produto_codigo, produto_nome, unidade, volume_solicitado, previsao_venda_d1, volume_confirmado, motivo_ajuste").eq("pedido_id", id).order("produto_codigo"),
    db.from("pedido_eventos").select("id, tipo, criado_em, dados").eq("pedido_id", id).order("criado_em"),
    db.from("clientes").select("razao_social, cnpj").eq("id", pedido.cliente_id).maybeSingle(),
    db.from("usuarios_enpulse").select("papel").eq("user_id", user.id).maybeSingle(),
  ]);

  return <main className="platform-content">
    <div className="platform-page-heading"><div><Link href="/operacao">← Voltar à fila</Link><span className="platform-kicker" style={{ display: "block", marginTop: 20 }}>Detalhe do pedido</span>
      <h1>{pedido.protocolo}</h1><p>{cliente?.razao_social ?? "Cliente"} · {cliente?.cnpj ?? ""} · {pedido.data_operacional}</p></div>
      <span className="platform-badge">{pedido.status.replaceAll("_", " ")}</span></div>
    <div className="platform-grid">
      <div className="platform-card platform-stat"><span className="platform-kicker">Situação</span><strong style={{ fontSize: 22, textTransform: "capitalize" }}>{pedido.status.replaceAll("_", " ")}</strong></div>
      <div className="platform-card platform-stat"><span className="platform-kicker">Prazo</span><strong style={{ fontSize: 22 }}>{pedido.dentro_prazo ? "No prazo" : "Após corte"}</strong></div>
      <div className="platform-card platform-stat"><span className="platform-kicker">Versão</span><strong>{pedido.versao}</strong></div>
    </div>
    <section className="platform-section"><h2>Volumes</h2><div className="platform-table-wrap"><table className="platform-table">
      <thead><tr><th>Produto</th><th>Solicitado</th><th>Previsão D+1</th><th>Confirmado</th></tr></thead>
      <tbody>{(itens ?? []).map((item) => <tr key={item.produto_codigo}><td><strong>{item.produto_nome}</strong></td><td>{item.volume_solicitado} {item.unidade}</td><td>{item.previsao_venda_d1} {item.unidade}</td><td>{item.volume_confirmado ?? "—"} {item.volume_confirmado == null ? "" : item.unidade}</td></tr>)}</tbody>
    </table></div></section>
    {integrante && <OperacaoActions pedidoId={pedido.id} versao={pedido.versao} status={pedido.status} papel={integrante.papel} itens={(itens ?? []).map((item) => ({ codigo: item.produto_codigo, nome: item.produto_nome, solicitado: String(item.volume_solicitado), unidade: item.unidade }))} />}
    <section className="platform-section"><h2>Histórico</h2><div className="platform-card">
      {(eventos ?? []).length ? <ol>{eventos?.map((evento) => <li key={evento.id}><strong>{evento.tipo.replaceAll("_", " ")}</strong> · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(evento.criado_em))}{evento.dados?.motivo_publico ? ` · ${evento.dados.motivo_publico}` : ""}</li>)}</ol> : <p>Nenhum evento registrado.</p>}
    </div></section>
  </main>;
}
