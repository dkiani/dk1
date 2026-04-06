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

const mainNav = [
  { href: "/journal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal/trades", label: "Trade Journal", icon: BookOpen },
  { href: "/journal/new", label: "Log Trade", icon: Plus },
  { href: "/journal/calendar", label: "Calendar", icon: CalendarDays },
];

const appNav = [
  { href: "/journal/review", label: "Chart Review", icon: ScanEye },
  { href: "/journal/coach", label: "Coach K", icon: MessageSquare },
  { href: "/journal/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/journal") return pathname === "/journal";
    return pathname === href || pathname.startsWith(href + "/");
  }

  function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`
          flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-[0.85rem] font-medium no-underline
          transition-all duration-200 relative group
          ${active
            ? "bg-gradient-to-r from-[rgba(45,212,191,0.15)] to-[rgba(45,212,191,0.05)] text-accent-teal shadow-[inset_0_0_0_1px_rgba(45,212,191,0.15)]"
            : "text-text-secondary hover:text-text-primary hover:bg-[rgba(255,255,255,0.03)]"
          }
        `}
      >
        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? "text-accent-teal" : "text-text-tertiary group-hover:text-text-secondary"}`} />
        <span>{label}</span>
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent-teal rounded-r-full" />
        )}
      </Link>
    );
  }

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <Link href="/journal" className="flex items-center gap-3 no-underline group">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-accent-teal to-[#14b8a6] flex items-center justify-center shadow-[0_2px_8px_rgba(45,212,191,0.25)]">
            <span className="text-[0.7rem] font-bold text-text-inverse">K</span>
          </div>
          <span className="text-[1rem] font-semibold text-text-primary tracking-[-0.01em]">
            Kiani
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary px-4 mb-2">
          Navigation
        </p>
        <div className="space-y-1 mb-6">
          {mainNav.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary px-4 mb-2">
          Apps
        </p>
        <div className="space-y-1">
          {appNav.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      </nav>

      {/* User / Bottom */}
      <div className="px-3 pb-4 pt-3 border-t border-[rgba(255,255,255,0.04)]">
        {user && (
          <div className="px-4 py-2 mb-1">
            <p className="text-[0.7rem] text-text-tertiary truncate font-mono">
              {user.email}
            </p>
          </div>
        )}
        {user && (
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-[0.85rem] font-medium text-text-tertiary hover:text-red w-full transition-all duration-200 cursor-pointer bg-transparent border-0 hover:bg-red-bg"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign out
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-[60] p-2.5 bg-bg-surface border border-border rounded-[var(--radius-md)] cursor-pointer shadow-[var(--shadow-card)]"
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
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[49]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-[250px] z-50
          bg-bg-sidebar border-r border-[rgba(255,255,255,0.04)]
          transition-transform duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {content}
      </aside>
    </>
  );
}
