import React, { useEffect, useState } from "react";
import CharacterManager from "./CharacterManager";
import { supabase, supabaseConfigured } from "./lib/supabase";
import { createCloudStorage } from "./lib/storage";

const INK = "#2B2620";
const PAPER = "#EDE6D3";
const RED = "#7A2E2E";
const BRASS = "#A9822C";

function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage(
          data.session
            ? "Account created."
            : "Account created. Check your email if confirmation is enabled."
        );
      }
    } catch (err) {
      setMessage(err.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: PAPER, color: INK }}>
      <form onSubmit={submit} style={{ width: "min(430px, 100%)", background: "#f8f3e7", border: `2px solid ${BRASS}88`, borderRadius: 12, padding: 28, boxShadow: "0 10px 35px rgba(43,38,32,.12)" }}>
        <h1 style={{ fontFamily: "Georgia, serif", margin: "0 0 6px" }}>Adventurer's Ledger</h1>
        <p style={{ opacity: .65, marginTop: 0 }}>Cloud-saved character manager</p>

        <label style={{ display: "block", marginTop: 18 }}>
          Email
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            required
            style={{ width: "100%", marginTop: 6, padding: 10, border: `1px solid ${BRASS}77`, borderRadius: 6, background: "white" }}
          />
        </label>

        <label style={{ display: "block", marginTop: 14 }}>
          Password
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            required
            minLength={6}
            style={{ width: "100%", marginTop: 6, padding: 10, border: `1px solid ${BRASS}77`, borderRadius: 6, background: "white" }}
          />
        </label>

        <button disabled={busy} style={{ width: "100%", marginTop: 20, padding: 11, border: 0, borderRadius: 6, background: RED, color: "#fff", cursor: "pointer" }}>
          {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}
          style={{ width: "100%", marginTop: 10, padding: 9, border: `1px solid ${BRASS}88`, borderRadius: 6, background: "transparent", color: INK, cursor: "pointer" }}
        >
          {mode === "signin" ? "Create a new account" : "I already have an account"}
        </button>

        {message && <p style={{ marginBottom: 0, fontSize: 13, color: INK }}>{message}</p>}
      </form>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setReady(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!supabaseConfigured) {
    return (
      <div style={{ minHeight: "100vh", padding: 40, fontFamily: "system-ui", color: INK, background: PAPER }}>
        <h1>Adventurer's Ledger</h1>
        <p>Supabase is not configured yet.</p>
        <p>Create a <code>.env</code> file from <code>.env.example</code> and add your Supabase URL and publishable key.</p>
      </div>
    );
  }

  if (!ready) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: PAPER }}>Loading…</div>;
  }

  if (!session) return <AuthScreen />;

  window.storage = createCloudStorage(supabase, session.user.id);

  return (
    <div>
      <div style={{ position: "fixed", right: 12, top: 10, zIndex: 10000 }}>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ border: `1px solid ${BRASS}88`, background: PAPER, color: INK, borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}
        >
          Sign out
        </button>
      </div>
      <CharacterManager />
    </div>
  );
}
