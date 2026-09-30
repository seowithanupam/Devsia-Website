import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Label, type LabelTone } from "./Label";
import styles from "./SectionHeading.module.css";

export type SectionHeadingProps = {
  /** Small label above the title, e.g. "Highlights". */
  label?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Color of the label. The original uses red on light sections and a pale blue on navy. */
  labelTone?: LabelTone;
  /** Heading level. Defaults to h2. */
  as?: "h1" | "h2" | "h3";
  className?: string;
};

/** Label, h2 and optional description, as used above each Home page section. */
export function SectionHeading({
  label,
  title,
  description,
  labelTone = "red",
  as: Tag = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn(styles.heading, className)}>
      {label ? (
        <Label tone={labelTone} className={styles.label}>
          {label}
        </Label>
      ) : null}
      <Tag className="t-h2">{title}</Tag>
      {description ? <p className={cn("t-body", styles.description)}>{description}</p> : null}
    </div>
  );
}
