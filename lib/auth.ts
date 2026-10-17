import "server-only";

import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  type TokenPayload,
  verifyToken,
} from "@/lib/auth-token";

export type { TokenPayload, UserRole } from "@/lib/auth-token";
export { signToken, verifyToken } from "@/lib/auth-token";

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  return hash(password, 12);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return token ? verifyToken(token) : null;
}