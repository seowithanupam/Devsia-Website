"use client";

import { Button, type ButtonProps } from "@/components/ui";

/** A submit button that asks "are you sure?" first. Used for deletes and other hard-to-undo actions. */
export function ConfirmSubmit({ message, children, ...rest }: { message: string } & Omit<ButtonProps, "type" | "onClick">) {
  return (
    <Button
      {...rest}
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
