import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "red" | "outline" | "ghost" | "onRed";
export type ButtonSize = "md" | "sm";

type StyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

/** Class names for a button. Exported so other elements can look like buttons. */
export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: StyleProps = {}): string {
  return cn(
    styles.btn,
    styles[variant],
    size === "sm" && styles.sm,
    fullWidth && styles.fullWidth,
    className,
  );
}

export type ButtonProps = Omit<ComponentPropsWithoutRef<"button">, "className"> &
  StyleProps & {
    /** Shows a spinner, disables the button and sets aria-busy. */
    loading?: boolean;
  };

/** A button. The type defaults to "button"; pass type="submit" for forms. */
export function Button({
  variant,
  size,
  fullWidth,
  className,
  loading = false,
  disabled,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClassName({ variant, size, fullWidth, className })}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export type ButtonLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "className"> & StyleProps;

/** A link that looks like a button. Works for internal routes, tel:, mailto: and external URLs. */
export function ButtonLink({ variant, size, fullWidth, className, ...rest }: ButtonLinkProps) {
  return <Link {...rest} className={buttonClassName({ variant, size, fullWidth, className })} />;
}
