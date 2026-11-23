import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "wichteln-fallback-secret-2026-family-change-me";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = "wichtel_admin_session";

export type AdminSession =
  | { role: "superadmin" }
  | { role: "community_admin"; communityId: string };

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, "hex");
  const derivedBuf = scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return timingSafeEqual(keyBuf, derivedBuf);
}

export async function signSuperadminToken(): Promise<string> {
  return await new SignJWT({ role: "superadmin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

// Backward-compatible alias
export const signAdminToken = signSuperadminToken;

export async function signCommunityAdminToken(communityId: string): Promise<string> {
  return await new SignJWT({ role: "community_admin", communityId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function getAdminSession(
  request?: NextRequest
): Promise<AdminSession | null> {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get(COOKIE_NAME)?.value;
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(COOKIE_NAME)?.value;
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (payload.role === "superadmin" || payload.role === "admin") {
      return { role: "superadmin" };
    }
    if (
      payload.role === "community_admin" &&
      typeof payload.communityId === "string" &&
      payload.communityId.length > 0
    ) {
      return { role: "community_admin", communityId: payload.communityId };
    }
    return null;
  } catch {
    return null;
  }
}

export async function verifySuperadminSession(
  request?: NextRequest
): Promise<boolean> {
  const session = await getAdminSession(request);
  return session?.role === "superadmin";
}

// Backward-compatible alias: superadmin check
export const verifyAdminSession = verifySuperadminSession;

export async function verifyCommunityAdminSession(
  communityId: string,
  request?: NextRequest
): Promise<boolean> {
  const session = await getAdminSession(request);
  if (!session) return false;
  if (session.role === "superadmin") return true;
  return session.role === "community_admin" && session.communityId === communityId;
}

export function getAdminCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  };
}
