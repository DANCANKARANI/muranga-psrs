import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequestForm } from "@/components/requests/RequestForm";
import { Button } from "@/components/ui/button";

export default function NewRequestPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button className="px-0 text-slate-600" nativeButton={false} render={<Link href="/dashboard" />} variant="link">
        <ArrowLeft aria-hidden="true" />
        Back to dashboard
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f2c52]">
          Submit a service request
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Provide the information below. Your tracking number will be available after submission.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <RequestForm />
      </div>
    </div>
  );
}