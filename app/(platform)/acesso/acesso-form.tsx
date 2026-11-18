"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPlatformBrowserClient } from "@/lib/platform/browser";

export function AcessoForm({ portal }: { portal: "cliente" | "operacao" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [etapa, setEtapa] = useState<"email" | "codigo">("email");
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function enviarCodigo(event: React.FormEvent) {
    event.preventDefault();
    setOcupado(true);
    setMensagem("");
    try {
      await createPlatformBrowserClient().auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      });
      // A resposta é idêntica para e-mail cadastrado e desconhecido.
      setEtapa("codigo");
      setMensagem("Se o e-mail estiver autorizado, você receberá um código em instantes.");
    } catch {
      setMensagem("Não foi possível solicitar o código agora. Tente novamente.");
    } finally {
      setOcupado(false);
    }
  }

  async function verificarCodigo(event: React.FormEvent) {
    event.preventDefault();
    setOcupado(true);
    setMensagem("");
    try {
      const { error } = await createPlatformBrowserClient().auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: codigo.trim(),
        type: "email",
      });
      if (error) throw error;
      router.replace(portal === "operacao" ? "/operacao" : "/cliente");
      router.refresh();
    } catch {
      setMensagem("Código inválido ou expirado. Confira o e-mail e tente novamente.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="platform-card platform-auth-card" aria-label="Entrar na plataforma">
      <span className="platform-kicker">{portal === "operacao" ? "Equipe Enpulse" : "Cliente"}</span>
      <h2>{etapa === "email" ? "Receber código" : "Confirmar código"}</h2>
      {etapa === "email" ? (
        <form onSubmit={enviarCodigo}>
          <label htmlFor="acesso-email">E-mail autorizado</label>
          <input id="acesso-email" type="email" autoComplete="email" required value={email}
            onChange={(event) => setEmail(event.target.value)} placeholder="voce@empresa.com.br" />
          <button className="platform-button" disabled={ocupado} type="submit">
            {ocupado ? "Aguarde..." : "Enviar código"}
          </button>
        </form>
      ) : (
        <form onSubmit={verificarCodigo}>
          <p className="platform-helper">Código enviado para <strong>{email}</strong></p>
          <label htmlFor="acesso-codigo">Código de seis dígitos</label>
          <input id="acesso-codigo" inputMode="numeric" autoComplete="one-time-code" minLength={6}
            maxLength={6} pattern="[0-9]{6}" required value={codigo}
            onChange={(event) => setCodigo(event.target.value)} placeholder="000000" />
          <button className="platform-button" disabled={ocupado} type="submit">
            {ocupado ? "Verificando..." : "Entrar"}
          </button>
          <button className="platform-link-button" type="button" onClick={() => { setEtapa("email"); setCodigo(""); }}>
            Usar outro e-mail
          </button>
        </form>
      )}
      {mensagem && <p className="platform-form-message" role="status">{mensagem}</p>}
    </section>
  );
}
