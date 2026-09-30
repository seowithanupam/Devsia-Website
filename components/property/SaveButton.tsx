"use client";

import { HeartIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useWishlist } from "@/store/hooks";
import styles from "./property.module.css";

/** Heart button that adds or removes a listing from the wishlist (Redux + localStorage). */
export function SaveButton({ slug, title, className }: { slug: string; title: string; className?: string }) {
  const { has, toggle, hydrated } = useWishlist();
  // Until localStorage has been read, render as not saved so server and client markup match.
  const saved = hydrated && has(slug);
  return (
    <button
      type="button"
      className={cn(styles.save, saved && styles.saved, className)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
      onClick={() => toggle(slug)}
    >
      <HeartIcon size={16} filled={saved} />
    </button>
  );
}
