import { NextRequest, NextResponse } from "next/server";
import {
  signSuperadminToken,
  signCommunityAdminToken,
  getAdminSession,
  verifySuperadminSession,
  verifyCommunityAdminSession,
  verifyPassword,
  getAdminCookieOptions,
} from "@/lib/auth";
import { resolveCommunity } from "@/lib/community";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const communityParam = searchParams.get("community");
  const session = await getAdminSession(request);

  if (communityParam) {
    const community = await resolveCommunity(communityParam);
    if (!community) {
      return NextResponse.json({ error: "Community nicht gefunden." }, { status: 404 });
    }
    const isAuthed = await verifyCommunityAdminSession(community.id, request);
    return NextResponse.json({
      authenticated: isAuthed,
      isSuperadmin: session?.role === "superadmin",
      community: {
        id: community.id,
        slug: community.slug,
        name: community.name,
        isDefault: community.isDefault,
      },
    });
  }

  const isAuthed = await verifySuperadminSession(request);
  return NextResponse.json({
    authenticated: isAuthed,
    isSuperadmin: isAuthed,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { password, communitySlug } = await request.json();
    const superadminPassword = process.env.ADMIN_PASSWORD || "wichtel-admin-geheim";

    if (!password || !password.toString().trim()) {
      return NextResponse.json(
        { error: "Bitte gib ein Passwort ein." },
        { status: 400 }
      );
    }

    const trimmedPassword = password.toString().trim();
    const cookieOpts = getAdminCookieOptions();

    // Superadmin password always works (for /admin or any /c/[slug]/admin)
    if (trimmedPassword === superadminPassword.trim()) {
      const token = await signSuperadminToken();
      const response = NextResponse.json({ success: true, role: "superadmin" });
      response.cookies.set({ ...cookieOpts, value: token });
      return response;
    }

    // Community-specific admin login
    if (communitySlug) {
      const community = await resolveCommunity(communitySlug);
      if (!community) {
        return NextResponse.json(
          { error: "Community nicht gefunden." },
          { status: 404 }
        );
      }

      if (
        community.adminPasswordHash &&
        verifyPassword(trimmedPassword, community.adminPasswordHash)
      ) {
        const token = await signCommunityAdminToken(community.id);
        const response = NextResponse.json({
          success: true,
          role: "community_admin",
          communityId: community.id,
        });
        response.cookies.set({ ...cookieOpts, value: token });
        return response;
      }
    }

    return NextResponse.json(
      { error: "Falsches Admin-Passwort." },
      { status: 401 }
    );
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
