import React, { useEffect, useState } from "react";
import CharacterManager from "./CharacterManager";
import { ScrollText, Sun, Moon } from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";
import { createCloudStorage } from "./lib/storage";

const INK = "#2B2620";
const PAPER = "#EDE6D3";
const RED = "#7A2E2E";
const BRASS = "#A9822C";

function ThemeToggle({ theme, onToggle }) {
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
      <span>{dark ? "Light" : "Dark"}</span>
    </button>
  );
}

function AuthScreen({ theme, onToggleTheme }) {
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
        setMessage(data.session ? "Your account is ready." : "Account created. Check your email to confirm your account.");
      }
    } catch (err) {
      setMessage(err.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`auth-page theme-${theme}`}>
      <div className="auth-theme-control"><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div>
      <div className="auth-atmosphere" />
      <form onSubmit={submit} className="auth-card">
        <div className="auth-emblem"><ScrollText size={24} /></div>
        <div className="auth-kicker">Adventurer's Ledger</div>
        <h1>{mode === "signin" ? "Welcome back, adventurer." : "Begin your adventure."}</h1>
        <p className="auth-subtitle">Your characters, campaigns, and stories — kept in one legendary ledger.</p>

        <label className="auth-field">
          <span>Email</span>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="you@example.com" />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required minLength={6} placeholder="At least 6 characters" />
        </label>

        <button disabled={busy} className="auth-primary">
          {busy ? "Opening the ledger…" : mode === "signin" ? "Enter the Ledger" : "Create Account"}
        </button>
        <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }} className="auth-secondary">
          {mode === "signin" ? "Create a new account" : "I already have an account"}
        </button>
        {message && <p className="auth-message">{message}</p>}
      </form>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("ledger-theme") || "dark");

  useEffect(() => {
    localStorage.setItem("ledger-theme", theme);
    document.documentElement.dataset.ledgerTheme = theme;
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => current === "dark" ? "light" : "dark");
  }

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
    return <div className={`auth-page theme-${theme}`}><div className="auth-theme-control"><ThemeToggle theme={theme} onToggle={toggleTheme} /></div><div className="auth-loading">Opening your ledger…</div></div>;
  }

  if (!session) return <AuthScreen theme={theme} onToggleTheme={toggleTheme} />;

  window.storage = createCloudStorage(supabase, session.user.id);

  return (
    <div className={`app-theme theme-${theme}`}>
      <div className="app-controls">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <button
          onClick={() => supabase.auth.signOut()}
          className="cm-signout"
        >
          Sign out
        </button>
      </div>
      <CharacterManager />
    </div>
  );
}
