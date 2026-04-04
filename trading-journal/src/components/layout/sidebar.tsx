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
  { href: "/journal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal/trades", label: "Journal", icon: BookOpen },
  { href: "/journal/new", label: "New Trade", icon: Plus },
  { href: "/journal/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/journal/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-bg-primary border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-border">
        <Link href="/journal" className="flex items-center gap-2.5 no-underline mb-3">
          <span className="text-accent text-[0.6rem]">●</span>
          <span className="text-[0.7rem] font-normal text-text-primary tracking-[0.15em] uppercase">
            Trading Journal
          </span>
        </Link>
        <p className="text-[0.7rem] text-text-muted font-light">
          {user?.email}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/journal"
              ? pathname === "/journal"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-[0.8rem] no-underline transition-colors duration-150 font-light rounded-[4px] ${
                isActive
                  ? "text-accent bg-bg-surface-hover border-l-2 border-accent"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-surface-hover"
              }`}
            >
              <Icon className="w-[14px] h-[14px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-border space-y-0.5">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 text-[0.8rem] font-light text-text-muted hover:text-text-primary w-full transition-colors duration-150 cursor-pointer bg-transparent border-0 rounded-[4px]"
        >
          {theme === "dark" ? <Sun className="w-[14px] h-[14px]" /> : <Moon className="w-[14px] h-[14px]" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        {user && (
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 text-[0.8rem] font-light text-text-muted hover:text-red w-full transition-colors duration-150 cursor-pointer bg-transparent border-0 rounded-[4px]"
          >
            <LogOut className="w-[14px] h-[14px]" />
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}
