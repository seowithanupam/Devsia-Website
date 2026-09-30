"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { PropertyImage } from "@/lib/services/types";
import styles from "./property.module.css";

/** Main photo with a photo count and thumbnails. Arrow keys are not needed: thumbnails are buttons. */
export function PropertyGallery({ images, title }: { images: PropertyImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];
  if (!current) return null;
  return (
    <div className={styles.gallery}>
      <div className={styles.galleryMain}>
        <Image src={current.src} alt={current.alt} fill sizes="(max-width: 1199px) 100vw, 780px" priority unoptimized className={styles.cover} />
        <span className={styles.photoCount}>
          {index + 1} / {images.length} photos
        </span>
      </div>
      {images.length > 1 ? (
        <ul className={styles.thumbs} aria-label={`Photos of ${title}`}>
          {images.map((image, i) => (
            <li key={`${image.src}-${i}`}>
              <button
                type="button"
                className={cn(styles.thumb, i === index && styles.thumbActive)}
                aria-label={`Show photo ${i + 1} of ${images.length}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
              >
                <Image src={image.src} alt="" fill sizes="120px" unoptimized className={styles.cover} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
