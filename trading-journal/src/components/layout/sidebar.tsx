"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Settings,
  LogOut,
  Sun,
  Moon,
  Plus,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/journal/new", label: "New Trade", icon: Plus },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-bg-card border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 no-underline group mb-4">
          <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
          <span className="text-[11px] font-medium text-text-primary tracking-[0.06em] uppercase">
            Trading Journal
          </span>
        </Link>
        <p className="text-[10px] text-text-muted font-light">
          {user?.email}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[3px] text-[11px] font-light no-underline transition-all duration-200 ${
                isActive
                  ? "text-accent font-medium bg-bg-tertiary"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-border space-y-0.5">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[3px] text-[11px] font-light text-text-muted hover:text-text-primary hover:bg-bg-tertiary w-full transition-all duration-200 cursor-pointer bg-transparent border-0"
        >
          {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        {user && (
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[3px] text-[11px] font-light text-text-muted hover:text-red hover:bg-red-bg w-full transition-all duration-200 cursor-pointer bg-transparent border-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}
