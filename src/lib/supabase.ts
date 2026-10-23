import { createClient } from "@supabase/supabase-js";

// The browser's Supabase client, for one signed-in person. Every request carries their
// Clerk session token, so row-level security sees their Clerk user id as
// auth.jwt()->>'sub'; without a token it would run as anon, which can't see any table.
// Only the publishable key is used: the secret key never reaches the browser.
export function createSupabaseClient(getToken: () => Promise<string | null>) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    accessToken: getToken,
  });
}
