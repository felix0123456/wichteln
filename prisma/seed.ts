import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Wichteln database...");

  // Event Settings
  await prisma.setting.upsert({
    where: { key: "budget" },
    update: {},
    create: { key: "budget", value: "ca. 20-30 €" },
  });

  await prisma.setting.upsert({
    where: { key: "event_date" },
    update: {},
    create: { key: "event_date", value: "24. Dezember 2026" },
  });

  await prisma.setting.upsert({
    where: { key: "notes" },
    update: {},
    create: {
      key: "notes",
      value:
        "Frohe Weihnachten! Bitte halte dein Wichtelkind bis zur Bescherung streng geheim. Bei Fragen wende dich an Felix!",
    },
  });

  // Check if subgroups already exist
  const existingCount = await prisma.subgroup.count();
  if (existingCount > 0) {
    console.log("Database already seeded. Skipping initial data.");
    return;
  }

  // Create Subgroups
  const group1 = await prisma.subgroup.create({
    data: { name: "Familie Resch", color: "#fbbf24" },
  });
  const group2 = await prisma.subgroup.create({
    data: { name: "Familie Müller", color: "#e11d48" },
  });
  const group3 = await prisma.subgroup.create({
    data: { name: "Familie Schmidt", color: "#3b82f6" },
  });
  const group4 = await prisma.subgroup.create({
    data: { name: "Großeltern", color: "#10b981" },
  });

  // Create Sample Participants
  const participants = [
    { name: "Felix Resch", subgroupId: group1.id, pin: "1234" },
    { name: "Lena Resch", subgroupId: group1.id, pin: "2345" },
    { name: "Jonas Resch", subgroupId: group1.id, pin: "3456" },

    { name: "Anna Müller", subgroupId: group2.id, pin: "4567" },
    { name: "Markus Müller", subgroupId: group2.id, pin: "5678" },
    { name: "Sophie Müller", subgroupId: group2.id, pin: "6789" },

    { name: "Claudia Schmidt", subgroupId: group3.id, pin: "7890" },
    { name: "Michael Schmidt", subgroupId: group3.id, pin: "8901" },
    { name: "David Schmidt", subgroupId: group3.id, pin: "9012" },

    { name: "Oma Maria", subgroupId: group4.id, pin: "1122" },
    { name: "Opa Josef", subgroupId: group4.id, pin: "3344" },
  ];

  for (const p of participants) {
    await prisma.participant.create({ data: p });
  }

  console.log(`Seeded ${participants.length} participants across 4 subgroups.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
