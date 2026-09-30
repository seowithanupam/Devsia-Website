"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isActivePath } from "@/lib/nav";
import type { NavLink } from "@/lib/content/site";
import styles from "./NavLinks.module.css";

/**
 * Primary navigation links. The current section gets the red underline shown in the
 * video. `orientation` switches between the header row and the mobile menu column.
 */
export function NavLinks({
  links,
  orientation = "row",
  onNavigate,
}: {
  links: NavLink[];
  orientation?: "row" | "column";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <ul className={cn(styles.list, orientation === "column" && styles.column)}>
      {links.map((link) => {
        const active = isActivePath(pathname, link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(styles.link, active && styles.active)}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
