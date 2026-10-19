"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminSettingsForm({ adminEmail, countyName: initialCountyName, slaDays: initialSlaDays, storageReady }: { adminEmail: string; countyName: string; slaDays: number; storageReady: boolean }) {
  const [countyName, setCountyName] = useState(initialCountyName);
  const [email, setEmail] = useState(adminEmail);
  const [slaDays, setSlaDays] = useState(String(initialSlaDays));
  const [isSaving, setIsSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countyName, adminEmail: email, slaDays: Number(slaDays) }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Settings could not be saved.");
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Settings could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return <form className="space-y-5" onSubmit={save}>
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">General Settings</h2><p className="mt-1 text-sm text-slate-500">Portal identity and administrator contact.</p></div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="county-name">County Name</Label><Input id="county-name" maxLength={100} value={countyName} onChange={(event) => setCountyName(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="admin-email">Admin Email</Label><Input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
      </div>
    </section>
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">SLA Settings</h2><p className="mt-1 text-sm text-slate-500">Set the default response target used to flag aging reports.</p></div>
      <div className="max-w-sm space-y-2 p-5"><Label htmlFor="sla-days">Default SLA Days</Label><Input id="sla-days" inputMode="numeric" max="90" min="1" onChange={(event) => setSlaDays(event.target.value)} type="number" value={slaDays} /><p className="text-xs text-slate-500">Currently set to {slaDays || "0"} days.</p></div>
    </section>
    <div className="flex justify-end"><Button className="bg-[#0f2c52] text-white hover:bg-[#183d6b]" disabled={isSaving || !storageReady} type="submit">{isSaving ? "Saving…" : "Save settings"}</Button></div>
  </form>;
}
