import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import type { UserRole } from "@/lib/auth-token";

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const params = await searchParams;
  const roleParam = Array.isArray(params.role) ? params.role[0] : params.role;
  const intendedRole: UserRole | undefined =
    roleParam === "ADMIN" || roleParam === "CITIZEN" ? roleParam : undefined;

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-slate-50 shadow-none">
        <CardContent className="space-y-1.5 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Demo credentials</p>
          <p>
            Admin: <span className="font-mono">admin@muranga.go.ke</span> /{" "}
            <span className="font-mono">Demo1234!</span>
          </p>
          <p>
            Citizen: <span className="font-mono">citizen@muranga.go.ke</span> /{" "}
            <span className="font-mono">Demo1234!</span>
          </p>
        </CardContent>
      </Card>
      <p className="-mt-2 text-xs italic text-slate-500">
        The system routes you to the correct dashboard based on your role.
      </p>
      <LoginForm intendedRole={intendedRole} />
    </div>
  );
}
