"use client";

import { useEffect, useState, type FormEvent } from "react";
import { mascararCnpj, validarCnpj } from "@/lib/cnpj.mjs";
import { dentroDoPrazo, horaLocal } from "@/lib/prazo.mjs";
import { LIMITE_MAXIMO, PRODUTOS, UNIDADE, parseQuantidade } from "@/lib/produtos";

type CampoProduto = `${(typeof PRODUTOS)[number]["chave"]}_${"bombeio" | "previsao_venda"}`;
type Recibo = {
  id: number;
  cnpj: string;
  data_pedido: string;
  hora_envio_local: string;
  dentro_prazo: boolean;
} & Record<CampoProduto, number>;
type ConfigPrazo = { corte: string; fuso: string };

const CAMPOS = PRODUTOS.flatMap((produto) => [
  `${produto.chave}_bombeio`,
  `${produto.chave}_previsao_venda`,
]);
const valoresVazios = () =>
  Object.fromEntries(CAMPOS.map((campo) => [campo, ""])) as Record<string, string>;
const dataBR = (iso: string) => iso.split("-").reverse().join("/");
const numeroBR = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(valor);

function LogoEnpulse() {
  return (
    <div className="brand" aria-label="Enpulse, energia que pulsa">
      <span className="brand-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <path d="M24 6v19" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
          <path
            d="M14.2 11.5a17.5 17.5 0 1 0 19.6 0"
            stroke="currentColor"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="brand-text">
        <strong>enpulse</strong>
        <small>energia que pulsa</small>
      </span>
    </div>
  );
}

