import { NextRequest, NextResponse } from "next/server";
import { signAdminToken, verifyAdminSession, getAdminCookieOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const isAuthed = await verifyAdminSession(request);
  return NextResponse.json({ authenticated: isAuthed });
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.ADMIN_PASSWORD || "wichtel-admin-geheim";

    if (!password || password.trim() !== correctPassword.trim()) {
      return NextResponse.json(
        { error: "Falsches Admin-Passwort." },
        { status: 401 }
      );
    }

    const token = await signAdminToken();
    const response = NextResponse.json({ success: true });
    const cookieOpts = getAdminCookieOptions();

    response.cookies.set({
      ...cookieOpts,
      value: token,
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Serverfehler beim Login." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  const cookieOpts = getAdminCookieOptions();
  response.cookies.delete(cookieOpts.name);
  return response;
}
