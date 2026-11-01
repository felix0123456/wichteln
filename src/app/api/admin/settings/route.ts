import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      settings: {
        budget: settingsMap["budget"] || "ca. 20-30 €",
        event_date: settingsMap["event_date"] || "24. Dezember 2026",
        notes:
          settingsMap["notes"] ||
          "Frohe Weihnachten! Bitte halte dein Wichtelkind bis zur Bescherung geheim!",
        is_drawn: settingsMap["is_drawn"] === "true",
        drawn_at: settingsMap["drawn_at"] || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Fehler beim Laden der Einstellungen" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const { budget, event_date, notes } = await request.json();

    const updates = [];
    if (budget !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: "budget" },
          update: { value: budget.toString() },
          create: { key: "budget", value: budget.toString() },
        })
      );
    }
    if (event_date !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: "event_date" },
          update: { value: event_date.toString() },
          create: { key: "event_date", value: event_date.toString() },
        })
      );
    }
    if (notes !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: "notes" },
          update: { value: notes.toString() },
          create: { key: "notes", value: notes.toString() },
        })
      );
    }

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Fehler beim Speichern der Einstellungen" },
      { status: 500 }
    );
  }
}
