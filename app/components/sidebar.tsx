"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

const NAV_KEYS: { href: string; labelKey: string; icon: any }[] = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/admin", labelKey: "nav.admin", icon: Shield },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-200 flex flex-col",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gold flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">S</span>
            </div>
            <span className="text-lg font-semibold text-foreground">
              Sandyq
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto h-7 w-7 rounded-md bg-gold flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">S</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_KEYS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-gold/10 text-gold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
