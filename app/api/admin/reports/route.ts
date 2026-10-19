import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReportRangeStart, parseReportRange } from "@/lib/report-date-range";

function escapeCsv(value: string): string {
  const safeValue = /^[=+@\-\t\r]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ success: false, message: "Authentication required." }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return Response.json({ success: false, message: "Administrator access required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const range = parseReportRange(searchParams.get("range") ?? undefined);
  const rangeStart = getReportRangeStart(range, new Date());
  const requests = await prisma.request.findMany({
    where: rangeStart ? { createdAt: { gte: rangeStart } } : {},
    orderBy: { createdAt: "desc" },
    select: {
      trackingId: true,
      createdAt: true,
      citizen: { select: { name: true } },
      category: true,
      location: true,
      status: true,
    },
  });

  const rows = [
    ["Tracking ID", "Date", "Citizen", "Category", "Location", "Status"],
    ...requests.map((item) => [
      item.trackingId,
      item.createdAt.toISOString(),
      item.citizen.name,
      item.category,
      item.location,
      item.status,
    ]),
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="reports.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
