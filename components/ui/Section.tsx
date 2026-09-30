import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import styles from "./Section.module.css";

export type SectionTone = "default" | "tint" | "navy" | "red";
export type SectionSpacing = "default" | "snug" | "tight";

export type SectionProps = ComponentPropsWithoutRef<"section"> & {
  tone?: SectionTone;
  /** default: 88px (64 tablet, 48 mobile). snug: 76px. tight: 44px. */
  spacing?: SectionSpacing;
};

/** A full-width page section. Put a Container inside it. */
export function Section({ tone = "default", spacing = "default", className, ...rest }: SectionProps) {
  return (
    <section
      {...rest}
      className={cn(
        styles.section,
        tone !== "default" && styles[tone],
        spacing !== "default" && styles[spacing],
        className,
      )}
    />
  );
}
