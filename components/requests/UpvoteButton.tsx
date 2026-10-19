"use client";

import { ThumbsUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function UpvoteButton({
  requestId,
  initialCount,
  initiallyUpvoted,
  isOwner,
}: {
  requestId: string;
  initialCount: number;
  initiallyUpvoted: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [hasUpvoted, setHasUpvoted] = useState(initiallyUpvoted);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function upvote() {
    if (isOwner || hasUpvoted || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/requests/${requestId}/upvote`, { method: "POST" });
      const result = (await response.json()) as { success?: boolean; message?: string; upvotes?: number };
      if (!response.ok) {
        if (response.status === 400 && result.message?.includes("already upvoted")) {
          setHasUpvoted(true);
          router.refresh();
        }
        throw new Error(result.message ?? "Your vote could not be recorded.");
      }
      setCount(result.upvotes ?? count + 1);
      setHasUpvoted(true);
      toast.success("Your support has been recorded.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Your vote could not be recorded.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <span className="inline-flex" title={isOwner ? "You cannot upvote your own request" : undefined}>
      <Button
        aria-label={isOwner ? `You cannot upvote your own request. ${count} upvotes` : hasUpvoted ? `You upvoted this request. ${count} upvotes` : `Upvote request. ${count} upvotes`}
        className={isOwner ? "cursor-not-allowed text-slate-400" : hasUpvoted ? "text-[#0f2c52]" : "text-slate-600"}
        disabled={isOwner || hasUpvoted || isSubmitting}
        onClick={(event) => {
          event.stopPropagation();
          void upvote();
        }}
        size="sm"
        type="button"
        variant="outline"
      >
        <ThumbsUp aria-hidden="true" className="size-4" fill={hasUpvoted && !isOwner ? "currentColor" : "none"} />
        <span>{isOwner ? `Your request (${count})` : hasUpvoted ? `Upvoted (${count})` : `Upvote (${count})`}</span>
      </Button>
    </span>
  );
}
