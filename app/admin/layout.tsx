import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/shared/Navbar";
import { Sidebar } from "@/components/shared/Sidebar";
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
    <div className="min-h-screen bg-slate-50">
      <Navbar user={session} />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-screen-2xl flex-col md:flex-row">
        <Sidebar items={navigation} />
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}