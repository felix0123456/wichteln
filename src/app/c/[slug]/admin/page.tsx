import AdminDashboard from "@/components/AdminDashboard";

export default async function CommunityAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AdminDashboard communitySlug={slug} />;
}
