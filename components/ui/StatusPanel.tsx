import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CheckIcon, SearchIcon } from "./Icons";
import styles from "./StatusPanel.module.css";

export type StatusTone = "success" | "error" | "empty";

/**
 * A centred panel for form success, empty results and errors.
 * The success layout matches the "Enquiry sent" / "Application submitted" panels in the video;
 * the empty and error looks are the same layout with other tones.
 */
export function StatusPanel({
  tone,
  title,
  children,
  actions,
  className,
}: {
  tone: StatusTone;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(styles.panel, className)} role={tone === "error" ? "alert" : "status"}>
      <span className={cn(styles.icon, tone === "error" && styles.iconError, tone === "empty" && styles.iconNeutral)}>
        {tone === "empty" ? <SearchIcon size={20} /> : <CheckIcon size={20} />}
      </span>
      <h2 className={styles.title}>{title}</h2>
      {children ? <p className={styles.text}>{children}</p> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}

/** A short inline error shown above a form's submit button. */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <p className={styles.alert} role="alert">
      {children}
    </p>
  );
}
