"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SendOutcome } from "@/lib/forms/client";
import type { FieldErrors, ValidationResult } from "@/lib/forms/types";

export type FormStatus = "idle" | "submitting" | "success" | "error";

/**
 * Shared behaviour for the public forms: client validation, sending, status, per-field errors,
 * focus on the first error, and the fill-time timestamp used by the spam check.
 *
 * `validate` and `send` are supplied by each form, so the same hook serves the enquiry,
 * associate, contact and callback forms.
 */
export function useFormSubmit({
  validate,
  send,
}: {
  validate: (payload: unknown) => ValidationResult<unknown>;
  send: (payload: unknown) => Promise<SendOutcome>;
}) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [focusTick, setFocusTick] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const startedAtRef = useRef(0);

  // Record when the form appeared. The server rejects submissions that arrive too fast.
  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  // After an error appears, move focus to the first invalid control.
  useEffect(() => {
    if (focusTick === 0) return;
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    first?.focus();
  }, [focusTick]);

  const clearError = useCallback((key: string) => {
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const submit = useCallback(
    async (payload: Record<string, unknown>) => {
      const withEnvelope = { ...payload, formStartedAt: startedAtRef.current };
      const validation = validate(withEnvelope);
      if (!validation.ok) {
        setErrors(validation.errors);
        setFocusTick((tick) => tick + 1);
        return;
      }
      setErrors({});
      setStatus("submitting");
      const outcome = await send(withEnvelope);
      if (outcome.kind === "ok") {
        setStatus("success");
      } else if (outcome.kind === "invalid") {
        setErrors(outcome.errors);
        setStatus("idle");
        setFocusTick((tick) => tick + 1);
      } else {
        setStatus("error");
      }
    },
    [validate, send],
  );

  return { status, errors, clearError, submit, formRef };
}
