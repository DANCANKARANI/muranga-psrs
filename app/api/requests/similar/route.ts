import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ success: false, message: "Authentication required." }, { status: 401 });
  if (session.role !== "CITIZEN") return Response.json({ success: false, message: "Citizen access required." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category")?.trim();
  const location = searchParams.get("location")?.trim();
  if (!category || !location || location.length < 3 || location.length > 120) {
    return Response.json({ success: false, message: "A category and valid location are required." }, { status: 400 });
  }

  const activeRequests = await prisma.request.findMany({
    where: {
      status: { in: ["PENDING", "IN_PROGRESS"] },
      category,
      location: { contains: location, mode: "insensitive" },
    },
    orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
    take: 3,
    select: {
      id: true,
      trackingId: true,
      category: true,
      location: true,
      upvotes: true,
      createdAt: true,
      citizenId: true,
      upvotedBy: true,
    },
  });
  const resolvedRequest = await prisma.request.findFirst({
    where: {
      status: "RESOLVED",
      category,
      location: { contains: location, mode: "insensitive" },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      category: true,
      location: true,
      updatedAt: true,
    },
  });

  return Response.json({
    activeDuplicates: activeRequests.map(({ citizenId, upvotedBy, ...item }) => ({
      ...item,
      isOwner: citizenId === session.id,
      hasUpvoted: upvotedBy.includes(session.id),
    })),
    resolvedHistory: resolvedRequest,
  });
}
