"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertTriangle, ThumbsUp } from "lucide-react";
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

type SimilarRequest = {
  id: string;
  trackingId: string;
  category: string;
  location: string;
  upvotes: number;
  createdAt: string;
  isOwner: boolean;
  hasUpvoted: boolean;
};

type ResolvedHistory = {
  category: string;
  location: string;
  updatedAt: string;
};

function timeAgo(date: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

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
  priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]),
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
  id: z.string().optional(),
  trackingId: z.string().optional(),
  message: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

export function RequestForm() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [activeDuplicates, setActiveDuplicates] = useState<SimilarRequest[]>([]);
  const [resolvedHistory, setResolvedHistory] = useState<ResolvedHistory | null>(null);
  const [isSearchingSimilar, setIsSearchingSimilar] = useState(false);
  const [similarSearchError, setSimilarSearchError] = useState<string | null>(null);
  const [supportingId, setSupportingId] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { priority: "NORMAL", location: "", description: "" },
  });
  const description = useWatch({ control, name: "description" }) ?? "";
  const category = useWatch({ control, name: "category" });
  const location = useWatch({ control, name: "location" }) ?? "";

  useEffect(() => {
    const normalizedLocation = location.trim();
    if (!category || normalizedLocation.length < 3) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setActiveDuplicates([]);
      setResolvedHistory(null);
      setSimilarSearchError(null);
      setIsSearchingSimilar(true);
      try {
        const params = new URLSearchParams({ category, location: normalizedLocation });
        const response = await fetch(`/api/requests/similar?${params}`, { signal: controller.signal });
        const result = (await response.json()) as {
          activeDuplicates?: SimilarRequest[];
          resolvedHistory?: ResolvedHistory | null;
          message?: string;
        };
        if (response.ok) {
          setActiveDuplicates(result.activeDuplicates ?? []);
          setResolvedHistory(result.resolvedHistory ?? null);
        } else {
          setSimilarSearchError(result.message ?? "Similar requests could not be checked.");
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setActiveDuplicates([]);
          setResolvedHistory(null);
          setSimilarSearchError("Similar requests could not be checked. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setIsSearchingSimilar(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [category, location]);

  async function supportRequest(requestId: string) {
    setSupportingId(requestId);
    try {
      const response = await fetch(`/api/requests/${requestId}/upvote`, { method: "POST" });
      const result = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok) throw new Error(result.message ?? "This request could not be supported.");
      toast.success("You supported an existing request!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "This request could not be supported.");
      setSupportingId(null);
    }
  }

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
    data.set("priority", values.priority);
    data.set("location", values.location);
    data.set("description", values.description);
    attachments.forEach((file) => data.append("attachments", file));

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        body: data,
      });
      const result = responseSchema.safeParse(await response.json());

      if (!response.ok || !result.success || !result.data.success || !result.data.trackingId || !result.data.id) {
        const message = result.success
          ? result.data.message ?? "Your request could not be submitted."
          : "Your request could not be submitted. Check the form and try again.";
        setApiError(message);
        toast.error(message);
        return;
      }

      toast.success(`Request submitted. Tracking ID: ${result.data.trackingId}`);
      router.push(`/dashboard/requests/${result.data.id}?submitted=1`);
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
        <Label htmlFor="priority">Priority</Label>
        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <Select value={field.value} onValueChange={(value) => value && field.onChange(value)}>
              <SelectTrigger id="priority" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <p className="text-xs text-slate-500">Choose how urgently this issue needs attention.</p>
      </div>
      <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900">New requests receive a 3-day resolution target. You can support community reports with an upvote after submission.</p>
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
      {category && location.trim().length >= 3 && isSearchingSimilar && <p aria-live="polite" className="text-xs text-slate-500">Checking for similar open requests…</p>}
      {category && location.trim().length >= 3 && similarSearchError && <p aria-live="polite" className="text-sm text-red-700" role="status">{similarSearchError}</p>}
      {category && location.trim().length >= 3 && activeDuplicates.length > 0 && (
        <section aria-labelledby="similar-requests-title" className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-700" />
            <div>
              <h2 id="similar-requests-title" className="font-semibold text-amber-950">Wait! We found similar active requests in your area.</h2>
              <p className="mt-1 text-sm text-amber-900">Support an existing report to help the county prioritize the issue.</p>
            </div>
          </div>
          <ul className="space-y-2">
            {activeDuplicates.map((request) => (
              <li key={request.id} className="flex flex-col justify-between gap-3 rounded-lg border border-amber-200 bg-white p-3 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{request.category} issue at {request.location}</p>
                  <p className="mt-1 text-xs text-slate-600">{request.upvotes} {request.upvotes === 1 ? "upvote" : "upvotes"} · {timeAgo(request.createdAt)} · {request.trackingId}</p>
                </div>
                <Button
                  className="shrink-0"
                  disabled={isSubmitting || supportingId !== null || request.isOwner || request.hasUpvoted}
                  onClick={() => void supportRequest(request.id)}
                  type="button"
                  variant="outline"
                >
                  {supportingId === request.id ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <ThumbsUp aria-hidden="true" className="size-4" />}
                  {request.isOwner ? "Your request" : request.hasUpvoted ? "Already supported" : "Upvote & Support This"}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {category && location.trim().length >= 3 && activeDuplicates.length === 0 && resolvedHistory && (
        <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950" role="status">
          <span className="mt-0.5 size-2 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
          <p className="text-sm leading-6">
            Good news: A similar {resolvedHistory.category} issue at {resolvedHistory.location} was recently resolved. You can still submit a new report if the issue has returned.
          </p>
        </div>
      )}
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
