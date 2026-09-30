import { Card, Notice, PageHead } from "@/components/admin/AdminUi";
import { MediaCard, UploadForm } from "@/components/admin/MediaAdmin";
import styles from "@/components/admin/admin.module.css";
import { requireCapability } from "@/lib/auth/session";
import { listMedia } from "@/lib/cms/repo/media";
import { isBlobConfigured } from "@/lib/env";

export const metadata = { title: "Media" };

export default async function MediaAdmin() {
  await requireCapability("media.manage");
  const media = await listMedia();
  const blob = isBlobConfigured();
  return (
    <>
      <PageHead title="Media" intro="Images used in pages and articles. Uploaded images are stored on Vercel Blob; only their web addresses are kept here." />
      {blob ? null : <Notice tone="warn">Uploads are switched off because BLOB_READ_WRITE_TOKEN is not set on the server. Nothing is uploaded until it is.</Notice>}
      {blob ? (
        <Card title="Upload an image">
          <UploadForm />
        </Card>
      ) : null}
      <Card title={`Library (${media.length})`}>
        {media.length === 0 ? (
          <p className={styles.muted}>No images uploaded yet.</p>
        ) : (
          <ul className={styles.thumbGrid}>
            {media.map((m) => (
              <MediaCard key={m.id} media={m} />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
