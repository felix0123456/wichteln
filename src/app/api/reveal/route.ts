import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reveal - Public participant list for the name picker (ID, Name, Subgroup Name)
export async function GET() {
  try {
    const participants = await prisma.participant.findMany({
      select: {
        id: true,
        name: true,
        subgroup: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: [
        { subgroup: { name: "asc" } },
        { name: "asc" },
      ],
    });

    const isDrawnSetting = await prisma.setting.findUnique({
      where: { key: "is_drawn" },
    });

    return NextResponse.json({
      participants,
      isDrawn: isDrawnSetting?.value === "true",
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Teilnehmer konnten nicht geladen werden." },
      { status: 500 }
    );
  }
}

// POST /api/reveal - Verify PIN and reveal assigned Wichtel recipient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, pin } = body;

    if (!participantId || !pin) {
      return NextResponse.json(
        { error: "Bitte wähle deinen Namen und gib deine PIN ein." },
        { status: 400 }
      );
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        subgroup: true,
        assignedTo: {
          include: {
            subgroup: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Teilnehmer nicht gefunden." },
        { status: 404 }
      );
    }

    // Verify PIN (trimming whitespace)
    if (participant.pin.trim() !== pin.toString().trim()) {
      return NextResponse.json(
        { error: "Falsche PIN. Bitte überprüfe deine 4-stellige PIN!" },
        { status: 401 }
      );
    }

    // Check if draw has occurred
    const isDrawnSetting = await prisma.setting.findUnique({
      where: { key: "is_drawn" },
    });

    if (isDrawnSetting?.value !== "true" || !participant.assignedTo) {
      return NextResponse.json(
        {
          error:
            "Die Wichtel-Auslosung hat noch nicht stattgefunden. Bitte versuche es später noch einmal!",
        },
        { status: 400 }
      );
    }

    // Update hasRevealed timestamp
    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        hasRevealed: true,
        revealedAt: new Date(),
      },
    });

    // Fetch event metadata settings
    const settings = await prisma.setting.findMany();
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    return NextResponse.json({
      success: true,
      giverName: participant.name,
      receiver: {
        name: participant.assignedTo.name,
        subgroup: participant.assignedTo.subgroup.name,
        subgroupColor: participant.assignedTo.subgroup.color,
      },
      eventDetails: {
        budget: settingsMap.get("budget") || "ca. 20-30 €",
        eventDate: settingsMap.get("event_date") || "24. Dezember 2026",
        notes:
          settingsMap.get("notes") ||
          "Frohe Weihnachten! Bitte halte dein Wichtelkind bis zur Bescherung streng geheim!",
      },
    });
  } catch (error) {
    console.error("Reveal error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
