import { z } from "zod";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters.")
    .regex(/[A-Za-z]/, "New password must contain a letter.")
    .regex(/[0-9]/, "New password must contain a number."),
});

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json(
      { success: false, message: "Authentication required." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        message: "New password must be at least 8 characters and include a letter and a number.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { password: true },
  });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.password))) {
    return Response.json(
      { success: false, message: "Current password is incorrect." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: session.id },
    data: { password: await hashPassword(parsed.data.newPassword) },
  });

  return Response.json({ success: true });
}
