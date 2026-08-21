import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type PinColor = "white" | "yellow" | "pink" | "blue" | "green" | "orange";

export type Pin = {
  id: string;
  kind: "text" | "drawing";
  content: string;
  color: PinColor;
  x: number;
  y: number;
  rotation: number;
  author: string | null;
  owner_key: string;
  created_at: string;
};

export const PIN_COLORS: { value: PinColor; label: string; token: string }[] = [
  { value: "yellow", label: "Amarelo", token: "var(--note-yellow)" },
  { value: "pink", label: "Rosa", token: "var(--note-pink)" },
  { value: "blue", label: "Azul", token: "var(--note-blue)" },
  { value: "green", label: "Verde", token: "var(--note-green)" },
  { value: "orange", label: "Laranja", token: "var(--note-orange)" },
  { value: "white", label: "Branco", token: "var(--note-white)" },
];

const OWNER_STORAGE_KEY = "pinned.owner-key";

export function getOwnerKey(): string {
  if (typeof window === "undefined") return "";
  let key = window.localStorage.getItem(OWNER_STORAGE_KEY);
  if (!key || key.length < 8) {
    key = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
    window.localStorage.setItem(OWNER_STORAGE_KEY, key);
  }
  return key;
}

let cached: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Supabase client that forwards the browser's owner key so the database can
 * authorize updates/deletes on pins created by this browser.
 */
export function getPinsClient() {
  if (cached) return cached;
  cached = createClient<Database>(
    import.meta.env["VITE_SUPABASE_URL"] as string,
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-owner-key": getOwnerKey() } },
    },
  );
  return cached;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}
