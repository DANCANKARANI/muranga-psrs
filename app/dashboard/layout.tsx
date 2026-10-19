import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shared/DashboardShell";
import type { SidebarItem } from "@/components/shared/Sidebar";
import { getSession } from "@/lib/auth";

export const instant = false;

const navigation: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "New request", href: "/dashboard/requests/new", icon: "create" },
  { label: "My requests", href: "/dashboard/requests", icon: "requests" },
  { label: "Community requests", href: "/dashboard/community", icon: "community" },
  { label: "My Profile", href: "/dashboard/profile", icon: "profile" },
];

export default async function CitizenDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CITIZEN") redirect("/admin");

  return (
    <DashboardShell user={session} navigation={navigation}>
      {children}
    </DashboardShell>
  );
}
