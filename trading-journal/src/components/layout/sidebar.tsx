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
    <aside className="fixed left-0 top-0 h-screen w-56 bg-bg-secondary border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 no-underline group">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-[11px] font-medium text-text-primary tracking-tight">
            journal.kiani.vc
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded text-[11px] no-underline transition-all duration-200 ${
                isActive
                  ? "text-accent font-medium"
                  : "text-text-muted hover:text-text-primary"
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
          className="flex items-center gap-3 px-3 py-2 rounded text-[11px] text-text-muted hover:text-text-primary w-full transition-all duration-200 cursor-pointer bg-transparent border-0"
        >
          {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        {user && (
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded text-[11px] text-text-muted hover:text-red w-full transition-all duration-200 cursor-pointer bg-transparent border-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}
