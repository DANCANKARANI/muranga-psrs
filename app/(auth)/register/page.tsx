"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const registrationSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your full name.").max(120),
    email: z.string().trim().email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .regex(/[A-Za-z]/, "Password must include at least one letter.")
      .regex(/[0-9]/, "Password must include at least one number."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

type RegistrationFormValues = z.infer<typeof registrationSchema>;

const registrationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export default function RegisterPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const password = useWatch({ control, name: "password" });
  const confirmPassword = useWatch({ control, name: "confirmPassword" });
  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  async function onSubmit(values: RegistrationFormValues) {
    setApiError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });
      const result = registrationResponseSchema.safeParse(await response.json());

      if (!response.ok || !result.success || !result.data.success) {
        const message = result.success
          ? result.data.message ?? "Unable to create your account. Please try again."
          : "Unable to create your account. Please try again.";
        setApiError(message);
        toast.error(message);
        return;
      }

      toast.success("Your account has been created.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setApiError("We could not connect to the service. Please try again.");
      toast.error("We could not connect to the service. Please try again.");
    }
  }

  const inputClassName =
    "mt-1.5 block h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f2c52] focus:ring-2 focus:ring-[#0f2c52]/20";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#0f2c52]">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Register to submit and track county service requests.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {apiError && (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {apiError}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-slate-800" htmlFor="name">
            Full name
          </label>
          <input
            autoComplete="name"
            className={inputClassName}
            id="name"
            type="text"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1.5 text-sm text-red-600" id="name-error">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-800" htmlFor="email">
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
              autoComplete="new-password"
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
          <p className="mt-1 text-xs text-slate-500">
            Use at least 8 characters, including a letter and a number.
          </p>
          {errors.password && (
            <p className="mt-1.5 text-sm text-red-600" id="password-error">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="confirmPassword"
          >
            Confirm password
          </label>
          <div className="relative mt-1.5">
            <input
              autoComplete="new-password"
              className={`${inputClassName} mt-0 pr-16`}
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword ? "confirm-password-error" : undefined
              }
              {...register("confirmPassword")}
            />
            <button
              aria-label={
                showConfirmPassword ? "Hide confirmation" : "Show confirmation"
              }
              aria-pressed={showConfirmPassword}
              className="absolute inset-y-0 right-2 inline-flex w-10 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-[#0f2c52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2c52]"
              onClick={() => setShowConfirmPassword((visible) => !visible)}
              type="button"
            >
              {showConfirmPassword ? (
                <EyeOff aria-hidden="true" size={18} />
              ) : (
                <Eye aria-hidden="true" size={18} />
              )}
            </button>
          </div>
          {passwordsMatch && !errors.confirmPassword && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-green-700" role="status">
              <span
                aria-hidden="true"
                className="flex size-4 items-center justify-center rounded-full bg-green-100 text-[11px] font-bold text-green-700"
              >
                ✓
              </span>
              Passwords match
            </p>
          )}
          {errors.confirmPassword && (
            <p
              className="mt-1.5 text-sm text-red-600"
              id="confirm-password-error"
            >
              {errors.confirmPassword.message}
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
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          className="font-semibold text-[#0f2c52] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2c52]"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}