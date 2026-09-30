"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Field.module.css";

export type CheckboxProps = Omit<ComponentPropsWithRef<"input">, "type" | "className" | "children"> & {
  /** Label content. May include links, e.g. to the privacy policy. */
  label: ReactNode;
  error?: string;
  className?: string;
};

/** Checkbox with the original 18px box, used for consent. Clicking the label toggles it. */
export function Checkbox({ label, error, className, id, required, ...rest }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className={className}>
      <label htmlFor={inputId} className={styles.checkRow}>
        <input
          {...rest}
          id={inputId}
          type="checkbox"
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(styles.box, error && styles.invalid)}
        />
        <span className={styles.checkText}>
          {label}
          {required ? (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
      </label>
      {error ? (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
