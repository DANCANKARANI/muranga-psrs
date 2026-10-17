"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(120),
  phone: z.string().trim().max(32, "Phone number is too long."),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z.string().min(8, "Use at least 8 characters."),
  confirmPassword: z.string().min(1, "Confirm your new password."),
}).refine((values) => values.newPassword === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match.",
});

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

const responseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

interface ProfileFormsProps {
  name: string;
  email: string;
  phone: string | null;
}

export function ProfileForms({ name, email, phone }: ProfileFormsProps) {
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name, phone: phone ?? "" },
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function updateProfile(values: ProfileValues) {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = responseSchema.safeParse(await response.json());
      if (!response.ok || !result.success || !result.data.success) {
        const message = result.success ? result.data.message ?? "Profile could not be saved." : "Profile could not be saved.";
        toast.error(message);
        return;
      }
      toast.success("Profile updated.");
    } catch {
      toast.error("The profile service could not be reached.");
    }
  }

  async function updatePassword(values: PasswordValues) {
    try {
      const response = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      const result = responseSchema.safeParse(await response.json());
      if (!response.ok || !result.success || !result.data.success) {
        const message = result.success ? result.data.message ?? "Password could not be changed." : "Password could not be changed.";
        toast.error(message);
        return;
      }
      passwordForm.reset();
      toast.success("Password changed.");
    } catch {
      toast.error("The password service could not be reached.");
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your contact details used for your county account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={profileForm.handleSubmit(updateProfile)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="profile-name">Full name</Label>
              <Input id="profile-name" autoComplete="name" {...profileForm.register("name")} aria-invalid={Boolean(profileForm.formState.errors.name)} />
              {profileForm.formState.errors.name && <p className="text-sm text-red-600">{profileForm.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email address</Label>
              <Input id="profile-email" type="email" value={email} readOnly aria-readonly="true" className="bg-slate-50" />
              <p className="text-xs text-slate-500">Email address cannot be changed here.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Phone number</Label>
              <Input id="profile-phone" type="tel" autoComplete="tel" placeholder="Optional phone number" {...profileForm.register("phone")} aria-invalid={Boolean(profileForm.formState.errors.phone)} />
              {profileForm.formState.errors.phone && <p className="text-sm text-red-600">{profileForm.formState.errors.phone.message}</p>}
            </div>
            <Button className="bg-[#0f2c52] text-white hover:bg-[#183d6b]" disabled={profileForm.formState.isSubmitting} type="submit">
              {profileForm.formState.isSubmitting && <LoaderCircle aria-hidden="true" className="animate-spin" />}
              {profileForm.formState.isSubmitting ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change the password used to sign in to the portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={passwordForm.handleSubmit(updatePassword)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input id="current-password" type="password" autoComplete="current-password" {...passwordForm.register("currentPassword")} aria-invalid={Boolean(passwordForm.formState.errors.currentPassword)} />
              {passwordForm.formState.errors.currentPassword && <p className="text-sm text-red-600">{passwordForm.formState.errors.currentPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" type="password" autoComplete="new-password" {...passwordForm.register("newPassword")} aria-invalid={Boolean(passwordForm.formState.errors.newPassword)} />
              {passwordForm.formState.errors.newPassword && <p className="text-sm text-red-600">{passwordForm.formState.errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" {...passwordForm.register("confirmPassword")} aria-invalid={Boolean(passwordForm.formState.errors.confirmPassword)} />
              {passwordForm.formState.errors.confirmPassword && <p className="text-sm text-red-600">{passwordForm.formState.errors.confirmPassword.message}</p>}
            </div>
            <Button className="bg-[#0f2c52] text-white hover:bg-[#183d6b]" disabled={passwordForm.formState.isSubmitting} type="submit">
              {passwordForm.formState.isSubmitting && <LoaderCircle aria-hidden="true" className="animate-spin" />}
              {passwordForm.formState.isSubmitting ? "Changing password…" : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
