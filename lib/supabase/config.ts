export const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
export const supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
).trim();

export function isSupabaseConfigured() {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
}
