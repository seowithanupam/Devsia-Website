"use client";

import Image from "next/image";
import { createContext, useContext } from "react";
import styles from "./admin.module.css";

export type MediaOption = { url: string; alt: string; filename: string };

export const MediaOptionsContext = createContext<MediaOption[]>([]);

/** Small thumbnail grid: click one to fill an image address field. Images come from the Media library. */
export function MediaPicker({ onPick, options }: { onPick: (url: string, alt: string) => void; options?: MediaOption[] }) {
  const fromContext = useContext(MediaOptionsContext);
  const media = options ?? fromContext;
  if (media.length === 0) return <p className={styles.hintLine}>No uploaded images yet. Upload some in the Media section, or type a site path such as /images/home/hero.jpg.</p>;
  return (
    <details>
      <summary className={styles.hintLine} style={{ cursor: "pointer" }}>
        Choose from the Media library ({media.length})
      </summary>
      <div className={styles.pickerGrid} style={{ marginTop: 8 }}>
        {media.map((m) => (
          <button key={m.url} type="button" className={styles.pickerBtn} title={m.filename} onClick={() => onPick(m.url, m.alt)}>
            <Image src={m.url} alt={m.alt || m.filename} width={88} height={88} unoptimized />
          </button>
        ))}
      </div>
    </details>
  );
}
