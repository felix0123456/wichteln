import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_COMMUNITY_ID = "default-community";

async function main() {
  console.log("Checking Wichteln database state...");

  // Always ensure the default community exists so existing rows have a valid parent
  await prisma.community.upsert({
    where: { id: DEFAULT_COMMUNITY_ID },
    update: {},
    create: {
      id: DEFAULT_COMMUNITY_ID,
      slug: "default",
      name: "Familien-Wichteln",
      isDefault: true,
    },
  });

  // Check if subgroups already exist in the persistent volume
  const existingCount = await prisma.subgroup.count();
  if (existingCount > 0) {
    console.log("Database already initialized in persistent storage. Skipping seed to preserve current state.");
    return;
  }

  console.log("Initializing persistent storage with current live Wichteln 2026 setup & Auslosung...");

  // 1. Settings
  const initialSettings = [
    { key: "budget", value: "ca. 10 €" },
    { key: "event_date", value: "25. Dezember 2026" },
    { key: "notes", value: "Auflösung am 25.12. bei den Resch" },
    { key: "is_drawn", value: "true" },
    { key: "drawn_at", value: "2026-11-01T15:11:19.225Z" },
  ];

  for (const s of initialSettings) {
    await prisma.setting.upsert({
      where: {
        communityId_key: {
          communityId: DEFAULT_COMMUNITY_ID,
          key: s.key,
        },
      },
      update: {},
      create: {
        communityId: DEFAULT_COMMUNITY_ID,
        key: s.key,
        value: s.value,
      },
    });
  }

  // 2. Subgroups (preserving exact IDs)
  const subgroups = [
    {
      id: "cmvxynysf00034oyyrzjlza6d",
      name: "Aschberger",
      color: "#10b981",
      createdAt: new Date("2026-11-01T15:04:31.455Z"),
      updatedAt: new Date("2026-11-01T15:04:31.455Z"),
    },
    {
      id: "cmvxynlip00024oyygwxdbyue",
      name: "Caeser",
      color: "#10b981",
      createdAt: new Date("2026-11-01T15:04:14.257Z"),
      updatedAt: new Date("2026-11-01T15:04:14.257Z"),
    },
    {
      id: "cmvxyo7n400064oyy571kdnnj",
      name: "Oma",
      color: "#10b981",
      createdAt: new Date("2026-11-01T15:04:42.929Z"),
      updatedAt: new Date("2026-11-01T15:04:42.929Z"),
    },
    {
      id: "cmvxyo4wx00054oyyyvujn89j",
      name: "Phillips",
      color: "#10b981",
      createdAt: new Date("2026-11-01T15:04:39.393Z"),
      updatedAt: new Date("2026-11-01T15:04:39.393Z"),
    },
    {
      id: "cmvxyn9vb00014oyyqzgruftp",
      name: "Resch",
      color: "#10b981",
      createdAt: new Date("2026-11-01T15:03:59.159Z"),
      updatedAt: new Date("2026-11-01T15:03:59.159Z"),
    },
  ];

  for (const sg of subgroups) {
    await prisma.subgroup.create({ data: sg });
  }

  // 3. Participants (preserving exact IDs, PINs, reveal state, and assignments)
  const participants = [
    {
      id: "cmvxyvtxc000w4oyywwzjclo7",
      name: "Miriam",
      pin: "8941",
      subgroupId: "cmvxynysf00034oyyrzjlza6d",
      assignedToId: "cmvxysf2m000g4oyyusl7bsze",
      hasRevealed: true,
      revealedAt: new Date("2026-11-01T15:20:39.141Z"),
      createdAt: new Date("2026-11-01T15:10:38.401Z"),
      updatedAt: new Date("2026-11-01T15:20:39.141Z"),
    },
    {
      id: "cmvxyvw1t000y4oyyka16ro6u",
      name: "Moritz",
      pin: "4081",
      subgroupId: "cmvxynysf00034oyyrzjlza6d",
      assignedToId: "cmvxyokl800084oyygksprmhx",
      hasRevealed: true,
      revealedAt: new Date("2026-11-01T15:18:34.148Z"),
      createdAt: new Date("2026-11-01T15:10:41.153Z"),
      updatedAt: new Date("2026-11-01T15:18:34.149Z"),
    },
    {
      id: "cmvxyw0yu00104oyyu1qzc5io",
      name: "Stefan",
      pin: "2103",
      subgroupId: "cmvxynysf00034oyyrzjlza6d",
      assignedToId: "cmvxywaty00144oyyis0zlt2k",
      hasRevealed: true,
      revealedAt: new Date("2026-11-01T15:16:15.365Z"),
      createdAt: new Date("2026-11-01T15:10:47.526Z"),
      updatedAt: new Date("2026-11-01T15:16:15.366Z"),
    },
    {
      id: "cmvxywi6x001a4oyyy0lchn28",
      name: "Andi",
      pin: "6042",
      subgroupId: "cmvxynlip00024oyygwxdbyue",
      assignedToId: "cmvxyvlvg000s4oyyyhcxw4ca",
      hasRevealed: true,
      revealedAt: new Date("2026-11-07T20:03:17.371Z"),
      createdAt: new Date("2026-11-01T15:11:09.849Z"),
      updatedAt: new Date("2026-11-07T20:03:17.371Z"),
    },
    {
      id: "cmvxyw9gt00124oyyryl57lk0",
      name: "Jakob",
      pin: "8840",
      subgroupId: "cmvxynlip00024oyygwxdbyue",
      assignedToId: "cmvxyvo2d000u4oyyty4frq3t",
      hasRevealed: false,
      revealedAt: null,
      createdAt: new Date("2026-11-01T15:10:58.541Z"),
      updatedAt: new Date("2026-11-01T15:11:19.222Z"),
    },
    {
      id: "cmvxywgp100184oyytl3tr7yb",
      name: "Martin",
      pin: "2594",
      subgroupId: "cmvxynlip00024oyygwxdbyue",
      assignedToId: "cmvxysa3d000c4oyyp6d7bnf2",
      hasRevealed: true,
      revealedAt: new Date("2026-11-01T15:17:06.216Z"),
      createdAt: new Date("2026-11-01T15:11:07.909Z"),
      updatedAt: new Date("2026-11-01T15:17:06.216Z"),
    },
    {
      id: "cmvxywaty00144oyyis0zlt2k",
      name: "Michi",
      pin: "8073",
      subgroupId: "cmvxynlip00024oyygwxdbyue",
      assignedToId: "cmvxyvtxc000w4oyywwzjclo7",
      hasRevealed: true,
      revealedAt: new Date("2026-11-01T19:45:03.252Z"),
      createdAt: new Date("2026-11-01T15:11:00.310Z"),
      updatedAt: new Date("2026-11-01T19:45:03.253Z"),
    },
    {
      id: "cmvxywc2100164oyyrb0u07og",
      name: "Susi",
      pin: "8557",
      subgroupId: "cmvxynlip00024oyygwxdbyue",
      assignedToId: "cmvxysdot000e4oyywue6ianr",
      hasRevealed: true,
      revealedAt: new Date("2026-11-01T15:14:15.768Z"),
      createdAt: new Date("2026-11-01T15:11:01.897Z"),
      updatedAt: new Date("2026-11-01T15:14:15.769Z"),
    },
    {
      id: "cmvxyokl800084oyygksprmhx",
      name: "Oma",
      pin: "8313",
      subgroupId: "cmvxyo7n400064oyy571kdnnj",
      assignedToId: "cmvxyv70r000k4oyyof9a1fyj",
      hasRevealed: true,
      revealedAt: new Date("2026-11-01T15:19:29.330Z"),
      createdAt: new Date("2026-11-01T15:04:59.708Z"),
      updatedAt: new Date("2026-11-01T15:19:29.331Z"),
    },
    {
      id: "cmvxyvo2d000u4oyyty4frq3t",
      name: "Emiliuan",
      pin: "3871",
      subgroupId: "cmvxyo4wx00054oyyyvujn89j",
      assignedToId: "cmvxywgp100184oyytl3tr7yb",
      hasRevealed: false,
      revealedAt: null,
      createdAt: new Date("2026-11-01T15:10:30.805Z"),
      updatedAt: new Date("2026-11-01T15:11:19.217Z"),
    },
    {
      id: "cmvxyvkwt000q4oyyc8wvgm2z",
      name: "Phillip Jonathan",
      pin: "3725",
      subgroupId: "cmvxyo4wx00054oyyyvujn89j",
      assignedToId: "cmvxyw9gt00124oyyryl57lk0",
      hasRevealed: false,
      revealedAt: null,
      createdAt: new Date("2026-11-01T15:10:26.718Z"),
      updatedAt: new Date("2026-11-01T15:11:19.214Z"),
    },
    {
      id: "cmvxyvgz2000o4oyy501uik8p",
      name: "Phillip groß",
      pin: "6532",
      subgroupId: "cmvxyo4wx00054oyyyvujn89j",
      assignedToId: "cmvxyv9o5000m4oyykg3hg0ut",
      hasRevealed: true,
      revealedAt: new Date("2026-11-01T15:31:19.163Z"),
      createdAt: new Date("2026-11-01T15:10:21.614Z"),
      updatedAt: new Date("2026-11-01T15:31:19.163Z"),
    },
    {
      id: "cmvxyvlvg000s4oyyyhcxw4ca",
      name: "Vali",
      pin: "6807",
      subgroupId: "cmvxyo4wx00054oyyyvujn89j",
      assignedToId: "cmvxysgi9000i4oyy3tp9ep9l",
      hasRevealed: true,
      revealedAt: new Date("2026-11-01T18:08:49.778Z"),
      createdAt: new Date("2026-11-01T15:10:27.964Z"),
      updatedAt: new Date("2026-11-01T18:08:49.779Z"),
    },
    {
      id: "cmvxysdot000e4oyywue6ianr",
      name: "Elisabeth",
      pin: "2982",
      subgroupId: "cmvxyn9vb00014oyyqzgruftp",
      assignedToId: "cmvxyvgz2000o4oyy501uik8p",
      hasRevealed: true,
      revealedAt: new Date("2026-11-01T15:23:31.874Z"),
      createdAt: new Date("2026-11-01T15:07:57.389Z"),
      updatedAt: new Date("2026-11-01T15:23:31.874Z"),
    },
    {
      id: "cmvxysf2m000g4oyyusl7bsze",
      name: "Felix",
      pin: "5311",
      subgroupId: "cmvxyn9vb00014oyyqzgruftp",
      assignedToId: "cmvxyvkwt000q4oyyc8wvgm2z",
      hasRevealed: true,
      revealedAt: new Date("2026-11-01T15:27:18.697Z"),
      createdAt: new Date("2026-11-01T15:07:59.182Z"),
      updatedAt: new Date("2026-11-01T15:27:18.698Z"),
    },
    {
      id: "cmvxyv70r000k4oyyof9a1fyj",
      name: "Franzi",
      pin: "8438",
      subgroupId: "cmvxyn9vb00014oyyqzgruftp",
      assignedToId: "cmvxyw0yu00104oyyu1qzc5io",
      hasRevealed: true,
      revealedAt: new Date("2026-11-01T15:17:40.486Z"),
      createdAt: new Date("2026-11-01T15:10:08.715Z"),
      updatedAt: new Date("2026-11-01T15:17:40.487Z"),
    },
    {
      id: "cmvxysgi9000i4oyy3tp9ep9l",
      name: "Jojo",
      pin: "5611",
      subgroupId: "cmvxyn9vb00014oyyqzgruftp",
      assignedToId: "cmvxywi6x001a4oyyy0lchn28",
      hasRevealed: true,
      revealedAt: new Date("2026-11-01T15:53:23.713Z"),
      createdAt: new Date("2026-11-01T15:08:01.041Z"),
      updatedAt: new Date("2026-11-01T15:53:23.713Z"),
    },
    {
      id: "cmvxysa3d000c4oyyp6d7bnf2",
      name: "Reinhard",
      pin: "3445",
      subgroupId: "cmvxyn9vb00014oyyqzgruftp",
      assignedToId: "cmvxyvw1t000y4oyyka16ro6u",
      hasRevealed: true,
      revealedAt: new Date("2026-11-01T15:17:50.456Z"),
      createdAt: new Date("2026-11-01T15:07:52.729Z"),
      updatedAt: new Date("2026-11-01T15:17:50.457Z"),
    },
    {
      id: "cmvxyv9o5000m4oyykg3hg0ut",
      name: "Sophie",
      pin: "4304",
      subgroupId: "cmvxyn9vb00014oyyqzgruftp",
      assignedToId: "cmvxywc2100164oyyrb0u07og",
      hasRevealed: true,
      revealedAt: new Date("2026-11-01T15:17:35.035Z"),
      createdAt: new Date("2026-11-01T15:10:12.150Z"),
      updatedAt: new Date("2026-11-01T15:17:35.036Z"),
    },
  ];

  // First pass: insert all participants without assignedToId to satisfy FK constraints
  for (const p of participants) {
    await prisma.participant.create({
      data: {
        id: p.id,
        name: p.name,
        pin: p.pin,
        subgroupId: p.subgroupId,
        hasRevealed: p.hasRevealed,
        revealedAt: p.revealedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      },
    });
  }

  // Second pass: wire up Wichtel assignments
  for (const p of participants) {
    if (p.assignedToId) {
      await prisma.participant.update({
        where: { id: p.id },
        data: { assignedToId: p.assignedToId },
      });
    }
  }

  console.log(`Restored ${participants.length} participants across ${subgroups.length} subgroups into persistent storage.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
