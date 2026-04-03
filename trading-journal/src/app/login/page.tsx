"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useTheme } from "@/lib/theme";
import { TrendingUp, Sun, Moon } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "journalUsers", cred.user.uid), {
          uid: cred.user.uid,
          email: cred.user.email,
          subscription: "free",
          tradovateLinked: false,
          createdAt: new Date().toISOString(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.code === "auth/user-not-found" || err.code === "auth/wrong-password"
          ? "Invalid email or password"
          : err.code === "auth/email-already-in-use"
            ? "Email already in use"
            : err.code === "auth/weak-password"
              ? "Password must be at least 6 characters"
              : "Something went wrong. Try again."
      );
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-bg-tertiary transition-colors cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-text-muted" />
          ) : (
            <Moon className="w-4 h-4 text-text-muted" />
          )}
        </button>
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <TrendingUp className="w-5 h-5 text-accent" />
          <span className="text-sm font-semibold tracking-tight">journal.kiani.vc</span>
        </div>

        <div className="bg-bg-card border border-border rounded-lg p-6">
          <h1 className="text-sm font-semibold text-center mb-1">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-[10px] text-text-muted text-center mb-6">
            {mode === "login"
              ? "Sign in to your trading journal"
              : "Start tracking your trades"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-bg-input border border-border rounded-md text-xs text-text-primary focus:border-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 bg-bg-input border border-border rounded-md text-xs text-text-primary focus:border-accent outline-none"
              />
            </div>

            {error && (
              <p className="text-[10px] text-red">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent text-white rounded-md text-xs font-medium hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading
                ? "..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <p className="text-[10px] text-text-muted text-center mt-4">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-accent hover:underline cursor-pointer"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
