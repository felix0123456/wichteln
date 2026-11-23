import RevealPortal from "@/components/RevealPortal";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RevealPortal communitySlug={slug} />;
}
