import { NextResponse } from "next/server";
import { z } from "zod";
import { signToken, verifyPassword } from "@/lib/auth";
import { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth-token";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
  password: z.string().min(1, "Password is required."),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { success: false, message: "Please enter a valid email and password." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true, email: true, name: true, password: true, role: true, status: true },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.password))) {
    return Response.json(
      { success: false, message: "Invalid email or password" },
      { status: 401 },
    );
  }

  if (user.status === "SUSPENDED") {
    return Response.json(
      { success: false, message: "Your account has been suspended. Please contact the county administrator." },
      { status: 403 },
    );
  }

  const token = await signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  const response = NextResponse.json({ success: true, role: user.role });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return response;
}
