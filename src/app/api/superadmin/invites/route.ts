import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { verifySuperadminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!(await verifySuperadminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const invites = await prisma.inviteLink.findMany({
      include: {
        community: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Error loading invites:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Einladungslinks." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifySuperadminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : null;
    const expiresInDays = Number(body.expiresInDays);

    let expiresAt: Date | null = null;
    if (!Number.isNaN(expiresInDays) && expiresInDays > 0) {
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }

    const token = randomBytes(18).toString("base64url");

    const invite = await prisma.inviteLink.create({
      data: {
        token,
        label,
        expiresAt,
      },
    });

    return NextResponse.json({ invite });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Einladungslinks." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifySuperadminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID fehlt" }, { status: 400 });
    }

    const invite = await prisma.inviteLink.findUnique({ where: { id } });
    if (!invite) {
      return NextResponse.json({ error: "Einladungslink nicht gefunden" }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json(
        { error: "Bereits genutzte Einladungslinks können nicht widerrufen werden." },
        { status: 400 }
      );
    }

    await prisma.inviteLink.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking invite:", error);
    return NextResponse.json(
      { error: "Fehler beim Widerrufen des Einladungslinks." },
      { status: 500 }
    );
  }
}
