"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { MenuIcon, CloseIcon } from "@/components/ui";
import { activeNavHref, visibleNav } from "@/lib/admin/nav";
import type { Role } from "@/lib/auth/capabilities";
import { cn } from "@/lib/cn";
import styles from "./admin.module.css";

/** Sidebar navigation showing only the screens the signed-in role may use. Collapses behind a button on phones. */
export function AdminNav({ role, children }: { role: Role; children: ReactNode }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname; // closes by itself when the page changes
  const active = activeNavHref(pathname);
  const items = visibleNav(role);

  return (
    <>
      <div className={styles.topbar}>
        <span className={styles.brand}>
          DevSia <span className={styles.brandTag}>Admin</span>
        </span>
        <button type="button" className={styles.iconBtn} aria-expanded={open} aria-controls="admin-sidebar" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpenPath(open ? null : pathname)}>
          {open ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
        </button>
      </div>
      <aside id="admin-sidebar" className={cn(styles.sidebar, open && styles.sidebarOpen)} aria-label="Admin">
        <span className={cn(styles.brand, "hide-mobile")}>
          DevSia <span className={styles.brandTag}>Admin</span>
        </span>
        <nav aria-label="Admin sections">
          <ul className={styles.navList}>
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={cn(styles.navLink, active === item.href && styles.navActive)} aria-current={active === item.href ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {children}
      </aside>
    </>
  );
}
