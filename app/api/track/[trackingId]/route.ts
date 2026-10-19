import { prisma } from "@/lib/prisma";
import { toPublicTracking } from "@/lib/public-tracking";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trackingId: string }> },
) {
  const { trackingId } = await params;
  const request = await prisma.request.findUnique({
    where: { trackingId },
    select: {
      trackingId: true,
      category: true,
      status: true,
      createdAt: true,
      updates: {
        // Administrative notes can contain personal or operational details.
        // Public tracking exposes status and date only.
        select: { status: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request) {
    return Response.json({ success: false, message: "No request found." }, { status: 404 });
  }

  return Response.json(toPublicTracking(request), {
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
