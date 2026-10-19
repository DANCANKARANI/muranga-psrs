import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function jsonError(message: string, status: number) {
  return Response.json({ success: false, message }, { status });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return jsonError("Authentication required.", 401);
  if (session.role !== "CITIZEN") return jsonError("Citizen access required.", 403);

  const { id } = await params;
  const existing = await prisma.request.findUnique({
    where: { id },
    select: { id: true, citizenId: true, upvotedBy: true },
  });
  if (!existing) return jsonError("Request not found.", 404);
  if (existing.citizenId === session.id) {
    return jsonError("You cannot upvote your own request.", 400);
  }
  if (existing.upvotedBy.includes(session.id)) {
    return jsonError("You have already upvoted this.", 400);
  }

  const result = await prisma.request.updateMany({
    where: {
      id,
      citizenId: { not: session.id },
      NOT: { upvotedBy: { has: session.id } },
    },
    data: {
      upvotes: { increment: 1 },
      upvotedBy: { push: session.id },
    },
  });

  if (result.count === 0) {
    const request = await prisma.request.findUnique({
      where: { id },
      select: { id: true, citizenId: true, upvotedBy: true },
    });
    if (!request) return jsonError("Request not found.", 404);
    if (request.citizenId === session.id) return jsonError("You cannot upvote your own request.", 400);
    if (request.upvotedBy.includes(session.id)) return jsonError("You have already upvoted this.", 400);
    return jsonError("The request could not be upvoted. Please try again.", 409);
  }

  const request = await prisma.request.findUniqueOrThrow({
    where: { id },
    select: { upvotes: true },
  });
  return Response.json({ success: true, upvotes: request.upvotes });
}
