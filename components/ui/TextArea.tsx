"use client";

import { useId, type ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";
import styles from "./Field.module.css";

export type TextAreaProps = Omit<ComponentPropsWithRef<"textarea">, "className"> & {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
};

/** Labelled multi-line input, styled like TextField. */
export function TextAreaField({ label, hint, error, className, id, required, rows = 4, ...rest }: TextAreaProps) {
  const autoId = useId();
  const areaId = id ?? autoId;
  const hintId = `${areaId}-hint`;
  const errorId = `${areaId}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn(styles.field, className)}>
      <label htmlFor={areaId} className={styles.labelText}>
        {label}
        {required ? (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <textarea
        {...rest}
        id={areaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(styles.control, styles.textarea, error && styles.invalid)}
      />
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
