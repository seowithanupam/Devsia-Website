import { notFound } from "next/navigation";
import { savePageSeoAction } from "@/app/admin/actions/seo";
import { AdminForm } from "@/components/admin/AdminForm";
import { PageHead } from "@/components/admin/AdminUi";
import { SeoFieldset } from "@/components/admin/SeoFieldset";
import { loadMediaOptions } from "@/lib/admin/media-options";
import { requireCapability } from "@/lib/auth/session";
import { PAGE_DEFS, isPageSlug } from "@/lib/cms/blocks";
import { getPage } from "@/lib/cms/repo/content";

export const metadata = { title: "Page SEO" };

export default async function PageSeoAdmin({ params }: { params: Promise<{ slug: string }> }) {
  await requireCapability("seo.manage");
  const { slug } = await params;
  if (!isPageSlug(slug)) notFound();
  const page = await getPage(slug);
  return (
    <>
      <PageHead title={`SEO: ${PAGE_DEFS[slug].title}`} intro={`Search and sharing settings for ${PAGE_DEFS[slug].path}.`} />
      <AdminForm action={savePageSeoAction} submitLabel="Save SEO">
        <input type="hidden" name="slug" value={slug} />
        <SeoFieldset defaults={page?.seo ?? {}} media={await loadMediaOptions()} />
      </AdminForm>
    </>
  );
}
