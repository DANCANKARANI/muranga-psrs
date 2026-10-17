import { prisma } from "@/lib/prisma";
import { truncate } from "@/lib/utils";

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
      location: true,
      description: true,
      status: true,
      createdAt: true,
      updates: {
        select: { status: true, note: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request) {
    return Response.json({ success: false, message: "No request found." }, { status: 404 });
  }

  return Response.json({
    ...request,
    description: truncate(request.description, 500),
  });
}