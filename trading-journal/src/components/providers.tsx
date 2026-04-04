"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ThemeContext, Theme } from "@/lib/theme";
import { AuthContext } from "@/lib/auth-context";
import { UserProfile } from "@/types";

export function Providers({ children }: { children: ReactNode }) {
  // Theme — read what the blocking script in layout.tsx already set
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (document.documentElement.getAttribute("data-theme") as Theme) || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("journal-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Retry profile fetch — Firestore auth token may not be ready immediately
        let retries = 3;
        while (retries > 0) {
          try {
            const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (profileDoc.exists()) {
              setProfile(profileDoc.data() as UserProfile);
            } else {
              // Doc doesn't exist yet — create it
              const { setDoc: firestoreSetDoc } = await import("firebase/firestore");
              await firestoreSetDoc(doc(db, "users", firebaseUser.uid), {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || "",
                subscription: "free",
                tradovateLinked: false,
                createdAt: new Date().toISOString(),
              });
              setProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                displayName: firebaseUser.displayName || undefined,
                subscription: "free",
                tradovateLinked: false,
                createdAt: new Date().toISOString(),
              });
            }
            break;
          } catch (err) {
            retries--;
            if (retries > 0) {
              await new Promise((r) => setTimeout(r, 1000));
            } else {
              console.error("Failed to fetch user profile:", err);
              // Still allow the user in with defaults
              setProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                subscription: "free",
                tradovateLinked: false,
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setProfile(null);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthContext.Provider
        value={{
          user,
          profile,
          loading,
          subscription: profile?.subscription ?? "free",
          signOut: handleSignOut,
        }}
      >
        {children}
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}
