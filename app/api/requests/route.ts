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
  location: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  attachment: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, {
      message: "Attachment must be 5 MB or smaller.",
    })
    .refine((file) => !file || file.size === 0 || file.type in attachmentTypes, {
      message: "Attachment must be a PDF, JPG, or PNG file.",
    }),
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

  const formFile = formData.get("attachment");
  const attachment =
    formFile instanceof File && formFile.size > 0 ? formFile : undefined;
  const parsed = requestSchema.safeParse({
    category: formData.get("category"),
    location: formData.get("location"),
    description: formData.get("description"),
    attachment,
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

  const fileExtension = parsed.data.attachment
    ? attachmentTypes[parsed.data.attachment.type]
    : undefined;
  const safeFilename = parsed.data.attachment
    ? `${randomUUID()}.${fileExtension}`
    : undefined;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const trackingId = generateTrackingId();
    const existing = await prisma.request.findUnique({
      where: { trackingId },
      select: { id: true },
    });
    if (existing) continue;

    let attachmentUrl: string | undefined;
    if (parsed.data.attachment && safeFilename) {
      const path = `${session.id}/${trackingId}/${safeFilename}`;
      try {
        attachmentUrl = await uploadFile(parsed.data.attachment, path);
      } catch (error) {
        return jsonError(
          error instanceof Error
            ? error.message
            : "The attachment could not be uploaded.",
          502,
        );
      }
    }

    try {
      const created = await prisma.request.create({
        data: {
          trackingId,
          category: parsed.data.category,
          location: parsed.data.location,
          description: parsed.data.description,
          attachment: attachmentUrl,
          citizenId: session.id,
          status: "PENDING",
        },
        select: { id: true, trackingId: true },
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