import { notFound } from "next/navigation";
import { deletePropertySeoAction, savePropertySeoAction } from "@/app/admin/actions/seo";
import { AdminForm } from "@/components/admin/AdminForm";
import { Card, PageHead } from "@/components/admin/AdminUi";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { SeoFieldset } from "@/components/admin/SeoFieldset";
import styles from "@/components/admin/admin.module.css";
import { loadMediaOptions } from "@/lib/admin/media-options";
import { requireCapability } from "@/lib/auth/session";
import { getPropertySeo } from "@/lib/cms/public";
import { getPropertySeoOverride } from "@/lib/cms/repo/content";
import { isValidSlug } from "@/lib/cms/validate";
import { getPropertyProvider } from "@/lib/services";

export const metadata = { title: "Listing SEO" };

export default async function PropertySeoAdmin({ params }: { params: Promise<{ slug: string }> }) {
  await requireCapability("seo.manage");
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();
  const property = await getPropertyProvider().getProperty(slug);
  if (!property) notFound();
  const [override, effective, media] = await Promise.all([getPropertySeoOverride(slug), getPropertySeo(property), loadMediaOptions()]);
  return (
    <>
      <PageHead title={`SEO: ${property.title}`} intro={`Override for the listing at /properties/${slug}. Blank fields fall back to the property template.`} />
      <Card title="What visitors and search engines get now">
        <p className={styles.small}>
          <strong>Title:</strong> {effective.title}
        </p>
        <p className={styles.small}>
          <strong>Description:</strong> {effective.description}
        </p>
      </Card>
      <AdminForm action={savePropertySeoAction} submitLabel="Save override">
        <input type="hidden" name="slug" value={slug} />
        <SeoFieldset defaults={override?.seo ?? {}} media={media} />
      </AdminForm>
      {override ? (
        <Card title="Remove the override">
          <AdminForm action={deletePropertySeoAction} hideSubmit>
            <input type="hidden" name="slug" value={slug} />
            <div>
              <ConfirmSubmit variant="outline" message="Remove this override? The listing will use the property template again.">
                Remove override
              </ConfirmSubmit>
            </div>
          </AdminForm>
        </Card>
      ) : null}
    </>
  );
}
