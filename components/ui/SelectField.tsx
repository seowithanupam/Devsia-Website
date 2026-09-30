"use client";

import { useId, type ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";
import styles from "./Field.module.css";

export type SelectFieldProps = Omit<ComponentPropsWithRef<"select">, "className"> & {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
};

/** Labelled native select with the original chevron. Pass <option> elements as children. */
export function SelectField({ label, hint, error, className, id, required, children, ...rest }: SelectFieldProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn(styles.field, className)}>
      <label htmlFor={selectId} className={styles.labelText}>
        {label}
        {required ? (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <select
        {...rest}
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(styles.control, styles.select, error && styles.invalid)}
      >
        {children}
      </select>
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
