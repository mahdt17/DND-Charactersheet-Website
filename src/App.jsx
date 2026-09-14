import React, { useEffect, useState, useRef } from "react";
import ModernLedger, { demoStorage } from "./ModernLedger";
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

function AuthScreen({ theme, onToggleTheme, onDemo }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!supabase) { setMessage("Sign-in is not configured in this preview. Explore the demo to try the app."); return; }
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
        <p className="auth-subtitle">Your next adventure starts here. Build a hero, gather your party, and bring your story to the table.</p>

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
        <button type="button" className="auth-demo" onClick={onDemo}>Explore the demo <span>→</span></button>
        {message && <p className="auth-message">{message}</p>}
      </form>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [demo, setDemo] = useState(false);
  const demoRef=useRef(null);
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
    }).catch(()=>{if(active)setReady(true);});

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return <div className={`auth-page theme-${theme}`}><div className="auth-theme-control"><ThemeToggle theme={theme} onToggle={toggleTheme} /></div><div className="auth-loading">Opening your ledger…</div></div>;
  }

  if (!session && !demo) return <AuthScreen theme={theme} onToggleTheme={toggleTheme} onDemo={()=>{demoRef.current=demoStorage();setDemo(true);}} />;
  window.storage = demo ? demoRef.current : createCloudStorage(supabase, session.user.id);
  return <div className={`app-theme theme-${theme}`}><ModernLedger key={demo?'demo':session.user.id} demo={demo} theme={theme} onToggleTheme={toggleTheme} onSignOut={async()=>{if(demo){setDemo(false);demoRef.current=null;}else{await supabase.auth.signOut();}}}/></div>;
}
