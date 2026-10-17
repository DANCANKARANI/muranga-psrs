"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RequestStatus } from "@/components/shared/StatusBadge";

const statuses = [
  "PENDING",
  "IN_PROGRESS",
  "RESOLVED",
] as const;

const statusLabels: Record<RequestStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

const updateSchema = z.object({
  status: z.enum(statuses),
  note: z.string().trim().min(3, "Enter at least 3 characters.").max(500),
});

type UpdateValues = z.infer<typeof updateSchema>;

const responseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

interface AdminUpdateFormProps {
  requestId: string;
  currentStatus: RequestStatus;
}

export function AdminUpdateForm({
  requestId,
  currentStatus,
}: AdminUpdateFormProps) {
  const router = useRouter();
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: { status: currentStatus, note: "" },
  });

  async function onSubmit(values: UpdateValues) {
    setRequestError(null);
    try {
      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = responseSchema.safeParse(await response.json());

      if (!response.ok || !result.success || !result.data.success) {
        const message = result.success
          ? result.data.message ?? "The request could not be updated."
          : "The request could not be updated.";
        setRequestError(message);
        toast.error(message);
        return;
      }

      toast.success("Request updated");
      reset({ status: values.status, note: "" });
      router.refresh();
    } catch {
      setRequestError("The service could not be reached. Please try again.");
      toast.error("The service could not be reached. Please try again.");
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      {requestError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {requestError}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="status">New status</Label>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.status && (
          <p className="text-sm text-red-600">{errors.status.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">Update note</Label>
        <Textarea
          id="note"
          maxLength={500}
          placeholder="Describe the action taken or information required."
          rows={5}
          {...register("note")}
        />
        {errors.note && (
          <p className="text-sm text-red-600">{errors.note.message}</p>
        )}
      </div>
      <Button
        className="w-full bg-[#0f2c52] text-white hover:bg-[#183d6b]"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting && <LoaderCircle aria-hidden="true" className="animate-spin" />}
        {isSubmitting ? "Saving update…" : "Save update"}
      </Button>
    </form>
  );
}