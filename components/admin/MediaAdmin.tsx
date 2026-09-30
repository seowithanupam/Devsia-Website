"use client";

import Image from "next/image";
import { useState } from "react";
import { deleteMediaAction, updateMediaAction, uploadMediaAction } from "@/app/admin/actions/media";
import { AField, AdminForm } from "./AdminForm";
import { ConfirmSubmit } from "./ConfirmSubmit";
import styles from "./admin.module.css";
import { MAX_UPLOAD_BYTES } from "@/lib/cms/media";
import type { MediaRecord } from "@/lib/cms/types";

/** Upload form. The browser only picks the file; the server checks its real type and size before sending it to Vercel Blob. */
export function UploadForm() {
  // The server checks the size too; this only saves an oversized file from being sent at all.
  const [tooBig, setTooBig] = useState<string | null>(null);
  return (
    <div
      onSubmitCapture={(event) => {
        if (tooBig) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <AdminForm action={uploadMediaAction} submitLabel="Upload image">
        <div>
          <label htmlFor="media-file" style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Image file
          </label>
          <input
            id="media-file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
            required
            onChange={(event) => {
              const file = event.target.files?.[0];
              setTooBig(file && file.size > MAX_UPLOAD_BYTES ? `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB. Choose a smaller image.` : null);
            }}
          />
          <p className={styles.hintLine}>JPEG, PNG, GIF, WebP or AVIF, up to {MAX_UPLOAD_BYTES / 1024 / 1024} MB.</p>
          {tooBig ? (
            <p role="alert" className={`${styles.notice} ${styles.noticeError}`}>
              {tooBig}
            </p>
          ) : null}
        </div>
        <AField name="alt" label="Description (optional)" hint="Describe the image for people who cannot see it. It is offered again when you pick the image." maxLength={160} />
      </AdminForm>
    </div>
  );
}

export function MediaCard({ media }: { media: MediaRecord }) {
  return (
    <li className={styles.thumbCard}>
      <Image className={styles.thumbImg} src={media.url} alt={media.alt || media.filename} width={190} height={143} unoptimized />
      <div className={styles.small}>
        <strong style={{ overflowWrap: "anywhere" }}>{media.filename}</strong>
        <div className={styles.muted}>
          {Math.round(media.size / 1024)} KB · {media.uploadedBy}
        </div>
      </div>
      <input className={styles.copyInput} readOnly value={media.url} aria-label={`Address of ${media.filename}`} onFocus={(e) => e.currentTarget.select()} />
      <AdminForm action={updateMediaAction} submitLabel="Save description">
        <input type="hidden" name="id" value={media.id} />
        <AField name="alt" label="Description" defaultValue={media.alt} maxLength={160} />
      </AdminForm>
      <AdminForm action={deleteMediaAction} hideSubmit>
        <input type="hidden" name="id" value={media.id} />
        <ConfirmSubmit variant="outline" size="sm" message="Delete this image? Pages that still use it will show a broken image.">
          Delete
        </ConfirmSubmit>
      </AdminForm>
    </li>
  );
}
