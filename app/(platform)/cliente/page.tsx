import Link from "next/link";
import { redirect } from "next/navigation";
import { PLATFORM_SCHEMA, platformConfigured } from "@/lib/platform/config";
import { createPlatformServerClient } from "@/lib/platform/server";
import { SetupPending } from "../setup-pending";

export const dynamic = "force-dynamic";

export default async function ClientePage() {
  if (!platformConfigured()) return <SetupPending />;
  const supabase = await createPlatformServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acesso?destino=cliente");

  const db = supabase.schema(PLATFORM_SCHEMA);
  const { data: vinculos, error: vinculosErro } = await db.from("usuarios_cliente")
    .select("cliente_id").eq("user_id", user.id).eq("ativo", true);
  if (vinculosErro) return <main className="platform-content"><p className="platform-error">Não foi possível carregar seu acesso. Tente novamente.</p></main>;
  const clienteIds = (vinculos ?? []).map((v) => v.cliente_id);
  if (clienteIds.length === 0) {
    return <main className="platform-content"><div className="platform-empty"><h1>Seu acesso ainda não tem um cliente</h1><p>Peça à Enpulse para vincular seu e-mail à empresa autorizada.</p></div></main>;
  }

  const [{ data: clientes }, { data: pedidos }] = await Promise.all([
    db.from("clientes").select("id, razao_social, cnpj").in("id", clienteIds).order("razao_social"),
    db.from("pedidos").select("id, protocolo, cliente_id, data_operacional, status, dentro_prazo, enviado_em")
      .in("cliente_id", clienteIds).order("enviado_em", { ascending: false }).limit(20),
  ]);
  const nomePorId = new Map((clientes ?? []).map((c) => [c.id, c.razao_social]));

  return (
    <main className="platform-content">
      <div className="platform-page-heading">
        <div><span className="platform-kicker">Portal do cliente</span><h1>Seus pedidos de bombeio</h1>
          <p>Consulte o histórico da sua empresa e envie o pedido do dia com protocolo e horário oficial.</p></div>
        <Link className="platform-button" href="/cliente/novo">Novo pedido</Link>
      </div>
      <div className="platform-grid">
        <div className="platform-card platform-stat"><span className="platform-kicker">Clientes vinculados</span><strong>{clientes?.length ?? 0}</strong><small>Empresas que você pode representar</small></div>
        <div className="platform-card platform-stat"><span className="platform-kicker">Pedidos recentes</span><strong>{pedidos?.length ?? 0}</strong><small>Últimos 20 registros</small></div>
        <div className="platform-card platform-stat"><span className="platform-kicker">Em acompanhamento</span><strong>{(pedidos ?? []).filter((p) => p.status === "recebido" || p.status === "em_analise").length}</strong><small>Aguardando conclusão da Enpulse</small></div>
      </div>
      <section className="platform-section" aria-labelledby="historico-title">
        <div className="platform-section-title"><h2 id="historico-title">Histórico recente</h2></div>
        {pedidos?.length ? (
          <div className="platform-table-wrap"><table className="platform-table">
            <thead><tr><th>Protocolo</th><th>Cliente</th><th>Data</th><th>Situação</th><th>Prazo</th></tr></thead>
            <tbody>{pedidos.map((pedido) => <tr key={pedido.id}>
              <td><Link href={`/cliente/pedidos/${pedido.id}`}><strong>{pedido.protocolo}</strong></Link></td><td>{nomePorId.get(pedido.cliente_id) ?? "—"}</td>
              <td>{pedido.data_operacional}</td><td><span className="platform-badge">{pedido.status.replaceAll("_", " ")}</span></td>
              <td><span className={pedido.dentro_prazo ? "platform-badge" : "platform-badge platform-badge-late"}>{pedido.dentro_prazo ? "No prazo" : "Após o corte"}</span></td>
            </tr>)}</tbody>
          </table></div>
        ) : <div className="platform-card"><p>Você ainda não tem pedidos registrados nesta plataforma.</p></div>}
      </section>
    </main>
  );
}
