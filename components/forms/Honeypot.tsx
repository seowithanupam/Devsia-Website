"use client";

import { HONEYPOT_FIELD } from "@/lib/forms/spam";
import styles from "./forms.module.css";

/**
 * Hidden spam trap. People never see or reach it (off-screen, skipped by keyboard and
 * screen readers); bots that fill every input reveal themselves. The field name is
 * UNKNOWN in the original, so it is defined once in lib/forms/spam.ts.
 */
export function Honeypot({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <div className={styles.honeypot} aria-hidden="true">
      <label>
        Leave this field empty
        <input
          type="text"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  );
}
