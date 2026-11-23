import { prisma } from "@/lib/prisma";

export const DEFAULT_COMMUNITY_ID = "default-community";
export const DEFAULT_COMMUNITY_SLUG = "default";

const RESERVED_SLUGS = new Set([
  "default",
  "admin",
  "api",
  "invite",
  "c",
  "login",
  "logout",
  "register",
  "superadmin",
]);

export function slugifyCommunityName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length < 2 || slug.length > 48) return false;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return false;
  if (RESERVED_SLUGS.has(slug)) return false;
  return true;
}

export async function ensureDefaultCommunity() {
  return await prisma.community.upsert({
    where: { id: DEFAULT_COMMUNITY_ID },
    update: {},
    create: {
      id: DEFAULT_COMMUNITY_ID,
      slug: DEFAULT_COMMUNITY_SLUG,
      name: "Familien-Wichteln",
      isDefault: true,
    },
  });
}

export async function resolveCommunity(slugOrId?: string | null) {
  if (!slugOrId || slugOrId === DEFAULT_COMMUNITY_SLUG || slugOrId === DEFAULT_COMMUNITY_ID) {
    return await ensureDefaultCommunity();
  }

  return await prisma.community.findFirst({
    where: {
      OR: [{ slug: slugOrId }, { id: slugOrId }],
    },
  });
}
