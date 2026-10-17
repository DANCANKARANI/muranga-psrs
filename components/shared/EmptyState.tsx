import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Icon aria-hidden="true" className="size-6" />
        </span>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          {description}
        </p>
        {actionHref && actionLabel && (
          <Button
            className="mt-5 bg-[#0f2c52] text-white hover:bg-[#183d6b]"
            nativeButton={false}
            render={<Link href={actionHref} />}
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}