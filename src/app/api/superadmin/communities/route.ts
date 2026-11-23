import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySuperadminSession, hashPassword } from "@/lib/auth";
import { ensureDefaultCommunity } from "@/lib/community";

export async function GET(request: NextRequest) {
  if (!(await verifySuperadminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    await ensureDefaultCommunity();

    const communities = await prisma.community.findMany({
      include: {
        _count: {
          select: {
            participants: true,
            subgroups: true,
          },
        },
        settings: {
          where: { key: "is_drawn" },
          select: { value: true },
        },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    const formatted = communities.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      isDefault: c.isDefault,
      createdAt: c.createdAt,
      participantCount: c._count.participants,
      subgroupCount: c._count.subgroups,
      isDrawn: c.settings[0]?.value === "true",
    }));

    return NextResponse.json({ communities: formatted });
  } catch (error) {
    console.error("Error loading communities:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Communities." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await verifySuperadminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const { id, newPassword, name } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Community-ID fehlt." }, { status: 400 });
    }

    const community = await prisma.community.findUnique({ where: { id } });
    if (!community) {
      return NextResponse.json({ error: "Community nicht gefunden." }, { status: 404 });
    }

    const data: { adminPasswordHash?: string; name?: string } = {};
    if (typeof newPassword === "string" && newPassword.trim().length > 0) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json(
          { error: "Das neue Passwort muss mindestens 6 Zeichen lang sein." },
          { status: 400 }
        );
      }
      data.adminPasswordHash = hashPassword(newPassword.trim());
    }
    if (typeof name === "string" && name.trim().length > 0) {
      data.name = name.trim();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Keine Änderungen angegeben." }, { status: 400 });
    }

    const updated = await prisma.community.update({
      where: { id },
      data,
      select: { id: true, slug: true, name: true, isDefault: true },
    });

    return NextResponse.json({ success: true, community: updated });
  } catch (error) {
    console.error("Error updating community:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Community." },
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

    const community = await prisma.community.findUnique({ where: { id } });
    if (!community) {
      return NextResponse.json({ error: "Community nicht gefunden." }, { status: 404 });
    }

    if (community.isDefault) {
      return NextResponse.json(
        { error: "Die Standard-Community kann nicht gelöscht werden." },
        { status: 400 }
      );
    }

    await prisma.community.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting community:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen der Community." },
      { status: 500 }
    );
  }
}
