"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  Button,
  ButtonLink,
  ChoiceGroup,
  Checkbox,
  FormAlert,
  SelectField,
  StatusPanel,
  TextAreaField,
  TextField,
} from "@/components/ui";
import { enquirePage } from "@/lib/content/pages";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { postJson } from "@/lib/forms/client";
import {
  BUDGET_OPTIONS,
  CALL_TIME_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  PURPOSE_OPTIONS,
  SITE_VISIT_OPTIONS,
  TIMELINE_OPTIONS,
} from "@/lib/forms/options";
import { validateEnquiry } from "@/lib/forms/validation";
import { cn } from "@/lib/cn";
import { Honeypot } from "./Honeypot";
import { useFormSubmit } from "./useFormSubmit";
import styles from "./forms.module.css";

export type EnquiryDefaults = {
  propertyTypes?: string[];
  preferredLocation?: string;
  budgetBand?: string;
};

type Values = {
  fullName: string;
  mobile: string;
  whatsapp: string;
  callTime: string;
  propertyTypes: string[];
  preferredLocation: string;
  budgetBand: string;
  purpose: string;
  timeline: string;
  siteVisit: string;
  notes: string;
  consent: boolean;
  website_url: string;
};

const CALL_TIME_DEFAULT = "No preference";

function send(payload: unknown) {
  return postJson("/api/v1/leads", payload);
}

/**
 * Property enquiry form. Fields, options, hints and states are those of the live form in the
 * walkthrough video. It posts to this site's own /api/v1/leads route, which currently uses the
 * MOCK lead provider. PropDesk is not connected.
 *
 * variant "page": the full form at /enquire, with numbered sections and a notes box.
 * variant "compact": the sidebar form on a property page, prefilled from the listing.
 */
