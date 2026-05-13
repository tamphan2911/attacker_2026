import { AdminShell } from "@/components/admin-page";
import { AdminSponsorEditor } from "@/components/admin-sponsors-manager";
import { sponsorProfiles } from "@/data/site-content";

export function generateStaticParams() {
  return sponsorProfiles.map((_, index) => ({ sponsorIndex: String(index) }));
}

export default async function AdminSponsorEditorRoute({
  params,
}: {
  params: Promise<{ sponsorIndex: string }>;
}) {
  const { sponsorIndex } = await params;
  const parsedIndex = Number.parseInt(sponsorIndex, 10);

  return (
    <AdminShell section="content">
      <AdminSponsorEditor
        key={sponsorIndex}
        sponsorIndex={Number.isFinite(parsedIndex) ? parsedIndex : -1}
      />
    </AdminShell>
  );
}
