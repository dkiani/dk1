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
import { useTheme } from "@/lib/theme";

const googleProvider = new GoogleAuthProvider();

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
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
      const cred = await signInWithEmailAndPassword(auth, email, password);
      router.push("/journal");
    } catch (err: any) {
      console.error("Login error:", err.code, err.message);
      setError(
        err.code === "auth/user-not-found" || err.code === "auth/wrong-password"
          ? "Invalid email or password"
          : `Error: ${err.code || err.message}`
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
      // Don't block redirect on Firestore write — providers.tsx handles profile creation as fallback
      ensureUserDoc(cred.user.uid, cred.user.email, name).catch(() => {});
      router.push("/journal");
    } catch (err: any) {
      console.error("Signup error:", err.code, err.message);
      setError(
        err.code === "auth/email-already-in-use"
          ? "Email already in use"
          : err.code === "auth/weak-password"
            ? "Password must be at least 6 characters"
            : `Error: ${err.code || err.message}`
      );
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      try {
        await ensureUserDoc(result.user.uid, result.user.email, result.user.displayName);
      } catch (firestoreErr: any) {
        console.error("Firestore error after Google sign-in:", firestoreErr.code, firestoreErr.message);
      }
      router.push("/journal");
    } catch (err: any) {
      console.error("Google sign-in error:", err.code, err.message);
      if (err.code === "auth/unauthorized-domain") {
        setError("Domain not authorized. Add this domain to Firebase Auth settings.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup blocked. Allow popups for this site.");
      } else if (err.code !== "auth/popup-closed-by-user") {
        setError(`Google sign-in failed: ${err.code}`);
      }
    }
    setLoading(false);
  }

  return (
    <>
      {/* Theme toggle — fixed top right, identical to dashboard.kiani.vc */}
      <button
        onClick={toggleTheme}
        style={{
          position: "fixed",
          top: "1.5rem",
          right: "1.5rem",
          zIndex: 100,
          background: "none",
          border: "1px solid var(--border)",
          color: "var(--muted)",
          fontFamily: "var(--font)",
          fontSize: "0.55rem",
          letterSpacing: "0.06em",
          padding: "0.3rem 0.6rem",
          cursor: "pointer",
          transition: "all 0.3s",
          textTransform: "uppercase" as const,
          minWidth: 44,
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {theme === "dark" ? "Light" : "Dark"}
      </button>

      {/* Auth container — exact copy of dashboard.kiani.vc .auth-container */}
      <div
        style={{
          maxWidth: 400,
          margin: "0 auto",
          padding: "2rem",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column" as const,
          justifyContent: "center",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1
            style={{
              fontSize: "1.1rem",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              marginBottom: "0.5rem",
            }}
          >
            {tab === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p
            style={{
              fontSize: "0.7rem",
              color: "var(--muted)",
              fontWeight: 300,
            }}
          >
            {tab === "login"
              ? "Sign in to your trading journal."
              : "Start tracking your trades today."}
          </p>
        </div>

        {/* Google sign in */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.6rem",
            background: "none",
            border: "1px solid var(--border)",
            color: "var(--fg)",
            fontFamily: "inherit",
            fontSize: "0.7rem",
            fontWeight: 300,
            padding: "0.7rem",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s",
            width: "100%",
            opacity: loading ? 0.4 : 1,
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, flexShrink: 0 }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {/* OR divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            margin: "0.5rem 0",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span
            style={{
              fontSize: "0.55rem",
              color: "var(--dim)",
              fontWeight: 300,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
            }}
          >
            or
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 0,
            marginBottom: "2rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => { setTab("login"); setError(""); }}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === "login" ? "var(--accent)" : "transparent"}`,
              color: tab === "login" ? "var(--fg)" : "var(--muted)",
              fontFamily: "inherit",
              fontSize: "0.65rem",
              fontWeight: 300,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              padding: "0.8rem 0",
              cursor: "pointer",
              transition: "all 0.3s",
              marginBottom: -1,
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab("signup"); setError(""); }}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === "signup" ? "var(--accent)" : "transparent"}`,
              color: tab === "signup" ? "var(--fg)" : "var(--muted)",
              fontFamily: "inherit",
              fontSize: "0.65rem",
              fontWeight: 300,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              padding: "0.8rem 0",
              cursor: "pointer",
              transition: "all 0.3s",
              marginBottom: -1,
            }}
          >
            Create Account
          </button>
        </div>

        {/* Login Form */}
        {tab === "login" && (
          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column" as const, gap: "1rem" }}
          >
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.4rem" }}>
              <label style={{ fontSize: "0.6rem", fontWeight: 300, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--fg)",
                  fontFamily: "inherit",
                  fontSize: "0.75rem",
                  fontWeight: 300,
                  padding: "0.7rem 0.8rem",
                  outline: "none",
                  transition: "border-color 0.3s",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.4rem" }}>
              <label style={{ fontSize: "0.6rem", fontWeight: 300, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="your password"
                required
                autoComplete="current-password"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--fg)",
                  fontFamily: "inherit",
                  fontSize: "0.75rem",
                  fontWeight: 300,
                  padding: "0.7rem 0.8rem",
                  outline: "none",
                  transition: "border-color 0.3s",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "var(--fg)",
                color: "var(--bg)",
                border: "none",
                fontFamily: "inherit",
                fontSize: "0.7rem",
                fontWeight: 400,
                letterSpacing: "0.02em",
                padding: "0.8rem",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                marginTop: "0.5rem",
                opacity: loading ? 0.4 : 1,
              }}
            >
              {loading ? "..." : "Sign In"}
            </button>
            {error && (
              <div style={{ fontSize: "0.65rem", fontWeight: 300, textAlign: "center" as const, color: "var(--error)" }}>
                {error}
              </div>
            )}
          </form>
        )}

        {/* Signup Form */}
        {tab === "signup" && (
          <form
            onSubmit={handleSignup}
            style={{ display: "flex", flexDirection: "column" as const, gap: "1rem" }}
          >
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.4rem" }}>
              <label style={{ fontSize: "0.6rem", fontWeight: 300, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--fg)",
                  fontFamily: "inherit",
                  fontSize: "0.75rem",
                  fontWeight: 300,
                  padding: "0.7rem 0.8rem",
                  outline: "none",
                  transition: "border-color 0.3s",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.4rem" }}>
              <label style={{ fontSize: "0.6rem", fontWeight: 300, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--fg)",
                  fontFamily: "inherit",
                  fontSize: "0.75rem",
                  fontWeight: 300,
                  padding: "0.7rem 0.8rem",
                  outline: "none",
                  transition: "border-color 0.3s",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.4rem" }}>
              <label style={{ fontSize: "0.6rem", fontWeight: 300, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--fg)",
                  fontFamily: "inherit",
                  fontSize: "0.75rem",
                  fontWeight: 300,
                  padding: "0.7rem 0.8rem",
                  outline: "none",
                  transition: "border-color 0.3s",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "var(--fg)",
                color: "var(--bg)",
                border: "none",
                fontFamily: "inherit",
                fontSize: "0.7rem",
                fontWeight: 400,
                letterSpacing: "0.02em",
                padding: "0.8rem",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                marginTop: "0.5rem",
                opacity: loading ? 0.4 : 1,
              }}
            >
              {loading ? "..." : "Create Account"}
            </button>
            {error && (
              <div style={{ fontSize: "0.65rem", fontWeight: 300, textAlign: "center" as const, color: "var(--error)" }}>
                {error}
              </div>
            )}
          </form>
        )}
      </div>
    </>
  );
}
