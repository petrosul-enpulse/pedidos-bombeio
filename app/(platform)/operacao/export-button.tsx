"use client";

import { useState } from "react";

export function ExportButton({ data, base }: { data: string; base: string }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  async function exportar() {
    setOcupado(true);
    setErro("");
    try {
      const response = await fetch("/api/v1/operacao/exportacao", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, base: base || null }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.mensagem ?? "Não foi possível exportar o período.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `enpulse-bombeio-${data}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha na exportação.");
    } finally {
      setOcupado(false);
    }
  }

  return <div><button className="platform-button platform-button-secondary" type="button" disabled={ocupado} onClick={exportar}>
    {ocupado ? "Preparando CSV..." : "Exportar CSV do dia"}
  </button>{erro && <p className="platform-error" role="alert">{erro}</p>}</div>;
}