export function EnquiryForm({
  variant = "page",
  defaults,
  pageEnquired,
  successTitle = enquirePage.success.title,
  successText = enquirePage.success.text,
}: {
  variant?: "page" | "compact";
  defaults?: EnquiryDefaults;
  /** Path of the page the form is on, passed through as page_enquired later. */
  pageEnquired?: string;
  /** Message shown after the form is sent (editable in the CMS; the built-in text is the default). */
  successTitle?: string;
  successText?: string;
}) {
  const compact = variant === "compact";
  const siteSettings = useSiteSettings();
  const [values, setValues] = useState<Values>({
    fullName: "",
    mobile: "",
    whatsapp: "",
    callTime: CALL_TIME_DEFAULT,
    propertyTypes: defaults?.propertyTypes ?? [],
    preferredLocation: defaults?.preferredLocation ?? "",
    budgetBand: defaults?.budgetBand ?? "",
    purpose: "",
    timeline: "",
    siteVisit: "",
    notes: "",
    consent: false,
    website_url: "",
  });
  const { status, errors, clearError, submit, formRef } = useFormSubmit({ validate: validateEnquiry, send });

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    clearError(key);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    void submit({ ...values, pageEnquired });
  }

  if (status === "success") {
    return (
      <StatusPanel tone="success" title={successTitle}>
        {successText}
      </StatusPanel>
    );
  }

  const Section = compact ? CompactGroup : NumberedSection;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className={cn(styles.form, compact ? styles.compact : styles.panel)}>
      <Honeypot value={values.website_url} onChange={(v) => set("website_url", v)} />

      <Section number="01" title="Your details">
        <div className={styles.row}>
          <TextField
            label="Full name"
            name="fullName"
            required
            autoComplete="name"
            placeholder="Rahul Sharma"
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
            placeholder="+91 98765 43210"
            value={values.mobile}
            onChange={(e) => set("mobile", e.target.value)}
            error={errors.mobile}
          />
          <TextField
            label="WhatsApp number"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            placeholder="If different from mobile"
            hint="Leave blank to use your mobile number"
            value={values.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            error={errors.whatsapp}
          />
          <SelectField
            label="Preferred call time"
            name="callTime"
            value={values.callTime}
            onChange={(e) => set("callTime", e.target.value)}
            error={errors.callTime}
          >
            {CALL_TIME_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectField>
        </div>
      </Section>

      <Section number="02" title="What are you looking for?" required>
        <ChoiceGroup
          legendHidden
          legend="Property type"
          name="propertyTypes"
          type="checkbox"
          required
          options={PROPERTY_TYPE_OPTIONS.map((label) => ({ value: label, label }))}
          value={values.propertyTypes}
          onChange={(next) => set("propertyTypes", next)}
          hint="Select as many as apply"
          error={errors.propertyTypes}
        />
      </Section>

      <Section number="03" title="Location & budget">
        <TextField
          label="Preferred location"
          name="preferredLocation"
          required
          placeholder="Tonk Road, Mansarovar, Jagatpura…"
          hint="Add more than one area separated by commas."
          value={values.preferredLocation}
          onChange={(e) => set("preferredLocation", e.target.value)}
          error={errors.preferredLocation}
        />
        <ChoiceGroup
          legend="Budget"
          name="budgetBand"
          type="radio"
          required
          options={BUDGET_OPTIONS}
          value={values.budgetBand ? [values.budgetBand] : []}
          onChange={(next) => set("budgetBand", next[0] ?? "")}
          error={errors.budgetBand}
        />
      </Section>

      <Section number="04" title="Purpose & timeline">
        <ChoiceGroup
          legend="Purpose"
          name="purpose"
          type="radio"
          required
          options={PURPOSE_OPTIONS.map((label) => ({ value: label, label }))}
          value={values.purpose ? [values.purpose] : []}
          onChange={(next) => set("purpose", next[0] ?? "")}
          error={errors.purpose}
        />
        <ChoiceGroup
          legend="When are you planning to buy?"
          name="timeline"
          type="radio"
          required
          options={TIMELINE_OPTIONS.map((label) => ({ value: label, label }))}
          value={values.timeline ? [values.timeline] : []}
          onChange={(next) => set("timeline", next[0] ?? "")}
          error={errors.timeline}
        />
        <ChoiceGroup
          legend="Are you ready for a site visit?"
          name="siteVisit"
          type="radio"
          options={SITE_VISIT_OPTIONS.map((label) => ({ value: label, label }))}
          value={values.siteVisit ? [values.siteVisit] : []}
          onChange={(next) => set("siteVisit", next[0] ?? "")}
          error={errors.siteVisit}
        />
      </Section>

      {compact ? null : (
        <Section number="05" title="Anything else">
          <TextAreaField
            label="Notes for your advisor"
            name="notes"
            placeholder="Corner plot preferred, east facing, within 2 km of a CBSE school…"
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            error={errors.notes}
          />
        </Section>
      )}

      <Checkbox
        className={styles.consent}
        name="consent"
        required
        checked={values.consent}
        onChange={(e) => set("consent", e.target.checked)}
        error={errors.consent}
        label={
          <>
            I agree to be contacted by DevSia about this enquiry and accept the <Link href="/legal">privacy policy</Link>.
            This consent overrides my DNC / NDNC registration.
          </>
        }
      />

      {status === "error" ? (
        <FormAlert>
          We could not send your enquiry. Please try again, or call the advisory desk on {siteSettings.phone.display}.
        </FormAlert>
      ) : null}

      <div className={styles.actions}>
        <Button type="submit" loading={status === "submitting"} fullWidth={compact}>
          {status === "submitting" ? "Sending…" : "Send enquiry"}
        </Button>
        {compact ? null : (
          <ButtonLink href={`tel:${siteSettings.phone.tel}`} variant="outline">
            Call instead
          </ButtonLink>
        )}
      </div>
    </form>
  );
}

function NumberedSection({
  number,
  title,
  required = false,
  children,
}: {
  number: string;
  title: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className={styles.section}>
      <legend className={styles.sectionTitle}>
        <span className={styles.sectionNumber} aria-hidden="true">
          {number}
        </span>
        {title}
        {required ? (
          <span className={styles.sectionRequired} aria-hidden="true">
            *
          </span>
        ) : null}
      </legend>
      {children}
    </fieldset>
  );
}

/** In the sidebar variant the groups have no numbers or headings. */
function CompactGroup({ children }: { number: string; title: string; required?: boolean; children: ReactNode }) {
  return <div className={styles.section}>{children}</div>;
}
