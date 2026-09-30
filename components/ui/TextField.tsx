"use client";

import { useId, type ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";
import styles from "./Field.module.css";

export type TextFieldProps = Omit<ComponentPropsWithRef<"input">, "className"> & {
  label: string;
  /** Helper text under the control. */
  hint?: string;
  /** Error message. Sets aria-invalid and is announced to screen readers. */
  error?: string;
  className?: string;
};

/**
 * Labelled text input. Required fields get a red asterisk and the required attribute.
 * `error` and `hint` are linked to the input with aria-describedby.
 */
export function TextField({ label, hint, error, className, id, required, ...rest }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn(styles.field, className)}>
      <label htmlFor={inputId} className={styles.labelText}>
        {label}
        {required ? (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <input
        {...rest}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(styles.control, error && styles.invalid)}
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
