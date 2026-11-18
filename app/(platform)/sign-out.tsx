"use client";

import { useRouter } from "next/navigation";
import { createPlatformBrowserClient } from "@/lib/platform/browser";
import { platformConfigured } from "@/lib/platform/config";

export function SignOut() {
  const router = useRouter();
  if (!platformConfigured()) return null;
  return (
    <button className="platform-signout" type="button" onClick={async () => {
      await createPlatformBrowserClient().auth.signOut();
      router.replace("/acesso");
      router.refresh();
    }}>Sair</button>
  );
}
