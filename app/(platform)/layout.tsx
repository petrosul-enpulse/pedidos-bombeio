import Link from "next/link";
import type { ReactNode } from "react";
import "../platform.css";
import { SignOut } from "./sign-out";

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="platform-shell">
      <header className="platform-header">
        <div className="platform-header-inner">
          <Link className="platform-brand" href="/cliente" aria-label="Enpulse Energia, início">
            <span className="platform-brand-symbol" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none">
              <path d="M24 6v19" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
              <path d="M14.2 11.5a17.5 17.5 0 1 0 19.6 0" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
            </svg></span>
            <span><strong>enpulse</strong><small>energia que pulsa</small></span>
          </Link>
          <nav aria-label="Portais">
            <Link href="/cliente">Portal do cliente</Link>
            <Link href="/operacao">Operação Enpulse</Link>
          </nav>
          <SignOut />
        </div>
      </header>
      {children}
      <footer className="platform-footer">Enpulse Energia · Pedidos de bombeio · Base Paulínia</footer>
    </div>
  );
}
