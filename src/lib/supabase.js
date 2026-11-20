import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && publishableKey);

// Supabase has confirmed the address before it redirects here. For signup
// only, discard the emailed session before the SDK can store it in this browser.
const callback = new URLSearchParams(window.location.hash.slice(1));
export const signupConfirmationReceived = supabaseConfigured && callback.get("type") === "signup"
  && Boolean(callback.get("access_token") && callback.get("refresh_token")) && !callback.has("error");

if (signupConfirmationReceived) {
  window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
}

export const supabase = supabaseConfigured
  ? createClient(url, publishableKey)
  : null;
