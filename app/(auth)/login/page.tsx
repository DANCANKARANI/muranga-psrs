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
  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD;
  const demoAccounts = intendedRole === "ADMIN"
    ? [{ label: "Admin", email: "admin@muranga.go.ke" }]
    : intendedRole === "CITIZEN"
      ? [{ label: "Citizen", email: "citizen@muranga.go.ke" }]
      : [];

  return (
    <div className="space-y-4">
      {demoPassword && demoAccounts.length > 0 && (
        <Card className="border-slate-200 bg-slate-50 shadow-none">
          <CardContent className="space-y-1.5 p-3 text-xs text-slate-600">
            {demoAccounts.map((account) => (
              <div className="space-y-1" key={account.email}>
                <p><span className="font-semibold text-slate-700">Demo email:</span>{" "}<span className="font-mono">{account.email}</span></p>
                <p><span className="font-semibold text-slate-700">Demo password:</span>{" "}<span className="font-mono">{demoPassword}</span></p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <LoginForm intendedRole={intendedRole} />
    </div>
  );
}
