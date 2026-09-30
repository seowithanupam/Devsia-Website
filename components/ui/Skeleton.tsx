import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import styles from "./Skeleton.module.css";

export type SkeletonProps = {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  radius?: CSSProperties["borderRadius"];
  className?: string;
};

/** Decorative loading block. Hidden from assistive technology. */
export function Skeleton({ width = "100%", height = 16, radius, className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(styles.skeleton, className)}
      style={{ width, height, borderRadius: radius }}
    />
  );
}
