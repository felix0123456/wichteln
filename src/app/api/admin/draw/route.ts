import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth";
import { generateWichtelMatching } from "@/lib/matching";

export async function POST(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const participants = await prisma.participant.findMany({
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

    // Apply assignments in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Reset all assignments first to avoid unique constraint conflicts
      await tx.participant.updateMany({
        data: {
          assignedToId: null,
          hasRevealed: false,
          revealedAt: null,
        },
      });

      // 2. Set each assignment
      for (const [giverId, receiverId] of result.assignments.entries()) {
        await tx.participant.update({
          where: { id: giverId },
          data: {
            assignedToId: receiverId,
          },
        });
      }

      // 3. Mark as drawn
      await tx.setting.upsert({
        where: { key: "is_drawn" },
        update: { value: "true" },
        create: { key: "is_drawn", value: "true" },
      });

      await tx.setting.upsert({
        where: { key: "drawn_at" },
        update: { value: new Date().toISOString() },
        create: { key: "drawn_at", value: new Date().toISOString() },
      });
    });

    return NextResponse.json({
      success: true,
      count: participants.length,
      drawnAt: new Date().toISOString(),
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
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    await prisma.$transaction([
      prisma.participant.updateMany({
        data: {
          assignedToId: null,
          hasRevealed: false,
          revealedAt: null,
        },
      }),
      prisma.setting.upsert({
        where: { key: "is_drawn" },
        update: { value: "false" },
        create: { key: "is_drawn", value: "false" },
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
