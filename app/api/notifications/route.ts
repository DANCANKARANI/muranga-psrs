import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function unauthorized() {
  return Response.json(
    { success: false, message: "Authentication required." },
    { status: 401 },
  );
}

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  // Both roles receive rows addressed to their own account: request updates
  // for citizens and new-report activity for administrators.
  const notifications = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 5,
    select: {
      id: true,
      title: true,
      message: true,
      isRead: true,
      link: true,
      createdAt: true,
    },
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, isRead: false },
  });

  return Response.json({ notifications, unreadCount }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

const markReadSchema = z.object({ id: z.string().min(1).optional() }).strict();

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }
  const parsed = markReadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ success: false, message: "Invalid notification." }, { status: 400 });
  }

  const result = await prisma.notification.updateMany({
    where: {
      userId: session.id,
      isRead: false,
      ...(parsed.data.id ? { id: parsed.data.id } : {}),
    },
    data: { isRead: true },
  });

  return Response.json({ success: true, updated: result.count });
}
