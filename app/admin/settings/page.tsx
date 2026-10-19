import { redirect } from "next/navigation";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMissingSettingsTable } from "@/lib/settings";

export const instant = false;

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");
  let storageReady = true;
  let savedSettings: Awaited<ReturnType<typeof prisma.systemSetting.findMany>> = [];
  try {
    savedSettings = await prisma.systemSetting.findMany({
      where: { key: { in: ["countyName", "adminEmail", "slaDays"] } },
    });
  } catch (error) {
    if (!isMissingSettingsTable(error)) throw error;
    storageReady = false;
    savedSettings = [];
  }
  const setting = (key: string) => savedSettings.find((item) => item.key === key)?.value;
  const configuredSla = Number(setting("slaDays") ?? "3");

  return <div className="mx-auto max-w-4xl space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-wide text-[#1b5b91]">Portal administration</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0f2c52]">Settings</h1><p className="mt-2 text-sm text-slate-600">Configure service portal details and response targets.</p></div>
    {!storageReady && <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="status">Settings storage is not initialized yet. Run <code>npx prisma db push</code> and refresh to enable saving. The portal is currently using the default 3-day SLA.</div>}
    <AdminSettingsForm adminEmail={setting("adminEmail") ?? session.email} countyName={setting("countyName") ?? "Murang’a County"} slaDays={Number.isInteger(configuredSla) && configuredSla > 0 ? configuredSla : 3} storageReady={storageReady} />
  </div>;
}
