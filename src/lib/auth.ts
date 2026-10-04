import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SessionPayload, createSessionToken, verifySessionToken, COOKIE_NAME } from "./jwt";

export { createSessionToken, verifySessionToken, COOKIE_NAME };
export type { SessionPayload };

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
