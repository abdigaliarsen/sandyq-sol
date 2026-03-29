"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`flex-1 transition-all duration-200 ${sidebarCollapsed ? "ml-16" : "ml-60"}`}>
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
