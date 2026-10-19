export const reportRanges = ["today", "week", "month", "all"] as const;
export type ReportRange = (typeof reportRanges)[number];

export function parseReportRange(value: string | string[] | undefined): ReportRange {
  const first = Array.isArray(value) ? value[0] : value;
  return reportRanges.includes(first as ReportRange) ? (first as ReportRange) : "all";
}

export function getReportRangeStart(range: ReportRange, now: Date): Date | undefined {
  if (range === "all") return undefined;

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === "week") {
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
  } else if (range === "month") {
    start.setDate(1);
  }
  return start;
}

export function getReportRangeLabel(range: ReportRange): string {
  switch (range) {
    case "today": return "Today";
    case "week": return "This week";
    case "month": return "This month";
    case "all": return "All time";
  }
}
