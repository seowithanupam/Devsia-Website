import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import styles from "./Badge.module.css";

/**
 * navy: "Best value"; tint: article category; ok: "RERA"; red: "Price revised";
 * gold: "Pre-launch"; outline: "Zero brokerage".
 */
export type BadgeTone = "navy" | "tint" | "ok" | "red" | "gold" | "outline";

export type BadgeProps = ComponentPropsWithoutRef<"span"> & { tone?: BadgeTone };

export function Badge({ tone = "tint", className, ...rest }: BadgeProps) {
  return <span {...rest} className={cn(styles.badge, styles[tone], className)} />;
}
