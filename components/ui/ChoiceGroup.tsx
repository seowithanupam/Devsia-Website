"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import styles from "./ChoiceGroup.module.css";

export type ChoiceOption = { value: string; label: string };

export type ChoiceGroupProps = {
  legend: string;
  name: string;
  type: "radio" | "checkbox";
  options: readonly ChoiceOption[];
  /** Selected values. For radio groups this holds zero or one value. */
  value: string[];
  onChange: (next: string[]) => void;
  required?: boolean;
  /** Hides the legend visually (still read by screen readers) when a section heading already shows it. */
  legendHidden?: boolean;
  hint?: string;
  error?: string;
  className?: string;
};

/** Tiles for choosing one option (radio) or several (checkbox). Fully keyboard accessible. */
export function ChoiceGroup({
  legend,
  name,
  type,
  options,
  value,
  onChange,
  required,
  legendHidden,
  hint,
  error,
  className,
}: ChoiceGroupProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  function handleChange(optionValue: string) {
    if (type === "radio") onChange([optionValue]);
    else onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);
  }

  return (
    <fieldset className={cn(styles.group, className)} aria-describedby={describedBy}>
      <legend className={cn(styles.legend, legendHidden && "sr-only")}>
        {legend}
        {required ? (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        ) : null}
      </legend>
      <div className={styles.tiles}>
        {options.map((option) => {
          const checked = value.includes(option.value);
          return (
            <label key={option.value} className={cn(styles.tile, checked && styles.selected, error && !checked && styles.invalid)}>
              <input
                className={styles.input}
                type={type}
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => handleChange(option.value)}
                aria-invalid={error ? true : undefined}
              />
              <span className={cn(styles.mark, type === "radio" ? styles.radio : styles.check)} aria-hidden="true" />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
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
    </fieldset>
  );
}
