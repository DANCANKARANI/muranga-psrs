import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  phone: z.string().trim().max(32).optional().transform((phone) => phone || null),
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

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        message: "Enter a valid name and phone number.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: session.id },
    data: parsed.data,
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin", "layout");
  return Response.json({ success: true, user });
}
