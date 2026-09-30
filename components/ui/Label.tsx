import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import styles from "./Label.module.css";

export type LabelTone = "faint" | "red" | "navy" | "onNavy";

export type LabelProps = ComponentPropsWithoutRef<"div"> & { tone?: LabelTone };

/** Small uppercase label (section eyebrow, card category, footer column heading). */
export function Label({ tone = "faint", className, ...rest }: LabelProps) {
  return <div {...rest} className={cn(styles.label, tone !== "faint" && styles[tone], className)} />;
}
