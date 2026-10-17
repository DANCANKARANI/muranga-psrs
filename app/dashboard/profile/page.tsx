import { redirect } from "next/navigation";
import { ProfileForms } from "@/components/profile/ProfileForms";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CITIZEN") redirect("/admin");

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { name: true, email: true, phone: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f2c52]">My Profile</h1>
        <p className="mt-2 text-sm text-slate-600">Manage your account information and sign-in security.</p>
      </div>
      <ProfileForms name={user.name} email={user.email} phone={user.phone} />
    </div>
  );
}
