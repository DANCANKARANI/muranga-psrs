import { redirect } from "next/navigation";
import { ShieldAlert, ShieldCheck, UsersRound } from "lucide-react";
import { UserStatusMenu } from "@/components/admin/UserStatusMenu";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      _count: { select: { requests: true } },
    },
  });
  const citizens = users.filter((user) => user.role === "CITIZEN").length;
  const admins = users.filter((user) => user.role === "ADMIN").length;
  const suspended = users.filter((user) => user.status === "SUSPENDED").length;

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1b5b91]">Access administration</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0f2c52]">User Management</h1>
        <p className="mt-2 text-sm text-slate-600">Review portal accounts and suspend access when necessary.</p>
      </header>

      <section aria-label="Account summary" className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Citizens" value={citizens} icon={UsersRound} />
        <StatCard label="Total Admins" value={admins} icon={ShieldCheck} tone="green" />
        <StatCard label="Suspended Accounts" value={suspended} icon={ShieldAlert} tone="red" />
      </section>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Requests</th>
                  <th className="px-4 py-3 font-semibold">Joined Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr className="hover:bg-slate-50/70" key={user.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{user.name}{user.id === session.id && <span className="ml-2 text-xs font-normal text-slate-500">You</span>}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${user.role === "ADMIN" ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-slate-100 text-slate-700"}`}>{user.role === "ADMIN" ? "Admin" : "Citizen"}</span></td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${user.status === "SUSPENDED" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{user.status === "SUSPENDED" ? "Suspended" : "Active"}</span></td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{user._count.requests}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-right">{user.id === session.id ? <span className="text-xs text-slate-400">—</span> : <UserStatusMenu userId={user.id} status={user.status} />}</td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td className="px-4 py-12 text-center text-slate-500" colSpan={7}>No accounts found.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
