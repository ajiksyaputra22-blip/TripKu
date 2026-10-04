import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "wisata-terpadu-super-secret-jwt-key-2026"
);

export const COOKIE_NAME = "wisata_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "TRAVEL" | "CUSTOMER" | "GUIDE" | "DRIVER";
  travelId?: string;
  status: string;
  [key: string]: unknown;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
