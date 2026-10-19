import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMissingSettingsTable } from "@/lib/settings";

const settingsSchema = z.object({
  countyName: z.string().trim().min(2).max(100),
  adminEmail: z.string().trim().email().max(254),
  slaDays: z.number().int().min(1).max(90),
});

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ message: "Authentication required." }, { status: 401 });
  if (session.role !== "ADMIN") return Response.json({ message: "Administrator access required." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid request body." }, { status: 400 });
  }
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return Response.json({ message: "Enter a valid county name, email address, and SLA between 1 and 90 days." }, { status: 400 });

  try {
    await prisma.$transaction(async (transaction) => {
      for (const [key, value] of Object.entries(parsed.data)) {
        await transaction.systemSetting.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        });
      }
    });
  } catch (error) {
    if (isMissingSettingsTable(error)) {
      return Response.json({ message: "Settings storage is unavailable. Run npx prisma db push first." }, { status: 503 });
    }
    throw error;
  }
  return Response.json({ success: true });
}
