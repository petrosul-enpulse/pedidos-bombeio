"use client";

import { createBrowserClient } from "@supabase/ssr";
import { platformEnvironment } from "./config";

export function createPlatformBrowserClient() {
  const { url, key } = platformEnvironment();
  return createBrowserClient(url, key);
}
