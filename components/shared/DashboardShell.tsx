"use client";

import { useState, type ReactNode } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { Sidebar, type SidebarItem } from "@/components/shared/Sidebar";
import type { UserRole } from "@/lib/auth-token";

interface DashboardShellProps {
  user: { name: string; role: UserRole };
  navigation: SidebarItem[];
  children: ReactNode;
}

export function DashboardShell({
  user,
  navigation,
  children,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-white md:block">
        <Sidebar items={navigation} showBrand />
      </aside>
      <div className="min-h-screen md:pl-64">
        <Navbar
          user={user}
          menuOpen={mobileMenuOpen}
          onMenuClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
        />
        <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
      {mobileMenuOpen && (
        <>
          <button
            aria-label="Close navigation menu"
            className="fixed inset-x-0 bottom-0 top-16 z-40 bg-slate-950/30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            type="button"
          />
          <Sidebar
            className="fixed bottom-0 left-0 top-16 z-50 shadow-xl md:hidden"
            items={navigation}
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </>
      )}
    </div>
  );
}
