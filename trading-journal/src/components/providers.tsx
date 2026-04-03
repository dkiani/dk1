"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ThemeContext, Theme } from "@/lib/theme";
import { AuthContext } from "@/lib/auth-context";
import { UserProfile } from "@/types";

export function Providers({ children }: { children: ReactNode }) {
  // Theme — default to light, respect localStorage only if explicitly set
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Clear any stale dark theme preference so light is the new default
    localStorage.removeItem("journal-theme");
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
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
        const profileDoc = await getDoc(doc(db, "journalUsers", firebaseUser.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
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
