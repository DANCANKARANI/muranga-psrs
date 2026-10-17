"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const categories = [
  "Streetlight",
  "Water",
  "Garbage Collection",
  "Roads",
  "Drainage",
  "Other",
] as const;

const requestSchema = z.object({
  category: z.enum(categories, { error: "Select a service category." }),
  location: z
    .string()
    .trim()
    .min(3, "Enter at least 3 characters.")
    .max(120, "Location must not exceed 120 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Enter at least 10 characters.")
    .max(2000, "Description must not exceed 2,000 characters."),
});

type RequestFormValues = z.infer<typeof requestSchema>;

const responseSchema = z.object({
  success: z.boolean(),
  trackingId: z.string().optional(),
  message: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

export function RequestForm() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { location: "", description: "" },
  });
  const description = useWatch({ control, name: "description" }) ?? "";

  async function onSubmit(values: RequestFormValues) {
    setApiError(null);
    if (attachments.length > 5) {
      const message = "Upload no more than 5 files at a time.";
      setApiError(message);
      toast.error(message);
      return;
    }
    if (attachments.some((file) => file.size > 5 * 1024 * 1024)) {
      const message = "Each attachment must be 5 MB or smaller.";
      setApiError(message);
      toast.error(message);
      return;
    }
    if (attachments.some((file) => !["application/pdf", "image/jpeg", "image/png"].includes(file.type))) {
      const message = "Choose PDF, JPG, or PNG files only.";
      setApiError(message);
      toast.error(message);
      return;
    }

    const data = new FormData();
    data.set("category", values.category);
    data.set("location", values.location);
    data.set("description", values.description);
    attachments.forEach((file) => data.append("attachments", file));

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        body: data,
      });
      const result = responseSchema.safeParse(await response.json());

      if (!response.ok || !result.success || !result.data.success || !result.data.trackingId) {
        const message = result.success
          ? result.data.message ?? "Your request could not be submitted."
          : "Your request could not be submitted. Check the form and try again.";
        setApiError(message);
        toast.error(message);
        return;
      }

      toast.success(`Request submitted. Tracking ID: ${result.data.trackingId}`);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setApiError("The service could not be reached. Please try again.");
      toast.error("The service could not be reached. Please try again.");
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      {apiError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {apiError}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="category">Service category</Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value ?? undefined)}
            >
              <SelectTrigger id="category" className="h-10 w-full" aria-invalid={Boolean(errors.category)}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          maxLength={120}
          placeholder="e.g., Kenol Market, near the main gate"
          aria-invalid={Boolean(errors.location)}
          {...register("location")}
        />
        {errors.location && <p className="text-sm text-red-600">{errors.location.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          maxLength={2000}
          placeholder="Describe the issue in detail"
          rows={7}
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
        <div className="flex items-start justify-between gap-4">
          {errors.description ? (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          ) : (
            <p className="text-xs text-slate-500">Include details that will help the county locate and address the issue.</p>
          )}
          <span className="shrink-0 text-xs text-slate-500">{description.length}/2000</span>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="attachments">Photos or supporting documents (optional)</Label>
        <Input
          id="attachments"
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          multiple
          onChange={(event) => {
            setAttachments(Array.from(event.currentTarget.files ?? []));
            setApiError(null);
          }}
        />
        <p className="text-xs text-slate-500">Select up to 5 PDF, JPG, or PNG files · max 5 MB each</p>
        {attachments.length > 0 && (
          <ul aria-label="Selected attachments" className="space-y-1 text-sm text-slate-600">
            {attachments.map((file, index) => (
              <li className="truncate" key={`${file.name}-${file.lastModified}-${index}`}>
                {file.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button
        className="h-11 w-full bg-[#0f2c52] text-white hover:bg-[#183d6b]"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting && <LoaderCircle aria-hidden="true" className="animate-spin" />}
        {isSubmitting ? "Submitting request…" : "Submit request"}
      </Button>
    </form>
  );
}