"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ensureUserDoc(uid: string, email: string | null, displayName?: string | null) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        email,
        name: displayName || "",
        subscription: "free",
        tradovateLinked: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.code === "auth/user-not-found" || err.code === "auth/wrong-password"
          ? "Invalid email or password"
          : "Something went wrong. Try again."
      );
    }
    setLoading(false);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(cred.user.uid, cred.user.email, name);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.code === "auth/email-already-in-use"
          ? "Email already in use"
          : err.code === "auth/weak-password"
            ? "Password must be at least 6 characters"
            : "Something went wrong. Try again."
      );
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(result.user.uid, result.user.email, result.user.displayName);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Google sign-in error:", err.code, err.message);
      if (err.code === "auth/unauthorized-domain") {
        setError("Domain not authorized. Add localhost to Firebase Auth settings.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup blocked. Allow popups for this site.");
      } else if (err.code !== "auth/popup-closed-by-user") {
        setError(`Google sign-in failed: ${err.code}`);
      }
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
        }
        .auth-container {
          max-width: 400px;
          width: 100%;
          padding: 2rem;
        }
        .auth-header {
          margin-bottom: 2.5rem;
        }
        .auth-header h1 {
          font-size: 1.1rem;
          font-weight: 400;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        .auth-header p {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 300;
        }
        .google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          background: none;
          border: 1px solid var(--border);
          color: var(--text-primary);
          font-family: inherit;
          font-size: 0.7rem;
          font-weight: 300;
          padding: 0.7rem;
          cursor: pointer;
          transition: all 0.3s;
          width: 100%;
        }
        .google-btn:hover { border-color: var(--accent); }
        .google-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .google-btn svg { width: 16px; height: 16px; flex-shrink: 0; }
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 0.5rem 0;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .auth-divider span {
          font-size: 0.55rem;
          color: var(--text-muted);
          font-weight: 300;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .auth-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--border);
        }
        .auth-tab {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-muted);
          font-family: inherit;
          font-size: 0.65rem;
          font-weight: 300;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.8rem 0;
          cursor: pointer;
          transition: all 0.3s;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
        }
        .auth-tab:hover { color: var(--text-primary); }
        .auth-tab.active {
          color: var(--text-primary);
          border-bottom-color: var(--accent);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-label {
          font-size: 0.6rem;
          font-weight: 300;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .form-input {
          background: var(--bg-input);
          border: 1px solid var(--border);
          color: var(--text-primary);
          font-family: inherit;
          font-size: 0.75rem;
          font-weight: 300;
          padding: 0.7rem 0.8rem;
          outline: none;
          transition: border-color 0.3s;
        }
        .form-input:focus { border-color: var(--accent); }
        .form-input::placeholder { color: var(--text-muted); opacity: 0.5; }
        .auth-submit {
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none;
          font-family: inherit;
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.02em;
          padding: 0.8rem;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 0.5rem;
          width: 100%;
        }
        .auth-submit:hover { opacity: 0.85; }
        .auth-submit:disabled { opacity: 0.4; cursor: not-allowed; }
        .auth-msg {
          font-size: 0.65rem;
          font-weight: 300;
          text-align: center;
          min-height: 1.2rem;
          color: var(--red);
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
      `}</style>

      <div className="auth-container">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to your trading journal.</p>
        </div>

        {/* Google sign in */}
        <button className="google-btn" onClick={handleGoogleSignIn} disabled={loading}>
          <svg viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider"><span>or</span></div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => { setTab("login"); setError(""); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${tab === "signup" ? "active" : ""}`}
            onClick={() => { setTab("signup"); setError(""); }}
          >
            Create Account
          </button>
        </div>

        {/* Login Form */}
        {tab === "login" && (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="your password"
                required
                autoComplete="current-password"
              />
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "..." : "Sign In"}
            </button>
            {error && <div className="auth-msg">{error}</div>}
          </form>
        )}

        {/* Signup Form */}
        {tab === "signup" && (
          <form className="auth-form" onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "..." : "Create Account"}
            </button>
            {error && <div className="auth-msg">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
