"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./property.module.css";

export type PropertyTab = { id: string; label: string; content: ReactNode };

/** Overview / Location / Approvals tabs (WAI-ARIA tabs pattern with arrow-key support). */
export function PropertyTabs({ tabs }: { tabs: PropertyTab[] }) {
  const base = useId();
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    setActive(tabs[next].id);
    document.getElementById(`${base}-tab-${tabs[next].id}`)?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Property information" className={styles.tabList}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`${base}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`${base}-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            className={cn(styles.tab, active === tab.id && styles.tabActive)}
            onClick={() => setActive(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${base}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={active !== tab.id}
          className={styles.tabPanel}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
