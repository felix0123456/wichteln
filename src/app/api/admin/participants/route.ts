import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth";

function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const participants = await prisma.participant.findMany({
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
      orderBy: [
        { subgroup: { name: "asc" } },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ participants });
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Laden der Teilnehmer" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();

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

    const assignedPin = pin?.toString().trim() || generatePin();

    const participant = await prisma.participant.create({
      data: {
        name: name.trim(),
        subgroupId,
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
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const { id, name, subgroupId, pin } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID fehlt" }, { status: 400 });
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
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID fehlt" }, { status: 400 });
    }

    await prisma.participant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Fehler beim Löschen des Teilnehmers." },
      { status: 500 }
    );
  }
}
