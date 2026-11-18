"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = { codigo: string; nome: string; solicitado: string; unidade: string };

export function OperacaoActions({ pedidoId, versao, status, papel, itens }: {
  pedidoId: string; versao: number; status: string; papel: string; itens: Item[];
}) {
  const router = useRouter();
  const [volumes, setVolumes] = useState<Record<string, string>>(() => Object.fromEntries(itens.map((i) => [i.codigo, i.solicitado])));
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const podeAssumir = ["operador", "gestor", "administrador"].includes(papel) && status === "recebido";
  const podeConcluir = ["gestor", "administrador"].includes(papel) && status === "em_analise";
  if (!podeAssumir && !podeConcluir) return null;

  async function executar(acao: "assumir" | "confirmar" | "recusar") {
    setErro("");
    setOcupado(true);
    try {
      const body: Record<string, unknown> = { versao };
      if (acao === "confirmar") {
        body.itens = itens.map((item) => ({ produto_codigo: item.codigo, volume_confirmado: volumes[item.codigo] }));
        body.motivo = motivo;
      }
      if (acao === "recusar") body.motivo = motivo;
      const response = await fetch(`/api/v1/pedidos/${pedidoId}/${acao}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.mensagem ?? "Não foi possível concluir a ação.");
      router.refresh();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : "Não foi possível concluir a ação.");
    } finally { setOcupado(false); }
  }

  return <section className="platform-section platform-card"><span className="platform-kicker">Ação operacional</span>
    <h2>{podeAssumir ? "Iniciar análise" : "Concluir análise"}</h2>
    {podeAssumir ? <p>Ao assumir, o pedido passa para análise e a ação fica registrada no histórico.</p> : <>
      <p>Confirme os volumes. Se algum valor mudar, informe o motivo que o cliente poderá consultar.</p>
      {itens.map((item) => <div className="platform-order-row" key={item.codigo}><div><strong>{item.nome}</strong><small>Solicitado: {item.solicitado} {item.unidade}</small></div>
        <div className="platform-field"><label htmlFor={`confirmado-${item.codigo}`}>Confirmado ({item.unidade})</label><input id={`confirmado-${item.codigo}`} type="number" min="0" max="999999.999" step="0.001" value={volumes[item.codigo]} onChange={(e) => setVolumes((v) => ({ ...v, [item.codigo]: e.target.value }))} /></div></div>)}
      <div className="platform-field" style={{ marginTop: 18 }}><label htmlFor="motivo">Motivo de ajuste ou recusa</label><textarea id="motivo" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} /></div>
    </>}
    {erro && <p className="platform-error" role="alert">{erro}</p>}
    <div className="platform-form-actions" style={{ gap: 10 }}>
      {podeAssumir ? <button className="platform-button" disabled={ocupado} onClick={() => executar("assumir")}>Assumir pedido</button> : <>
        <button className="platform-button platform-button-secondary" disabled={ocupado || !motivo.trim()} onClick={() => executar("recusar")}>Recusar pedido</button>
        <button className="platform-button" disabled={ocupado} onClick={() => executar("confirmar")}>Confirmar volumes</button>
      </>}
    </div>
  </section>;
}
