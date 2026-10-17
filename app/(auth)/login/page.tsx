"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const loginResponseSchema = z.object({
  success: z.boolean(),
  role: z.enum(["CITIZEN", "ADMIN"]).optional(),
  message: z.string().optional(),
});

export default function LoginPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setApiError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = loginResponseSchema.safeParse(await response.json());

      if (!response.ok || !result.success || !result.data.success || !result.data.role) {
        setApiError(
          result.success
            ? result.data.message ?? "Unable to sign in. Check your details and try again."
            : "Unable to sign in. Check your details and try again.",
        );
        return;
      }

      router.push(result.data.role === "ADMIN" ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      setApiError("We could not connect to the service. Please try again.");
    }
  }

  const inputClassName =
    "mt-1.5 block h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f2c52] focus:ring-2 focus:ring-[#0f2c52]/20";

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-[#0f2c52]">
          Sign in to your account
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sign in to submit and track your service requests.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {apiError && (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {apiError}
          </div>
        )}

        <div>
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="email"
          >
            Email address
          </label>
          <input
            autoComplete="email"
            className={inputClassName}
            id="email"
            type="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-600" id="email-error">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="password"
          >
            Password
          </label>
          <div className="relative mt-1.5">
            <input
              autoComplete="current-password"
              className={`${inputClassName} mt-0 pr-16`}
              id="password"
              type={showPassword ? "text" : "password"}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-2 inline-flex w-10 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-[#0f2c52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2c52]"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" size={18} />
              ) : (
                <Eye aria-hidden="true" size={18} />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-sm text-red-600" id="password-error">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0f2c52] px-4 text-sm font-semibold text-white transition hover:bg-[#183d6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2c52] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting && (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
          )}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link
          className="font-semibold text-[#0f2c52] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2c52]"
          href="/register"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}