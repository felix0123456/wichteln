import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCommunityAdminSession } from "@/lib/auth";
import { resolveCommunity } from "@/lib/community";

function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

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
    const participants = await prisma.participant.findMany({
      where: { communityId: community.id },
      include: {
        subgroup: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            subgroup: { select: { id: true, name: true, color: true } },
          },
        },
      },
      orderBy: [{ subgroup: { name: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json({ participants });
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Laden der Teilnehmer" }, { status: 500 });
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
    // Check if bulk insert
    if (Array.isArray(body.participants)) {
      const created = [];
      for (const item of body.participants) {
        if (!item.name || !item.subgroupId) continue;
        const pin = item.pin?.toString().trim() || generatePin();
        const p = await prisma.participant.create({
          data: {
            name: item.name.trim(),
            subgroupId: item.subgroupId,
            communityId: community.id,
            pin,
          },
        });
        created.push(p);
      }
      return NextResponse.json({ created });
    }

    const { name, subgroupId, pin } = body;
    if (!name || !subgroupId) {
      return NextResponse.json(
        { error: "Name und Gruppe sind erforderlich." },
        { status: 400 }
      );
    }

    const subgroup = await prisma.subgroup.findFirst({
      where: { id: subgroupId, communityId: community.id },
    });
    if (!subgroup) {
      return NextResponse.json(
        { error: "Gruppe gehört nicht zu dieser Community." },
        { status: 400 }
      );
    }

    const assignedPin = pin?.toString().trim() || generatePin();

    const participant = await prisma.participant.create({
      data: {
        name: name.trim(),
        subgroupId,
        communityId: community.id,
        pin: assignedPin,
      },
      include: {
        subgroup: true,
      },
    });

    return NextResponse.json({ participant });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ein Teilnehmer mit diesem Namen existiert bereits in dieser Gruppe." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Fehler beim Anlegen des Teilnehmers." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { id, name, subgroupId, pin } = body;
    if (!id) {
      return NextResponse.json({ error: "ID fehlt" }, { status: 400 });
    }

    const existing = await prisma.participant.findFirst({
      where: { id, communityId: community.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Teilnehmer nicht gefunden." }, { status: 404 });
    }

    const data: any = {};
    if (name) data.name = name.trim();
    if (subgroupId) data.subgroupId = subgroupId;
    if (pin) data.pin = pin.toString().trim();

    const participant = await prisma.participant.update({
      where: { id },
      data,
      include: { subgroup: true },
    });

    return NextResponse.json({ participant });
  } catch (error) {
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Teilnehmers." },
      { status: 500 }
    );
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

    const target = await prisma.participant.findFirst({
      where: { id, communityId: community.id },
      include: {
        subgroup: true,
        assignedTo: { include: { subgroup: true } },
        assignedBy: { include: { subgroup: true } },
      },
    });

    if (!target) {
      return NextResponse.json(
        { error: "Teilnehmer nicht gefunden." },
        { status: 404 }
      );
    }

    const giver = target.assignedBy;
    const receiver = target.assignedTo;

    await prisma.$transaction(async (tx) => {
      if (giver) {
        await tx.participant.update({
          where: { id: giver.id },
          data: { assignedToId: null },
        });
      }
      if (receiver) {
        await tx.participant.update({
          where: { id: target.id },
          data: { assignedToId: null },
        });
      }

      await tx.participant.delete({
        where: { id: target.id },
      });

      if (giver && receiver && giver.id !== receiver.id) {
        await tx.participant.update({
          where: { id: giver.id },
          data: {
            assignedToId: receiver.id,
            hasRevealed: false,
            revealedAt: null,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      deletedName: target.name,
      reassignment:
        giver && receiver && giver.id !== receiver.id
          ? {
              giverId: giver.id,
              giverName: giver.name,
              giverSubgroup: giver.subgroup.name,
              giverPin: giver.pin,
              hadAlreadyRevealed: giver.hasRevealed,
              sameSubgroupWarning: giver.subgroupId === receiver.subgroupId,
            }
          : null,
    });
  } catch (error) {
    console.error("Delete participant error:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen des Teilnehmers." },
      { status: 500 }
    );
  }
}
