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
    const settings = await prisma.setting.findMany({
      where: { communityId: community.id },
    });
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
    const { budget, event_date, notes } = body;

    const updates = [];
    if (budget !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { communityId_key: { communityId: community.id, key: "budget" } },
          update: { value: budget.toString() },
          create: { communityId: community.id, key: "budget", value: budget.toString() },
        })
      );
    }
    if (event_date !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { communityId_key: { communityId: community.id, key: "event_date" } },
          update: { value: event_date.toString() },
          create: { communityId: community.id, key: "event_date", value: event_date.toString() },
        })
      );
    }
    if (notes !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { communityId_key: { communityId: community.id, key: "notes" } },
          update: { value: notes.toString() },
          create: { communityId: community.id, key: "notes", value: notes.toString() },
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
