"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/lib/auth-token";

interface NavbarProps {
  user: { name: string; role: UserRole };
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign out failed.");
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
          <Image
            alt="Murang’a County Government crest"
            className="size-10 shrink-0 object-contain"
            height={40}
            priority
            src="/logo.png"
            width={40}
          />
          <span className="truncate text-sm font-semibold text-[#0f2c52] sm:text-base">
            Murang&apos;a County Portal
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden max-w-44 truncate text-sm font-medium text-slate-700 sm:inline">
            {user.name}
          </span>
          <Badge
            variant="outline"
            className={
              user.role === "ADMIN"
                ? "border-amber-200 bg-amber-100 text-amber-800"
                : "border-blue-200 bg-blue-50 text-[#0f2c52]"
            }
          >
            {user.role === "ADMIN" ? "Administrator" : "Citizen"}
          </Badge>
          <Button
            className="text-slate-700"
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