"use client";

import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Search, Bell } from "lucide-react";

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
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-accent-teal to-[#14b8a6] flex items-center justify-center animate-pulse">
            <span className="text-[0.8rem] font-bold text-text-inverse">K</span>
          </div>
          <div className="w-5 h-5 border-2 border-accent-teal border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />

      {/* Main area */}
      <div className="md:ml-[250px] min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 px-4 md:px-8 py-4 flex items-center justify-between bg-bg-primary/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.04)]">
          {/* Search */}
          <div className="relative max-w-sm w-full hidden md:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search trades, symbols..."
              className="w-full pl-10 pr-4 py-2.5 bg-bg-surface border border-[rgba(255,255,255,0.04)] rounded-[12px] text-[0.85rem] font-sans text-text-primary placeholder:text-text-tertiary focus:border-accent-teal/30 focus:shadow-[0_0_0_3px_rgba(45,212,191,0.08)] outline-none transition-all duration-200"
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 ml-auto">
            <button className="p-2.5 rounded-[10px] bg-bg-surface border border-[rgba(255,255,255,0.04)] text-text-tertiary hover:text-text-secondary hover:border-border transition-all duration-200 cursor-pointer relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-teal rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-teal/20 to-accent-teal/5 border border-accent-teal/20 flex items-center justify-center text-[0.7rem] font-semibold text-accent-teal">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 md:px-8 py-6 relative">
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(45,212,191,0.04)_0%,transparent_70%)] pointer-events-none" />
          <div className="max-w-[1200px] mx-auto relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
