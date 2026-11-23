import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  signCommunityAdminToken,
  getAdminCookieOptions,
} from "@/lib/auth";
import { isValidSlug, slugifyCommunityName } from "@/lib/community";

function validateInviteState(invite: {
  usedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date | null;
} | null): { valid: true } | { valid: false; reason: string } {
  if (!invite) {
    return { valid: false, reason: "Dieser Einladungslink ist ungültig." };
  }
  if (invite.revokedAt) {
    return { valid: false, reason: "Dieser Einladungslink wurde widerrufen." };
  }
  if (invite.usedAt) {
    return { valid: false, reason: "Dieser Einladungslink wurde bereits verwendet." };
  }
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    return { valid: false, reason: "Dieser Einladungslink ist abgelaufen." };
  }
  return { valid: true };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const invite = await prisma.inviteLink.findUnique({ where: { token } });
    const state = validateInviteState(invite);

    if (!state.valid) {
      return NextResponse.json({ valid: false, error: state.reason }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      label: invite!.label,
      expiresAt: invite!.expiresAt,
    });
  } catch (error) {
    console.error("Error validating invite:", error);
    return NextResponse.json(
      { valid: false, error: "Fehler beim Prüfen des Einladungslinks." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const invite = await prisma.inviteLink.findUnique({ where: { token } });
    const state = validateInviteState(invite);

    if (!state.valid) {
      return NextResponse.json({ error: state.reason }, { status: 400 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const rawSlug =
      typeof body.slug === "string" && body.slug.trim()
        ? body.slug.trim().toLowerCase()
        : slugifyCommunityName(name);
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Bitte gib einen Community-Namen (mind. 2 Zeichen) ein." },
        { status: 400 }
      );
    }

    if (!isValidSlug(rawSlug)) {
      return NextResponse.json(
        {
          error:
            "Ungültige URL-Kurzform (Slug). Nur Kleinbuchstaben, Zahlen und Bindestriche (2-48 Zeichen, keine reservierten Namen).",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Das Admin-Passwort muss mindestens 6 Zeichen lang sein." },
        { status: 400 }
      );
    }

    const existingSlug = await prisma.community.findUnique({
      where: { slug: rawSlug },
    });
    if (existingSlug) {
      return NextResponse.json(
        { error: "Diese URL-Kurzform (Slug) ist bereits vergeben. Bitte wähle eine andere." },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);

    const community = await prisma.$transaction(async (tx) => {
      const created = await tx.community.create({
        data: {
          name,
          slug: rawSlug,
          isDefault: false,
          adminPasswordHash: passwordHash,
        },
      });

      await tx.inviteLink.update({
        where: { id: invite!.id },
        data: {
          usedAt: new Date(),
          communityId: created.id,
        },
      });

      return created;
    });

    const sessionToken = await signCommunityAdminToken(community.id);
    const response = NextResponse.json({
      success: true,
      community: {
        id: community.id,
        slug: community.slug,
        name: community.name,
      },
    });

    const cookieOpts = getAdminCookieOptions();
    response.cookies.set({
      ...cookieOpts,
      value: sessionToken,
    });

    return response;
  } catch (error) {
    console.error("Error redeeming invite:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Community." },
      { status: 500 }
    );
  }
}
