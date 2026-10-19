"use client";

import { LoaderCircle, MoreHorizontal, ShieldCheck, ShieldOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserStatusMenu({ userId, status }: { userId: string; status: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const nextStatus = status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";

  async function updateStatus() {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Account status could not be changed.");
      toast.success(nextStatus === "SUSPENDED" ? "User suspended." : "User activated.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Account status could not be changed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label="User actions" disabled={isSaving} size="icon-sm" variant="ghost" />
        }
      >
        {isSaving ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <MoreHorizontal aria-hidden="true" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={isSaving} onClick={() => void updateStatus()}>
          {nextStatus === "SUSPENDED" ? <ShieldOff aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
          {nextStatus === "SUSPENDED" ? "Suspend User" : "Activate User"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
