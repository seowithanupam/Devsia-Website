"use client";

import { useState, type FormEvent } from "react";
import { Button, FormAlert, SelectField, StatusPanel, TextAreaField, TextField } from "@/components/ui";
import { sendContactRequest } from "@/app/actions/contact";
import { outcomeFromActionResult } from "@/lib/forms/client";
import { CONTACT_SUBJECT_OPTIONS } from "@/lib/forms/options";
import type { ContactRequestInput } from "@/lib/forms/types";
import { validateContactRequest } from "@/lib/forms/validation";
import { Honeypot } from "./Honeypot";
import { useFormSubmit } from "./useFormSubmit";
import styles from "./forms.module.css";

async function send(payload: unknown) {
  return outcomeFromActionResult(await sendContactRequest(payload));
}

/**
 * Short contact form. It is used on the About page (with Subject and Message, on the navy panel) and
 * for "Request a callback" (name and mobile only). The video shows the About form's Subject and
 * Message; the top fields of that form were not visible, so name and mobile are ASSUMED.
 * The CRM has no documented endpoint for these requests, so they only reach the mock provider.
 */
export function ContactForm({
  kind,
  withMessage = false,
  submitLabel = "Send message",
  successTitle = "Message sent",
  successText = "An advisor will get back to you within 4 working hours.",
  pageContext,
  tone = "light",
}: {
  kind: ContactRequestInput["kind"];
  withMessage?: boolean;
  submitLabel?: string;
  successTitle?: string;
  successText?: string;
  pageContext?: string;
  tone?: "light" | "onNavy";
}) {
  const [values, setValues] = useState({
    fullName: "",
    mobile: "",
    subject: "General enquiry",
    message: "",
    website_url: "",
  });
  const { status, errors, clearError, submit, formRef } = useFormSubmit({ validate: validateContactRequest, send });

  function set(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    clearError(key);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    const payload: Record<string, unknown> = {
      kind,
      fullName: values.fullName,
      mobile: values.mobile,
      website_url: values.website_url,
      pageContext,
    };
    if (withMessage) {
      payload.subject = values.subject;
      payload.message = values.message;
    }
    void submit(payload);
  }

  if (status === "success") {
    return (
      <StatusPanel tone="success" title={successTitle}>
        {successText}
      </StatusPanel>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className={`${styles.form} ${styles.compact} ${tone === "onNavy" ? styles.onNavy : ""}`}
    >
      <Honeypot value={values.website_url} onChange={(v) => set("website_url", v)} />
      <TextField
        label="Full name"
        name="fullName"
        required
        autoComplete="name"
        value={values.fullName}
        onChange={(e) => set("fullName", e.target.value)}
        error={errors.fullName}
      />
      <TextField
        label="Mobile number"
        name="mobile"
        required
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="10-digit mobile number"
        value={values.mobile}
        onChange={(e) => set("mobile", e.target.value)}
        error={errors.mobile}
      />
      {withMessage ? (
        <>
          <SelectField
            label="Subject"
            name="subject"
            value={values.subject}
            onChange={(e) => set("subject", e.target.value)}
            error={errors.subject}
          >
            {CONTACT_SUBJECT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectField>
          <TextAreaField
            label="Message"
            name="message"
            rows={4}
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
            error={errors.message}
          />
        </>
      ) : null}
      {status === "error" ? (
        <FormAlert>We could not send this right now. Please call the advisory desk instead.</FormAlert>
      ) : null}
      <Button type="submit" variant={tone === "onNavy" ? "onRed" : "primary"} loading={status === "submitting"} fullWidth>
        {status === "submitting" ? "Sending…" : submitLabel}
      </Button>
    </form>
  );
}
