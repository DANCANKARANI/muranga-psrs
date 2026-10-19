"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/shared/NotificationBell";
import type { UserRole } from "@/lib/auth-token";

interface NavbarProps {
  user: { name: string; role: UserRole };
  onMenuClick?: () => void;
  menuOpen?: boolean;
}

export function Navbar({ user, onMenuClick, menuOpen = false }: NavbarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign out failed.");
      toast.success("Signed out");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {onMenuClick && (
            <Button
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              className="md:hidden"
              onClick={onMenuClick}
              size="icon"
              variant="ghost"
            >
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </Button>
          )}
          <span className="truncate text-sm font-semibold text-[#0f2c52] sm:text-base">
            Murang&apos;a County Portal
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {user.role === "ADMIN" && (
            <form action="/admin/requests" className="hidden min-w-0 flex-1 items-center md:flex">
              <div className="relative mx-auto w-full max-w-xl">
                <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input aria-label="Search admin requests" className="h-9 w-full bg-slate-50 pl-9" name="q" placeholder="Search Tracking ID, Citizen, Location..." />
              </div>
            </form>
          )}
          <NotificationBell />
          {user.role === "CITIZEN" ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button className="max-w-52 gap-2 text-slate-700" variant="ghost" />}
              >
                <span className="hidden max-w-36 truncate text-sm font-medium sm:inline">
                  {user.name}
                </span>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[#0f2c52]">
                  Citizen
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <span className="block truncate">{user.name}</span>
                    <span className="mt-1 block text-xs font-normal text-slate-500">Citizen account</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    nativeButton={false}
                    render={<Link href="/dashboard/profile" />}
                  >
                    My Profile
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-44 truncate text-sm font-medium text-slate-700 sm:inline">
                {user.name}
              </span>
              <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-800">
                Administrator
              </Badge>
            </div>
          )}
          <Button
            className="border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 hover:text-red-800"
            disabled={isLoggingOut}
            onClick={logout}
            size="sm"
            variant="outline"
          >
            {isLoggingOut ? (
              <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#0f2c52]" />
            ) : (
              <LogOut aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
