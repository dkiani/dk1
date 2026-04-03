"use client";

import { createContext, useContext } from "react";
import { User } from "firebase/auth";
import { UserProfile, SubscriptionTier } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  subscription: SubscriptionTier;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  subscription: "free",
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);
