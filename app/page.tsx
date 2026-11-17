"use client";

import { useEffect, useState, type FormEvent } from "react";
import { mascararCnpj, validarCnpj } from "@/lib/cnpj.mjs";
import { dentroDoPrazo, horaLocal } from "@/lib/prazo.mjs";
import { PRODUTOS, UNIDADE, parseQuantidade } from "@/lib/produtos";

type Recibo = { id: number; data_pedido: string; hora_envio_local: string; dentro_prazo: boolean };

const CAMPOS = PRODUTOS.flatMap((p) => [`${p.chave}_bombeio`, `${p.chave}_previsao_venda`]);
const vazio = () => Object.fromEntries(CAMPOS.map((c) => [c, ""])) as Record<string, string>;
const dataBR = (iso: string) => iso.split("-").reverse().join("/");

export default function Page() {
  const [cnpj, setCnpj] = useState("");
  const [valores, setValores] = useState(vazio);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [recibo, setRecibo] = useState<Recibo | null>(null);
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    setAgora(new Date());
    const t = setInterval(() => setAgora(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const noPrazo = agora ? dentroDoPrazo(agora) : true;

  function validarLocal() {
    const e: Record<string, string> = {};
    if (!validarCnpj(cnpj)) e.cnpj = "CNPJ inválido.";
    let total = 0;
    for (const c of CAMPOS) {
      const v = parseQuantidade(valores[c]);
      if (Number.isNaN(v)) e[c] = "Use apenas números (ex.: 150 ou 150,5).";
      else total += v;
    }
    if (Object.keys(e).length === 0 && total === 0) e.geral = "Informe ao menos uma quantidade.";
    return e;
  }

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    const e = validarLocal();
    setErros(e);
    if (Object.keys(e).length) return;
    setEnviando(true);
    try {
      const r = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnpj, ...valores }),
      });
      const j = await r.json();
      if (!r.ok) setErros(j.erros ?? { geral: j.erro ?? "Erro ao enviar." });
      else setRecibo(j.pedido);
    } catch {
      setErros({ geral: "Sem conexão. Tente novamente." });
    } finally {
      setEnviando(false);
    }
  }

  function novoPedido() {
    setRecibo(null);
    setValores(vazio());
    setErros({});
  }

  if (recibo) {
    return (
      <main className="card">
        <h1>Pedido recebido</h1>
        <p className="protocolo">Protocolo nº {recibo.id}</p>
        <p>
          CNPJ {cnpj} · {dataBR(recibo.data_pedido)} às {recibo.hora_envio_local.slice(0, 5)}
        </p>
        {recibo.dentro_prazo ? (
          <p className="aviso ok">Enviado dentro do prazo. A base confirmará o volume até as 15h30.</p>
        ) : (
          <p className="aviso alerta">
            Enviado após as 12h. O pedido foi registrado, mas está sujeito a análise da base.
          </p>
        )}
        <button onClick={novoPedido}>Enviar outro pedido</button>
      </main>
    );
  }

  return (
    <main className="card">
      <header>
        <h1>Pedido de Bombeio</h1>
        <p className="sub">Base Paulínia/SP · envio até 12h (horário de Brasília)</p>
      </header>

      {agora && (
        <p className={`aviso ${noPrazo ? "ok" : "alerta"}`}>
          Agora: {horaLocal(agora).hora} ·{" "}
          {noPrazo ? "dentro do prazo para hoje" : "prazo das 12h encerrado; o pedido será registrado como fora do prazo"}
        </p>
      )}

      <form onSubmit={enviar} noValidate>
        <label className="campo">
          <span>CNPJ do cliente</span>
          <input
            name="cnpj"
            value={cnpj}
            onChange={(e) => setCnpj(mascararCnpj(e.target.value))}
            placeholder="00.000.000/0000-00"
            autoComplete="off"
            inputMode="text"
            maxLength={18}
            aria-invalid={!!erros.cnpj}
            required
          />
          {erros.cnpj && <small className="erro">{erros.cnpj}</small>}
        </label>

        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Qtde bombeio ({UNIDADE})</th>
              <th>Previsão de venda D+1 ({UNIDADE})</th>
            </tr>
          </thead>
          <tbody>
            {PRODUTOS.map((p) => (
              <tr key={p.chave}>
                <th scope="row">{p.nome}</th>
                {(["bombeio", "previsao_venda"] as const).map((tipo) => {
                  const nome = `${p.chave}_${tipo}`;
                  return (
                    <td key={nome} data-label={tipo === "bombeio" ? `Bombeio (${UNIDADE})` : `Venda D+1 (${UNIDADE})`}>
                      <input
                        name={nome}
                        value={valores[nome]}
                        onChange={(e) => setValores({ ...valores, [nome]: e.target.value })}
                        inputMode="decimal"
                        placeholder="0"
                        aria-label={`${p.nome} - ${tipo === "bombeio" ? "quantidade de bombeio" : "previsão de venda do dia seguinte"}`}
                        aria-invalid={!!erros[nome]}
                      />
                      {erros[nome] && <small className="erro">{erros[nome]}</small>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {erros.geral && <p className="erro">{erros.geral}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar pedido"}
        </button>
      </form>
    </main>
  );
}
