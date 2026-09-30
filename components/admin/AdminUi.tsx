import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./admin.module.css";

export function PageHead({ title, intro, actions }: { title: string; intro?: ReactNode; actions?: ReactNode }) {
  return (
    <div className={styles.pageHead}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {intro ? <p className={styles.pageIntro}>{intro}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}

export function Card({ title, help, children }: { title?: string; help?: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.card}>
      {title ? <h2 className={styles.cardTitle}>{title}</h2> : null}
      {help ? <p className={styles.cardHelp}>{help}</p> : null}
      {children}
    </section>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error" | "ok"; children: ReactNode }) {
  const toneClass = tone === "warn" ? styles.noticeWarn : tone === "error" ? styles.noticeError : tone === "ok" ? styles.noticeOk : "";
  return (
    <p className={cn(styles.notice, toneClass)} role={tone === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}

export function Pager({ basePath, params, page, totalPages, total, noun }: { basePath: string; params: Record<string, string>; page: number; totalPages: number; total: number; noun: string }) {
  const href = (p: number) => {
    const q = new URLSearchParams({ ...params, ...(p > 1 ? { page: String(p) } : {}) });
    for (const [k, v] of [...q.entries()]) if (!v) q.delete(k);
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <div className={styles.pager}>
      <span>
        {total} {noun}
        {total === 1 ? "" : "s"} · page {page} of {totalPages}
      </span>
      <span className={styles.actions}>
        {page > 1 ? <Link href={href(page - 1)}>← Previous</Link> : null}
        {page < totalPages ? <Link href={href(page + 1)}>Next →</Link> : null}
      </span>
    </div>
  );
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)} UTC`;
}
