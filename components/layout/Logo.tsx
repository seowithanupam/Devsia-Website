import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import styles from "./Logo.module.css";

/** Pixel size of the supplied logo file. It is square with a wide white margin around the wordmark. */
export const LOGO_FILE = { src: "/images/brand/devsia-logo.jpeg", width: 1254, height: 1254 } as const;

/**
 * The official DevSia logo, using the supplied image file unchanged (no recolouring, no redrawing).
 *
 * The file is a 1254 x 1254 square whose wordmark fills only the middle band, so shown whole it would be
 * tiny. The image is therefore placed in a frame that shows just the wordmark and its margin; the image
 * pixels are not altered, stretched or recoloured, and the aspect ratio is kept exactly.
 *
 * `inverse` is for the dark footer: the wordmark is navy, so it would vanish on the navy footer. The same
 * file is shown on a white rounded plate instead of being recoloured.
 */
export function Logo({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn(styles.logo, inverse && styles.plate, className)} aria-label="DevSia home">
      <span className={styles.frame}>
        <Image
          src={LOGO_FILE.src}
          alt=""
          width={LOGO_FILE.width}
          height={LOGO_FILE.height}
          className={styles.image}
          // The original file is served as is. It is only about 50 KB.
          unoptimized
          priority={!inverse}
        />
      </span>
    </Link>
  );
}
