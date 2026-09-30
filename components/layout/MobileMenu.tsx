"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ButtonLink, CloseIcon, MenuIcon, PhoneIcon } from "@/components/ui";
import type { NavLink } from "@/lib/content/site";
import { NavLinks } from "./NavLinks";
import styles from "./MobileMenu.module.css";

/**
 * Mobile menu. The video is desktop only, so the mobile design is NOT recovered. The design
 * artifact shows only the menu button (44px, outline). The panel below is my layout, built
 * from the same links, buttons and contact details, and is ASSUMED.
 */
export function MobileMenu({
  links,
  phone,
  labels,
}: {
  links: NavLink[];
  phone: { display: string; tel: string };
  /** The text of the two buttons at the bottom of the menu (editable in the CMS). */
  labels: { enquiry: string; associate: string };
}) {
  // The menu is "open" only for the page it was opened on, so it closes by itself on navigation.
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  function setOpen(next: boolean) {
    setOpenPath(next ? pathname : null);
  }

  // Close with Escape and return focus to the button.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenPath(null);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className={`${styles.wrapper} only-mobile`}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.toggle}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        {open ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
      </button>
      <div id={panelId} className={styles.panel} hidden={!open}>
        <nav aria-label="Mobile">
          <NavLinks links={links} orientation="column" onNavigate={() => setOpen(false)} />
        </nav>
        <a className={`${styles.phone} num`} href={`tel:${phone.tel}`}>
          <PhoneIcon size={16} />
          {phone.display}
        </a>
        <div className={styles.actions}>
          <ButtonLink href="/enquire" fullWidth>
            {labels.enquiry}
          </ButtonLink>
          <ButtonLink href="/associates" variant="outline" fullWidth>
            {labels.associate}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
