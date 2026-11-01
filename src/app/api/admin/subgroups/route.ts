import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const subgroups = await prisma.subgroup.findMany({
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
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const { name, color } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
    }

    const subgroup = await prisma.subgroup.create({
      data: {
        name: name.trim(),
        color: color?.trim() || null,
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
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID fehlt" }, { status: 400 });
    }

    await prisma.subgroup.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Löschen der Gruppe" }, { status: 500 });
  }
}
