export function SetupPending() {
  const demoEnabled =
    process.env.NODE_ENV === "development" ||
    (process.env.ENPULSE_ENABLE_DEMO === "true" &&
      process.env.VERCEL_ENV === "preview");
  return (
    <main className="platform-content">
      <div className="platform-empty">
        <span className="platform-kicker">Configuração inicial</span>
        <h1>O novo portal está sendo preparado</h1>
        <p>
          O projeto Supabase da plataforma ainda será conectado. O formulário
          atual continua disponível durante a implantação.
        </p>
        <a className="platform-button" href="/">
          Abrir formulário atual
        </a>
        {demoEnabled && (
          <p>
            <a href="/demo">Explorar o protótipo navegável →</a>
          </p>
        )}
      </div>
    </main>
  );
}
