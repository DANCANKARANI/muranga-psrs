import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function unauthorized() {
  return Response.json(
    { success: false, message: "Authentication required." },
    { status: 401 },
  );
}

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

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

export async function PATCH() {
  const session = await getSession();
  if (!session) return unauthorized();

  const result = await prisma.notification.updateMany({
    where: { userId: session.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/dashboard", "layout");
  return Response.json({ success: true, updated: result.count });
}
