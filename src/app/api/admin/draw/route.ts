import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCommunityAdminSession } from "@/lib/auth";
import { resolveCommunity } from "@/lib/community";
import { generateWichtelMatching } from "@/lib/matching";

export async function POST(request: NextRequest) {
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
      select: {
        id: true,
        name: true,
        subgroupId: true,
      },
    });

    if (participants.length < 3) {
      return NextResponse.json(
        { error: "Mindestens 3 Teilnehmer sind erforderlich." },
        { status: 400 }
      );
    }

    const result = generateWichtelMatching(participants);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Auslosung fehlgeschlagen." },
        { status: 400 }
      );
    }

    const drawnAt = new Date().toISOString();

    await prisma.$transaction(async (tx) => {
      await tx.participant.updateMany({
        where: { communityId: community.id },
        data: {
          assignedToId: null,
          hasRevealed: false,
          revealedAt: null,
        },
      });

      for (const [giverId, receiverId] of result.assignments.entries()) {
        await tx.participant.update({
          where: { id: giverId },
          data: {
            assignedToId: receiverId,
          },
        });
      }

      await tx.setting.upsert({
        where: { communityId_key: { communityId: community.id, key: "is_drawn" } },
        update: { value: "true" },
        create: { communityId: community.id, key: "is_drawn", value: "true" },
      });

      await tx.setting.upsert({
        where: { communityId_key: { communityId: community.id, key: "drawn_at" } },
        update: { value: drawnAt },
        create: { communityId: community.id, key: "drawn_at", value: drawnAt },
      });
    });

    return NextResponse.json({
      success: true,
      count: participants.length,
      drawnAt,
    });
  } catch (error: any) {
    console.error("Draw error:", error);
    return NextResponse.json(
      { error: "Fehler beim Durchführen der Auslosung." },
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
    await prisma.$transaction([
      prisma.participant.updateMany({
        where: { communityId: community.id },
        data: {
          assignedToId: null,
          hasRevealed: false,
          revealedAt: null,
        },
      }),
      prisma.setting.upsert({
        where: { communityId_key: { communityId: community.id, key: "is_drawn" } },
        update: { value: "false" },
        create: { communityId: community.id, key: "is_drawn", value: "false" },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Auslosung zurückgesetzt." });
  } catch (error) {
    return NextResponse.json(
      { error: "Fehler beim Zurücksetzen der Auslosung." },
      { status: 500 }
    );
  }
}
