import Link from "next/link";
import styles from "./pages.module.css";

/** Switch between the two form pages. INFERRED: the video shows the pages separately; this small switcher is added for orientation. */
export function FormsTabs({ active }: { active: "enquire" | "associates" }) {
  return (
    <nav aria-label="Forms" className={styles.formTabs}>
      <Link href="/enquire" className={`${styles.formTab} ${active === "enquire" ? styles.formTabActive : ""}`} aria-current={active === "enquire" ? "page" : undefined}>
        Post your enquiry
      </Link>
      <Link href="/associates" className={`${styles.formTab} ${active === "associates" ? styles.formTabActive : ""}`} aria-current={active === "associates" ? "page" : undefined}>
        Become an associate
      </Link>
    </nav>
  );
}