function IconeRelogio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3.2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Page() {
  const [cnpj, setCnpj] = useState("");
  const [valores, setValores] = useState(valoresVazios);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [recibo, setRecibo] = useState<Recibo | null>(null);
  const [agora, setAgora] = useState<Date | null>(null);
  const [config, setConfig] = useState<ConfigPrazo | null>(null);
  const [erroPrazo, setErroPrazo] = useState(false);

  useEffect(() => {
    setAgora(new Date());
    const timer = window.setInterval(() => setAgora(new Date()), 30_000);
    let ativo = true;
    fetch("/api/config", { cache: "no-store" })
      .then(async (resposta) => {
        if (!resposta.ok) throw new Error("Prazo indisponível");
        return (await resposta.json()) as ConfigPrazo;
      })
      .then((dados) => {
        if (ativo) setConfig(dados);
      })
      .catch(() => {
        if (ativo) setErroPrazo(true);
      });
    return () => {
      ativo = false;
      window.clearInterval(timer);
    };
  }, []);

  const noPrazo = agora && config
    ? dentroDoPrazo(agora, config.corte, config.fuso)
    : null;
  const hora = agora ? horaLocal(agora, config?.fuso).hora : "--:--";
  const dataHoje = agora ? dataBR(horaLocal(agora, config?.fuso).data) : "--/--/----";
  const total = (tipo: "bombeio" | "previsao_venda") =>
    PRODUTOS.reduce((soma, produto) => {
      const valor = parseQuantidade(valores[`${produto.chave}_${tipo}`]);
      return soma + (Number.isNaN(valor) ? 0 : valor);
    }, 0);

  function validarLocal() {
    const proximosErros: Record<string, string> = {};
    if (!validarCnpj(cnpj)) proximosErros.cnpj = "Confira o CNPJ informado.";
    let totalInformado = 0;
    for (const campo of CAMPOS) {
      const valor = parseQuantidade(valores[campo]);
      if (Number.isNaN(valor) || valor < 0)
        proximosErros[campo] = "Informe um número válido, como 150 ou 150,5.";
      else if (valor > LIMITE_MAXIMO)
        proximosErros[campo] = `O máximo é ${numeroBR(LIMITE_MAXIMO)} ${UNIDADE}.`;
      else totalInformado += valor;
    }
    if (Object.keys(proximosErros).length === 0 && totalInformado === 0)
      proximosErros.geral = "Informe ao menos uma quantidade para enviar o pedido.";
    return proximosErros;
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const proximosErros = validarLocal();
    setErros(proximosErros);
    if (Object.keys(proximosErros).length > 0) {
      const primeiroCampo = Object.keys(proximosErros).find((campo) => campo !== "geral");
      if (primeiroCampo) document.getElementById(primeiroCampo)?.focus();
      return;
    }

    setEnviando(true);
    try {
      const resposta = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnpj, ...valores }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErros(dados.erros ?? { geral: dados.erro ?? "Não foi possível enviar o pedido." });
        return;
      }
      setRecibo(dados.pedido);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErros({ geral: "Sem conexão. Seus valores foram mantidos; tente novamente." });
    } finally {
      setEnviando(false);
    }
  }

  function novoPedido() {
    setRecibo(null);
    setValores(valoresVazios());
    setErros({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container header-inner">
          <LogoEnpulse />
          <span className="header-base">Base Paulínia <span aria-hidden="true">/</span> SP</span>
        </div>
      </header>

      {recibo ? (
        <main className="container receipt-page">
          <div className="receipt-hero">
            <div className="success-mark" aria-hidden="true">
              <svg viewBox="0 0 28 28" fill="none">
                <path d="m6 14 5.5 5.5L22 8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <span className="eyebrow">SOLICITAÇÃO REGISTRADA</span>
              <h1>Pedido recebido.</h1>
              <p>Seu pedido foi registrado pela Base Paulínia. Guarde o protocolo para acompanhamento.</p>
            </div>
          </div>

          <div className="receipt-grid">
            <section className="panel receipt-main" aria-labelledby="resumo-recebido">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">COMPROVANTE</span>
                  <h2 id="resumo-recebido">Resumo do pedido</h2>
                </div>
                <span className="protocol">Nº {recibo.id}</span>
              </div>
              <div className="receipt-meta">
                <div><span>Cliente</span><strong>{mascararCnpj(recibo.cnpj)}</strong></div>
                <div><span>Data do pedido</span><strong>{dataBR(recibo.data_pedido)}</strong></div>
                <div><span>Horário do envio</span><strong>{recibo.hora_envio_local.slice(0, 5)} (Brasília)</strong></div>
              </div>
              <div className="receipt-products">
                <div className="receipt-products-header">
                  <span>Produto</span><span>Bombeio</span><span>Venda D+1</span>
                </div>
                {PRODUTOS.map((produto) => (
                  <div className="receipt-product" key={produto.chave}>
                    <strong>{produto.nome}</strong>
                    <span>{numeroBR(Number(recibo[`${produto.chave}_bombeio`]))} {UNIDADE}</span>
                    <span>{numeroBR(Number(recibo[`${produto.chave}_previsao_venda`]))} {UNIDADE}</span>
                  </div>
                ))}
              </div>
            </section>

            <aside className="receipt-aside">
              <div className={`deadline-result ${recibo.dentro_prazo ? "on-time" : "late"}`}>
                <span className="eyebrow">SITUAÇÃO DO PRAZO</span>
                <h2>{recibo.dentro_prazo ? "Enviado no prazo" : "Enviado após o prazo"}</h2>
                <p>
                  {recibo.dentro_prazo
                    ? "A base confirmará o volume até as 15h30."
                    : "O pedido foi registrado e está sujeito à análise da base."}
                </p>
              </div>
              <button className="button button-secondary" type="button" onClick={novoPedido}>
                Enviar outro pedido <span aria-hidden="true">↗</span>
              </button>
            </aside>
          </div>
        </main>
      ) : (
        <main className="container">
          <section className="hero" aria-labelledby="titulo-pagina">
            <div className="hero-copy">
              <span className="eyebrow"><span className="eyebrow-line" /> OPERAÇÃO DIÁRIA</span>
              <h1 id="titulo-pagina">Pedido de bombeio</h1>
              <p>Informe os volumes necessários para hoje e a previsão de venda do dia seguinte. Uma solicitação clara para manter a operação em movimento.</p>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="pulse-arc arc-one" />
              <div className="pulse-arc arc-two" />
              <div className="hero-photo" />
            </div>
          </section>

          <section className={`deadline-banner ${noPrazo === false ? "deadline-late" : ""}`} aria-label="Prazo do pedido">
            <div className="deadline-leading">
              <span className="clock-icon"><IconeRelogio /></span>
              <div>
                <span className="eyebrow">PRAZO DO PEDIDO</span>
                <strong>
                  {erroPrazo
                    ? "Horário indisponível"
                    : config
                      ? noPrazo
                        ? `Envie até ${config.corte}`
                        : `Prazo das ${config.corte} encerrado`
                      : "Consultando horário de corte"}
                </strong>
                <p>
                  {erroPrazo
                    ? "Confirme o horário com a base antes de enviar."
                    : noPrazo === false
                      ? "O pedido será registrado e ficará sujeito à análise da base."
                      : "Envios após o horário de corte também são registrados."}
                </p>
              </div>
            </div>
            <div className="deadline-now">
              <span>AGORA EM BRASÍLIA</span>
              <strong>{hora}</strong>
              <small>{dataHoje}</small>
            </div>
          </section>

          <form className="form-layout" onSubmit={enviar} noValidate>
            <div className="form-main">
              <section className="panel form-section" aria-labelledby="cliente-titulo">
                <div className="section-heading">
                  <span className="section-number">01</span>
                  <div>
                    <span className="eyebrow">IDENTIFICAÇÃO</span>
                    <h2 id="cliente-titulo">Dados do cliente</h2>
                    <p>O CNPJ identifica a empresa responsável por este pedido.</p>
                  </div>
                </div>
                <div className="field cnpj-field">
                  <label htmlFor="cnpj">CNPJ do cliente <span className="required">*</span></label>
                  <input
                    id="cnpj"
                    name="cnpj"
                    value={cnpj}
                    onChange={(evento) => setCnpj(mascararCnpj(evento.target.value))}
                    placeholder="00.000.000/0000-00"
                    autoComplete="off"
                    inputMode="text"
                    maxLength={18}
                    aria-invalid={!!erros.cnpj}
                    aria-describedby={erros.cnpj ? "erro-cnpj" : "ajuda-cnpj"}
                    required
                  />
                  {erros.cnpj
                    ? <small id="erro-cnpj" className="field-error">{erros.cnpj}</small>
                    : <small id="ajuda-cnpj" className="field-help">Aceita CNPJ numérico ou alfanumérico.</small>}
                </div>
              </section>

              <section className="panel form-section" aria-labelledby="volumes-titulo">
                <div className="section-heading">
                  <span className="section-number">02</span>
                  <div>
                    <span className="eyebrow">VOLUMES EM {UNIDADE.toUpperCase()}</span>
                    <h2 id="volumes-titulo">Produtos e quantidades</h2>
                    <p>Preencha apenas os produtos necessários. Campos em branco serão considerados zero.</p>
                  </div>
                </div>
                <div className="product-list">
                  {PRODUTOS.map((produto, indice) => (
                    <div className="product-card" key={produto.chave}>
                      <div className="product-name">
                        <span>0{indice + 1} / PRODUTO</span>
                        <strong>{produto.nome}</strong>
                      </div>
                      {(["bombeio", "previsao_venda"] as const).map((tipo) => {
                        const nome = `${produto.chave}_${tipo}`;
                        return (
                          <div className="field quantity-field" key={nome}>
                            <label htmlFor={nome}>
                              {tipo === "bombeio" ? "Quantidade de bombeio" : "Previsão de venda D+1"}
                            </label>
                            <div className="input-with-unit">
                              <input
                                id={nome}
                                name={nome}
                                value={valores[nome]}
                                onChange={(evento) => setValores((atuais) => ({ ...atuais, [nome]: evento.target.value }))}
                                inputMode="decimal"
                                placeholder="0,000"
                                aria-invalid={!!erros[nome]}
                                aria-describedby={erros[nome] ? `erro-${nome}` : undefined}
                              />
                              <span aria-hidden="true">{UNIDADE}</span>
                            </div>
                            {erros[nome] && <small id={`erro-${nome}`} className="field-error">{erros[nome]}</small>}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <p className="section-note"><strong>D+1</strong> é a previsão de venda para o dia seguinte ao pedido.</p>
              </section>
            </div>

            <aside className="summary-column" aria-label="Resumo antes do envio">
              <div className="panel summary-card">
                <span className="eyebrow">CONFIRA ANTES DE ENVIAR</span>
                <h2>Resumo do pedido</h2>
                <div className="summary-client">
                  <span>Cliente</span>
                  <strong>{cnpj || "CNPJ ainda não informado"}</strong>
                </div>
                <div className="summary-totals">
                  <div>
                    <span>Total de bombeio</span>
                    <strong>{numeroBR(total("bombeio"))} <small>{UNIDADE}</small></strong>
                  </div>
                  <div>
                    <span>Previsão de venda D+1</span>
                    <strong>{numeroBR(total("previsao_venda"))} <small>{UNIDADE}</small></strong>
                  </div>
                </div>
                <p className="summary-copy">Ao enviar, você receberá um número de protocolo. Confira os valores antes de continuar.</p>
                {erros.geral && <p className="form-error" role="alert">{erros.geral}</p>}
                <button className="button button-primary" type="submit" disabled={enviando}>
                  {enviando ? "Enviando pedido..." : "Enviar pedido"}
                  {!enviando && <span aria-hidden="true">↗</span>}
                </button>
                <p className="submit-note">Registro em horário de Brasília.</p>
              </div>
            </aside>
          </form>
        </main>
      )}

      <footer className="site-footer">
        <div className="container footer-inner">
          <span>© Enpulse Energia</span>
          <span>Base Paulínia · Pedido de bombeio</span>
        </div>
      </footer>
    </div>
  );
}
