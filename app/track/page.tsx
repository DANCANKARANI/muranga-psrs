"use client";

import Image from "next/image";
import countyCrest from "@/public/logo.png";
import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import { StatusBadge, type RequestStatus } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";

interface TrackedRequest {
  trackingId: string;
  category: string;
  location: string;
  description: string;
  status: RequestStatus;
  createdAt: string;
  updates: { status: RequestStatus; note: string; createdAt: string }[];
}

export default function TrackRequestPage() {
  const [trackingId, setTrackingId] = useState("");
  const [trackedRequest, setTrackedRequest] = useState<TrackedRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = trackingId.trim().toUpperCase();
    if (!value) return;

    setIsLoading(true);
    setError(null);
    setTrackedRequest(null);
    try {
      const response = await fetch(`/api/track/${encodeURIComponent(value)}`);
      if (response.status === 404) {
        setError("No request found with that tracking ID.");
        return;
      }
      if (!response.ok) throw new Error("Tracking service is unavailable.");
      setTrackedRequest((await response.json()) as TrackedRequest);
    } catch {
      setError("The tracking service could not be reached. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-5 sm:px-8">
          <Image alt="Murang’a County Government crest" className="size-10 object-contain" height={40} src={countyCrest} />
          <div>
            <p className="text-sm font-bold text-[#0f2c52]">Murang&apos;a County</p>
            <p className="text-xs text-slate-600">Public Service Portal</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-8 px-5 py-10 sm:px-8 sm:py-14">
        <Button className="px-0 text-slate-600" nativeButton={false} render={<Link href="/" />} variant="link">
          <ArrowLeft aria-hidden="true" />
          Back to home
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0f2c52]">Track a request</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Enter the tracking number provided when your request was submitted.
          </p>
        </div>
        <Card>
          <CardContent className="p-5 sm:p-6">
            <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={handleSubmit}>
              <div className="flex-1 space-y-2">
                <Label htmlFor="trackingId">Tracking number</Label>
                <Input
                  autoCapitalize="characters"
                  autoComplete="off"
                  id="trackingId"
                  onChange={(event) => setTrackingId(event.target.value)}
                  placeholder="MCG-2026-A1B2"
                  value={trackingId}
                />
              </div>
              <Button className="h-10 bg-[#0f2c52] text-white hover:bg-[#183d6b]" disabled={isLoading || !trackingId.trim()} type="submit">
                {isLoading ? <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Search aria-hidden="true" />}
                {isLoading ? "Searching…" : "Search"}
              </Button>
            </form>
            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50 text-red-800" variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {trackedRequest && (
          <Card>
            <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="font-mono text-xl">{trackedRequest.trackingId}</CardTitle>
                <p className="mt-2 text-sm text-slate-600">{trackedRequest.category} · {trackedRequest.location}</p>
                <p className="mt-1 text-sm text-slate-600">Submitted {formatDate(new Date(trackedRequest.createdAt))}</p>
              </div>
              <StatusBadge status={trackedRequest.status} />
            </CardHeader>
            <CardContent>
              <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-sm font-semibold text-slate-900">Issue description</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{trackedRequest.description}</p>
              </div>
              <h2 className="mb-4 text-base font-semibold text-slate-900">Progress timeline</h2>
              {trackedRequest.updates.length === 0 ? (
                <p className="text-sm text-slate-600">Your report has been received and is awaiting review.</p>
              ) : (
                <ol className="space-y-0">
                  {trackedRequest.updates.map((update, index) => (
                    <li className="relative flex gap-4 pb-7 last:pb-0" key={`${update.createdAt}-${index}`}>
                      {index < trackedRequest.updates.length - 1 && <span aria-hidden="true" className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />}
                      <span aria-hidden="true" className="relative mt-1 size-4 shrink-0 rounded-full border-4 border-blue-100 bg-[#0f2c52]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <StatusBadge status={update.status} />
                          <time className="text-xs text-slate-500" dateTime={update.createdAt}>{formatDate(new Date(update.createdAt))}</time>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{update.note}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <footer className="border-t border-slate-200 bg-white px-5 py-5 text-center text-xs text-slate-500">
        © 2026 Murang&apos;a County Government. All rights reserved.
      </footer>
    </div>
  );
}