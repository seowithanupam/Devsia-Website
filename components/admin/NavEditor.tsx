"use client";

import { useState } from "react";
import { Button, TextField } from "@/components/ui";
import type { ActionState } from "@/lib/admin/action-state";
import { NAV_LIMITS } from "@/lib/cms/nav";
import type { NavigationRecord, NavLinkRecord } from "@/lib/cms/types";
import { cn } from "@/lib/cn";
import { AdminForm, useFieldError } from "./AdminForm";
import styles from "./admin.module.css";

type ServerAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function Row({ path, link, index, count, onChange, onMove, onRemove }: { path: string; link: NavLinkRecord; index: number; count: number; onChange: (l: NavLinkRecord) => void; onMove: (to: number) => void; onRemove: () => void }) {
  const labelError = useFieldError(`${path}.${index}.label`);
  const hrefError = useFieldError(`${path}.${index}.href`);
  return (
    <div className={styles.listItem}>
      <div className={styles.grid2}>
        <TextField label="Link text" value={link.label} maxLength={40} onChange={(e) => onChange({ ...link, label: e.target.value })} error={labelError} />
        <TextField label="Goes to" value={link.href} onChange={(e) => onChange({ ...link, href: e.target.value })} error={hrefError} hint="A site path (/about), a full https:// link, mailto: or tel:" />
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.iconBtn} aria-label={`Move ${link.label || "link"} up`} disabled={index === 0} onClick={() => onMove(index - 1)}>
          ↑
        </button>
        <button type="button" className={styles.iconBtn} aria-label={`Move ${link.label || "link"} down`} disabled={index === count - 1} onClick={() => onMove(index + 1)}>
          ↓
        </button>
        <button type="button" className={cn(styles.iconBtn, styles.dangerBtn)} onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
}

function LinkList({ title, path, links, max, onChange }: { title: string; path: string; links: NavLinkRecord[]; max: number; onChange: (l: NavLinkRecord[]) => void }) {
  const listError = useFieldError(path);
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <h3 className={styles.cardTitle}>{title}</h3>
      {listError ? (
        <p role="alert" style={{ color: "var(--color-red)", fontSize: 13, margin: 0 }}>
          {listError}
        </p>
      ) : null}
      {links.map((link, index) => (
        <Row key={index} path={path} link={link} index={index} count={links.length} onChange={(l) => onChange(links.map((x, i) => (i === index ? l : x)))} onMove={(to) => onChange(move(links, index, to))} onRemove={() => onChange(links.filter((_, i) => i !== index))} />
      ))}
      {links.length < max ? (
        <div>
          <Button variant="outline" size="sm" onClick={() => onChange([...links, { label: "", href: "" }])}>
            Add link
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// These two read their field errors from the form, so they must be rendered INSIDE <AdminForm> (which provides them),
// not in the component that renders it.
function HeaderButtonsCard({ value, onChange }: { value: NavigationRecord["headerButtons"]; onChange: (next: NavigationRecord["headerButtons"]) => void }) {
  const associateError = useFieldError("headerButtons.associateLabel");
  const enquiryError = useFieldError("headerButtons.enquiryLabel");
  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>Header buttons</h3>
      <p className={styles.cardHelp}>The text on the two buttons in the header and the mobile menu. They always go to the associate page and the enquiry page.</p>
      <div className={styles.grid2}>
        <TextField label="Outline button (goes to /associates)" value={value.associateLabel} maxLength={40} onChange={(e) => onChange({ ...value, associateLabel: e.target.value })} error={associateError} />
        <TextField label="Main button (goes to /enquire)" value={value.enquiryLabel} maxLength={40} onChange={(e) => onChange({ ...value, enquiryLabel: e.target.value })} error={enquiryError} />
      </div>
    </section>
  );
}

function FooterHeadingField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const error = useFieldError("footerCompany.title");
  return <TextField label="Footer column heading" value={value} maxLength={40} onChange={(e) => onChange(e.target.value)} error={error} />;
}

/** Header links, the footer's Company column and the bottom-bar legal links. The footer's Properties and Localities columns are automatic. */
export function NavEditor({ initial, action }: { initial: NavigationRecord; action: ServerAction }) {
  const [nav, setNav] = useState<NavigationRecord>(initial);
  return (
    <AdminForm action={action} submitLabel="Save navigation">
      <input type="hidden" name="payload" value={JSON.stringify(nav)} />
      <section className={styles.card}>
        <LinkList title="Header links" path="header" links={nav.header} max={NAV_LIMITS.header} onChange={(header) => setNav({ ...nav, header })} />
      </section>
      <HeaderButtonsCard value={nav.headerButtons} onChange={(headerButtons) => setNav({ ...nav, headerButtons })} />
      <section className={styles.card}>
        <FooterHeadingField value={nav.footerCompany.title} onChange={(title) => setNav({ ...nav, footerCompany: { ...nav.footerCompany, title } })} />
        <LinkList title="Footer column links" path="footerCompany.links" links={nav.footerCompany.links} max={NAV_LIMITS.footer} onChange={(links) => setNav({ ...nav, footerCompany: { ...nav.footerCompany, links } })} />
      </section>
      <section className={styles.card}>
        <LinkList title="Bottom bar links (Privacy, Terms, Disclaimer)" path="legal" links={nav.legal} max={NAV_LIMITS.legal} onChange={(legal) => setNav({ ...nav, legal })} />
      </section>
    </AdminForm>
  );
}
