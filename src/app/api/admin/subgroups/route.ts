import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCommunityAdminSession } from "@/lib/auth";
import { resolveCommunity } from "@/lib/community";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const community = await resolveCommunity(searchParams.get("community"));
  if (!community) {
    return NextResponse.json({ error: "Community nicht gefunden" }, { status: 404 });
  }

  if (!(await verifyCommunityAdminSession(community.id, request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const subgroups = await prisma.subgroup.findMany({
      where: { communityId: community.id },
      include: {
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ subgroups });
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Laden der Gruppen" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const body = await request.json();
  const community = await resolveCommunity(searchParams.get("community") || body.communitySlug);
  if (!community) {
    return NextResponse.json({ error: "Community nicht gefunden" }, { status: 404 });
  }

  if (!(await verifyCommunityAdminSession(community.id, request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const { name, color } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
    }

    const subgroup = await prisma.subgroup.create({
      data: {
        name: name.trim(),
        color: color?.trim() || null,
        communityId: community.id,
      },
    });

    return NextResponse.json({ subgroup });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Diese Gruppe existiert bereits." }, { status: 400 });
    }
    return NextResponse.json({ error: "Fehler beim Erstellen der Gruppe" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const community = await resolveCommunity(searchParams.get("community"));
  if (!community) {
    return NextResponse.json({ error: "Community nicht gefunden" }, { status: 404 });
  }

  if (!(await verifyCommunityAdminSession(community.id, request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID fehlt" }, { status: 400 });
    }

    const existing = await prisma.subgroup.findFirst({
      where: { id, communityId: community.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Gruppe nicht gefunden" }, { status: 404 });
    }

    await prisma.subgroup.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Löschen der Gruppe" }, { status: 500 });
  }
}
