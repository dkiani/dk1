"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Settings,
  LogOut,
  Plus,
  ScanEye,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/journal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal/trades", label: "Journal", icon: BookOpen },
  { href: "/journal/new", label: "New Trade", icon: Plus },
  { href: "/journal/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/journal/review", label: "Chart Review", icon: ScanEye },
  { href: "/journal/coach", label: "Coach K", icon: MessageSquare },
  { href: "/journal/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-border">
        <Link href="/journal" className="flex items-center gap-2.5 no-underline">
          <span className="text-accent text-[0.5rem]">&#9679;</span>
          <span
            className="text-[0.7rem] font-mono font-normal text-text-primary tracking-[0.15em] uppercase"
          >
            KIANI
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 px-3">
        <p className="text-[0.6rem] font-mono uppercase tracking-[0.12em] text-text-tertiary px-3 mb-3">
          Navigation
        </p>
        <div className="space-y-0.5">
          {navItems.slice(0, 4).map((item) => {
            const isActive =
              item.href === "/journal"
                ? pathname === "/journal"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-[0.8rem] font-sans no-underline transition-all duration-150 rounded-[var(--radius-sm)] ${
                  isActive
                    ? "text-text-primary bg-accent-teal-dim border-l-2 border-accent-teal"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover border-l-2 border-transparent"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <p className="text-[0.6rem] font-mono uppercase tracking-[0.12em] text-text-tertiary px-3 mb-3 mt-6">
          Apps
        </p>
        <div className="space-y-0.5">
          {navItems.slice(4).map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-[0.8rem] font-sans no-underline transition-all duration-150 rounded-[var(--radius-sm)] ${
                  isActive
                    ? "text-text-primary bg-accent-teal-dim border-l-2 border-accent-teal"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover border-l-2 border-transparent"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-border">
        {user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-[0.7rem] text-text-tertiary font-mono truncate">
              {user.email}
            </p>
          </div>
        )}
        {user && (
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 text-[0.8rem] font-sans text-text-secondary hover:text-red w-full transition-colors duration-150 cursor-pointer bg-transparent border-0 rounded-[var(--radius-sm)]"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign out
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-[60] p-2 bg-bg-surface border border-border rounded-[var(--radius-sm)] cursor-pointer"
      >
        {mobileOpen ? (
          <X className="w-5 h-5 text-text-primary" />
        ) : (
          <Menu className="w-5 h-5 text-text-primary" />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-[49]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[240px] bg-bg-primary border-r border-border flex flex-col z-50 transition-transform duration-250 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
