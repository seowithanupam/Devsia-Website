"use client";

import { createContext, startTransition, useActionState, useContext, type FormEvent, type ReactNode } from "react";
import { Button, Checkbox, FormAlert, SelectField, TextAreaField, TextField } from "@/components/ui";
import { idleState, type ActionState } from "@/lib/admin/action-state";
import styles from "./admin.module.css";

type ServerAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

const ErrorsContext = createContext<Record<string, string>>({});

/**
 * A form wired to a server action. It submits with fetch-free React 19 actions, keeps what the person typed
 * (the form is not reset after saving), and shows the server's message and field errors. All checking that
 * matters happens again on the server; nothing here is trusted.
 */
export function AdminForm({
  action,
  children,
  submitLabel = "Save",
  hideSubmit = false,
  extra,
  className,
}: {
  action: ServerAction;
  children: ReactNode;
  submitLabel?: string;
  hideSubmit?: boolean;
  extra?: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, idleState);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const data = submitter ? new FormData(event.currentTarget, submitter) : new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <ErrorsContext.Provider value={state.errors ?? {}}>
      <form onSubmit={onSubmit} noValidate className={className ?? styles.formStack}>
        {state.message ? (
          state.ok ? (
            <p className={`${styles.notice} ${styles.noticeOk}`} role="status">
              {state.message}
            </p>
          ) : (
            <FormAlert>{state.message}</FormAlert>
          )
        ) : null}
        {children}
        {hideSubmit ? null : (
          <div className={styles.formBar}>
            <Button type="submit" loading={pending}>
              {submitLabel}
            </Button>
            {extra}
          </div>
        )}
      </form>
    </ErrorsContext.Provider>
  );
}

export function useFieldError(name: string): string | undefined {
  return useContext(ErrorsContext)[name];
}

type Common = { name: string; label: string; hint?: string; required?: boolean };

export function AField({ name, label, hint, required, defaultValue, type = "text", placeholder, autoComplete, maxLength }: Common & { defaultValue?: string; type?: string; placeholder?: string; autoComplete?: string; maxLength?: number }) {
  return <TextField name={name} label={label} hint={hint} required={required} type={type} defaultValue={defaultValue} placeholder={placeholder} autoComplete={autoComplete} maxLength={maxLength} error={useFieldError(name)} />;
}

export function AArea({ name, label, hint, required, defaultValue, rows = 6, mono = false }: Common & { defaultValue?: string; rows?: number; mono?: boolean }) {
  return (
    <div className={mono ? styles.mono : undefined}>
      <TextAreaField name={name} label={label} hint={hint} required={required} defaultValue={defaultValue} rows={rows} error={useFieldError(name)} />
    </div>
  );
}

export function ASelect({ name, label, hint, options, defaultValue }: Common & { options: Array<{ value: string; label: string }>; defaultValue?: string }) {
  return (
    <SelectField name={name} label={label} hint={hint} defaultValue={defaultValue} error={useFieldError(name)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </SelectField>
  );
}

export function ACheck({ name, label, defaultChecked }: { name: string; label: ReactNode; defaultChecked?: boolean }) {
  return <Checkbox name={name} label={label} defaultChecked={defaultChecked} error={useFieldError(name)} />;
}
