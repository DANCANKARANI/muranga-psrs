import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }).strict();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ success: false, message: "Authentication required." }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return Response.json({ success: false, message: "Administrator access required." }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.id) {
    return Response.json({ success: false, message: "You cannot change your own account status." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ success: false, message: "Choose a valid account status." }, { status: 400 });
  }

  const result = await prisma.user.updateMany({
    where: { id },
    data: { status: parsed.data.status },
  });
  if (result.count === 0) {
    return Response.json({ success: false, message: "User not found." }, { status: 404 });
  }

  return Response.json({ success: true, status: parsed.data.status });
}
