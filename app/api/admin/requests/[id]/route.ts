import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z.enum([
    "PENDING",
    "IN_PROGRESS",
    "RESOLVED",
  ]),
  note: z.string().trim().min(3).max(500),
});

function jsonError(message: string, status: number) {
  return Response.json({ success: false, message }, { status });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return jsonError("Authentication required.", 401);
  if (session.role !== "ADMIN") return jsonError("Administrator access required.", 403);

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        message: "Enter a valid status and a note of 3 to 500 characters.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const existingRequest = await prisma.request.findUnique({
    where: { id },
    select: { id: true, citizenId: true, trackingId: true },
  });
  if (!existingRequest) return jsonError("Request not found.", 404);

  const updated = await prisma.$transaction(async (transaction) => {
    await transaction.request.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    await transaction.requestUpdate.create({
      data: {
        requestId: id,
        status: parsed.data.status,
        note: parsed.data.note,
        adminName: session.name,
      },
    });
    await transaction.notification.create({
      data: {
        userId: existingRequest.citizenId,
        title: "Request Updated",
        message: `Your request ${existingRequest.trackingId} is now ${parsed.data.status.replaceAll("_", " ").toLowerCase()}.`,
        link: `/dashboard/requests/${id}`,
      },
    });

    return transaction.request.findUniqueOrThrow({
      where: { id },
      include: {
        citizen: { select: { id: true, name: true, email: true } },
        updates: { orderBy: { createdAt: "asc" } },
      },
    });
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/dashboard/requests/${id}`);
  revalidatePath(`/admin/requests/${id}`);

  return Response.json({ success: true, request: updated });
}