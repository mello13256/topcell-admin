import { createClient } from "@supabase/supabase-js";

// ============================================================
// CONFIGURAÇÃO DO SUPABASE
// Pegue esses valores em: Supabase → seu projeto →
// Configurações (ícone de engrenagem) → API.
//   - Project URL         → SUPABASE_URL
//   - anon / public key    → SUPABASE_ANON_KEY
// Nenhum dos dois é secreto de verdade (a proteção real vem das
// políticas de RLS no banco), então pode deixar direto no código.
// ============================================================
const SUPABASE_URL = "https://jpgvlzpbzdzzrxhldrzt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mtjAZCJL4ZO0LjDP9zMfeQ_Jln6EYlq";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Login anônimo automático — dá permissão pro app ler/escrever
// conforme as políticas de RLS (que exigem "usuário autenticado").
// O controle de acesso pra quem usa o app de verdade é o PIN.
export async function ensureSignedIn() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.user;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
}
