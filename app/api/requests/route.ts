import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTrackingId } from "@/lib/utils";
import { uploadFile } from "@/lib/supabase";

const categories = [
  "Streetlight",
  "Water",
  "Garbage Collection",
  "Roads",
  "Drainage",
  "Other",
] as const;

const attachmentTypes: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const requestSchema = z.object({
  category: z.enum(categories),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).default("NORMAL"),
  location: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  attachments: z
    .array(z.instanceof(File))
    .max(5, "Upload no more than 5 files at a time.")
    .refine((files) => files.every((file) => file.size <= 5 * 1024 * 1024), {
      message: "Each attachment must be 5 MB or smaller.",
    })
    .refine(
      (files) => files.every((file) => file.type in attachmentTypes),
      { message: "Attachments must be PDF, JPG, or PNG files." },
    ),
});

function jsonError(message: string, status: number) {
  return Response.json({ success: false, message }, { status });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return jsonError("Authentication required.", 401);
  if (session.role !== "CITIZEN") return jsonError("Citizen access required.", 403);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Request data could not be read.", 400);
  }

  const attachments = formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const parsed = requestSchema.safeParse({
    category: formData.get("category"),
    priority: formData.get("priority") ?? "NORMAL",
    location: formData.get("location"),
    description: formData.get("description"),
    attachments,
  });

  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        message: "Please check the request details and attachment.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const duplicate = await prisma.request.findFirst({
    where: {
      category: parsed.data.category,
      location: { equals: parsed.data.location, mode: "insensitive" },
      status: "PENDING",
    },
    select: { id: true },
  });
  if (duplicate) {
    return jsonError("A similar request already exists. Please upvote it instead.", 400);
  }

  const adminRecipients = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const trackingId = generateTrackingId();
    const existing = await prisma.request.findUnique({
      where: { trackingId },
      select: { id: true },
    });
    if (existing) continue;

    let uploadedAttachments: {
      storagePath: string;
      fileName: string;
      contentType: string;
    }[];
    try {
      uploadedAttachments = await Promise.all(
        parsed.data.attachments.map(async (file) => {
          const extension = attachmentTypes[file.type];
          const storagePath = `${session.id}/${trackingId}/${randomUUID()}.${extension}`;
          await uploadFile(file, storagePath);
          return {
            storagePath,
            fileName: file.name.replace(/[\\/\r\n\0]/g, "_").slice(0, 180),
            contentType: file.type,
          };
        }),
      );
    } catch (error) {
      return jsonError(
        error instanceof Error ? error.message : "Attachments could not be uploaded.",
        502,
      );
    }

    try {
      const created = await prisma.$transaction(async (transaction) => {
        const newRequest = await transaction.request.create({
          data: {
            trackingId,
            category: parsed.data.category,
            priority: parsed.data.priority,
            slaDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            location: parsed.data.location,
            description: parsed.data.description,
            attachments: { create: uploadedAttachments },
            citizenId: session.id,
            status: "PENDING",
          },
          select: { id: true, trackingId: true, category: true },
        });

        if (adminRecipients.length > 0) {
          await transaction.notification.createMany({
            data: adminRecipients.map(({ id }) => ({
              userId: id,
              title: "New request submitted",
              message: `${newRequest.category} request ${newRequest.trackingId} is awaiting review.`,
              link: `/admin/requests/${newRequest.id}`,
            })),
          });
        }
        return newRequest;
      });

      revalidatePath("/dashboard", "layout");
      revalidatePath("/admin", "layout");
      return Response.json({
        success: true,
        trackingId: created.trackingId,
        id: created.id,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  return jsonError("A tracking number could not be assigned. Please try again.", 503);
}

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Authentication required.", 401);
  if (session.role !== "CITIZEN") return jsonError("Citizen access required.", 403);

  const requests = await prisma.request.findMany({
    where: { citizenId: session.id },
    orderBy: { createdAt: "desc" },
    include: { updates: { orderBy: { createdAt: "asc" } } },
  });

  return Response.json(requests);
}
