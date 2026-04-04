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
      try {
        await ensureUserDoc(result.user.uid, result.user.email, result.user.displayName);
      } catch (firestoreErr: any) {
        console.error("Firestore error after Google sign-in:", firestoreErr.code, firestoreErr.message);
      }
      router.push("/dashboard");
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

  const inputClass = "w-full px-3 py-2.5 bg-bg-input border border-border rounded-[4px] text-[0.8rem] text-text-primary placeholder:text-text-muted focus:border-accent outline-none transition-colors duration-150";
  const labelClass = "block text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary mb-2";

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="max-w-[400px] w-full px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-accent text-sm">●</span>
            <span className="text-[0.7rem] font-medium text-text-primary tracking-[0.15em] uppercase">
              Trading Journal
            </span>
          </div>
          <h1 className="text-[1.5rem] font-medium mb-1">Welcome back</h1>
          <p className="text-[0.7rem] text-text-muted">Sign in to your trading journal.</p>
        </div>

        {/* Google sign in */}
        <button
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-transparent border border-border rounded-[4px] text-[0.8rem] text-text-primary hover:border-accent transition-colors duration-150 cursor-pointer disabled:opacity-40"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[0.6rem] text-text-muted uppercase tracking-[0.1em]">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          <button
            className={`flex-1 pb-3 text-[0.7rem] uppercase tracking-[0.1em] cursor-pointer bg-transparent border-0 border-b-2 transition-colors duration-150 ${
              tab === "login" ? "text-text-primary border-accent" : "text-text-muted border-transparent hover:text-text-primary"
            }`}
            onClick={() => { setTab("login"); setError(""); }}
          >
            Sign In
          </button>
          <button
            className={`flex-1 pb-3 text-[0.7rem] uppercase tracking-[0.1em] cursor-pointer bg-transparent border-0 border-b-2 transition-colors duration-150 ${
              tab === "signup" ? "text-text-primary border-accent" : "text-text-muted border-transparent hover:text-text-primary"
            }`}
            onClick={() => { setTab("signup"); setError(""); }}
          >
            Create Account
          </button>
        </div>

        {/* Login Form */}
        {tab === "login" && (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="your password" required autoComplete="current-password" className={inputClass} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-text-primary text-bg-primary rounded-[4px] text-[0.75rem] font-medium tracking-[0.05em] hover:opacity-85 transition-opacity duration-150 cursor-pointer disabled:opacity-40 border-0">
              {loading ? "..." : "Sign In"}
            </button>
            {error && <p className="text-[0.7rem] text-red text-center">{error}</p>}
          </form>
        )}

        {/* Signup Form */}
        {tab === "signup" && (
          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <label className={labelClass}>Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required autoComplete="name" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 6 characters" required minLength={6} autoComplete="new-password" className={inputClass} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-text-primary text-bg-primary rounded-[4px] text-[0.75rem] font-medium tracking-[0.05em] hover:opacity-85 transition-opacity duration-150 cursor-pointer disabled:opacity-40 border-0">
              {loading ? "..." : "Create Account"}
            </button>
            {error && <p className="text-[0.7rem] text-red text-center">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
