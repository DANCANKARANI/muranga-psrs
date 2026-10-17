import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shared/DashboardShell";
import type { SidebarItem } from "@/components/shared/Sidebar";
import { getSession } from "@/lib/auth";

export const instant = false;

const navigation: SidebarItem[] = [
  { label: "All requests", href: "/admin", icon: "requests" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  return (
    <DashboardShell user={session} navigation={navigation}>
      {children}
    </DashboardShell>
  );
}