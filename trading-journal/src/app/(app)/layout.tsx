"use client";

import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="w-5 h-5 border-2 border-accent-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <main className="md:ml-[240px] min-w-0 overflow-x-hidden px-4 md:px-8 py-6 md:py-8">
        <div className="max-w-[1200px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
