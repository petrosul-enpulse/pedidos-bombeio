import { platformConfigured } from "@/lib/platform/config";
import { SetupPending } from "../setup-pending";
import { AcessoForm } from "./acesso-form";

export default async function AcessoPage({ searchParams }: {
  searchParams: Promise<{ destino?: string }>;
}) {
  if (!platformConfigured()) return <SetupPending />;
  const { destino } = await searchParams;
  const portal = destino === "operacao" ? "operacao" : "cliente";
  return (
    <main className="platform-content platform-auth-layout">
      <section className="platform-auth-intro">
        <span className="platform-kicker">Acesso seguro</span>
        <h1>Bem-vindo à plataforma de bombeio.</h1>
        <p>Use o e-mail autorizado pela Enpulse. O acesso é individual e cada pedido fica vinculado ao cliente cadastrado.</p>
        <div className="platform-auth-note">Um código de uso único será enviado ao seu e-mail.</div>
      </section>
      <AcessoForm portal={portal} />
    </main>
  );
}
