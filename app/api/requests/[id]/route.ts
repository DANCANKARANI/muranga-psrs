import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function jsonError(message: string, status: number) {
  return Response.json({ success: false, message }, { status });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return jsonError("Authentication required.", 401);

  const { id } = await params;
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      citizen: { select: { id: true, name: true, email: true } },
      updates: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!request) return jsonError("Request not found.", 404);
  if (session.role !== "ADMIN" && request.citizenId !== session.id) {
    return jsonError("You are not authorized to view this request.", 403);
  }

  return Response.json(request);
}