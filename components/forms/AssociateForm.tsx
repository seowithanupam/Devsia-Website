"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Button,
  ButtonLink,
  ChoiceGroup,
  Checkbox,
  FormAlert,
  StatusPanel,
  TextField,
} from "@/components/ui";
import { associatesPage } from "@/lib/content/pages";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { postJson } from "@/lib/forms/client";
import { ASSOCIATE_PROPERTY_TYPE_OPTIONS, DEALS_CLOSED_OPTIONS, EXPERIENCE_OPTIONS } from "@/lib/forms/options";
import { validateAssociate } from "@/lib/forms/validation";
import { Honeypot } from "./Honeypot";
import { useFormSubmit } from "./useFormSubmit";
import styles from "./forms.module.css";

type Values = {
  fullName: string;
  mobile: string;
  whatsapp: string;
  email: string;
  city: string;
  preferredWorkingLocation: string;
  experience: string;
  propertyTypes: string[];
  currentOccupation: string;
  worksWithOtherCompany: string;
  dealsClosed: string;
  consent: boolean;
  website_url: string;
};

function send(payload: unknown) {
  return postJson("/api/v1/associates", payload);
}

/**
 * Associate registration. Fields and options are those of the live form in the video, which
 * match the vendor PDF. It posts to this site's own /api/v1/associates route (MOCK provider).
 * "Deals closed" starts on "0", as it appears preselected in the video.
 */
export function AssociateForm({
  successTitle = associatesPage.success.title,
  successText = associatesPage.success.text,
}: {
  /** Message shown after the application is sent (editable in the CMS; the built-in text is the default). */
  successTitle?: string;
  successText?: string;
} = {}) {
  const siteSettings = useSiteSettings();
  const [values, setValues] = useState<Values>({
    fullName: "",
    mobile: "",
    whatsapp: "",
    email: "",
    city: "",
    preferredWorkingLocation: "",
    experience: "",
    propertyTypes: [],
    currentOccupation: "",
    worksWithOtherCompany: "",
    dealsClosed: "0",
    consent: false,
    website_url: "",
  });
  const { status, errors, clearError, submit, formRef } = useFormSubmit({ validate: validateAssociate, send });

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    clearError(key);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    void submit({ ...values });
  }

  if (status === "success") {
    return (
      <StatusPanel tone="success" title={successTitle}>
        {successText}
      </StatusPanel>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className={`${styles.form} ${styles.panel}`}>
      <Honeypot value={values.website_url} onChange={(v) => set("website_url", v)} />

      <fieldset className={styles.section}>
        <legend className={styles.sectionTitle}>
          <span className={styles.sectionNumber} aria-hidden="true">
            01
          </span>
          Contact
        </legend>
        <div className={styles.row}>
          <TextField
            label="Full name"
            name="fullName"
            required
            autoComplete="name"
            placeholder="Amit Kumar"
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
            value={values.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            error={errors.whatsapp}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            error={errors.email}
          />
          <TextField
            label="City / area"
            name="city"
            required
            placeholder="Jaipur"
            hint="Your primary operating city."
            value={values.city}
            onChange={(e) => set("city", e.target.value)}
            error={errors.city}
          />
          <TextField
            label="Preferred working location"
            name="preferredWorkingLocation"
            required
            placeholder="Mansarovar, Jagatpura"
            value={values.preferredWorkingLocation}
            onChange={(e) => set("preferredWorkingLocation", e.target.value)}
            error={errors.preferredWorkingLocation}
          />
        </div>
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.sectionTitle}>
          <span className={styles.sectionNumber} aria-hidden="true">
            02
          </span>
          Experience in real estate
          <span className={styles.sectionRequired} aria-hidden="true">
            *
          </span>
        </legend>
        <ChoiceGroup
          legendHidden
          legend="Experience in real estate"
          name="experience"
          type="radio"
          required
          options={EXPERIENCE_OPTIONS.map((label) => ({ value: label, label }))}
          value={values.experience ? [values.experience] : []}
          onChange={(next) => set("experience", next[0] ?? "")}
          error={errors.experience}
        />
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.sectionTitle}>
          <span className={styles.sectionNumber} aria-hidden="true">
            03
          </span>
          Property types you deal in
          <span className={styles.sectionRequired} aria-hidden="true">
            *
          </span>
        </legend>
        <ChoiceGroup
          legendHidden
          legend="Property types you deal in"
          name="propertyTypes"
          type="checkbox"
          required
          options={ASSOCIATE_PROPERTY_TYPE_OPTIONS.map((label) => ({ value: label, label }))}
          value={values.propertyTypes}
          onChange={(next) => set("propertyTypes", next)}
          error={errors.propertyTypes}
        />
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.sectionTitle}>
          <span className={styles.sectionNumber} aria-hidden="true">
            04
          </span>
          Your practice
        </legend>
        <TextField
          label="Current occupation / business"
          name="currentOccupation"
          placeholder="Freelance broker, agency owner, salaried…"
          value={values.currentOccupation}
          onChange={(e) => set("currentOccupation", e.target.value)}
        />
        <ChoiceGroup
          legend="Do you currently work with any real estate company?"
          name="worksWithOtherCompany"
          type="radio"
          required
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={values.worksWithOtherCompany ? [values.worksWithOtherCompany] : []}
          onChange={(next) => set("worksWithOtherCompany", next[0] ?? "")}
          error={errors.worksWithOtherCompany}
        />
        <ChoiceGroup
          legend="Deals closed in the last 12 months"
          name="dealsClosed"
          type="radio"
          options={DEALS_CLOSED_OPTIONS.map((label) => ({ value: label, label }))}
          value={values.dealsClosed ? [values.dealsClosed] : []}
          onChange={(next) => set("dealsClosed", next[0] ?? "")}
          error={errors.dealsClosed}
        />
      </fieldset>

      <Checkbox
        className={styles.consent}
        name="consent"
        required
        checked={values.consent}
        onChange={(e) => set("consent", e.target.checked)}
        error={errors.consent}
        label={
          <>
            I confirm the details above are accurate and accept the DevSia <Link href="/legal#terms">associate terms</Link>{" "}
            and <Link href="/legal">privacy policy</Link>.
          </>
        }
      />

      {status === "error" ? (
        <FormAlert>
          We could not submit your application. Please try again, or call the partner desk on {siteSettings.partnerDesk.phone}.
        </FormAlert>
      ) : null}

      <div className={styles.actions}>
        <Button type="submit" variant="red" loading={status === "submitting"}>
          {status === "submitting" ? "Submitting…" : "Submit application"}
        </Button>
        <ButtonLink href={`tel:${siteSettings.partnerDesk.tel}`} variant="outline">
          Speak to the partner desk
        </ButtonLink>
      </div>
    </form>
  );
}
