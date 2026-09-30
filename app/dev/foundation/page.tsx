import { notFound } from "next/navigation";
import {
  Badge,
  Button,
  ButtonLink,
  Checkbox,
  Container,
  Label,
  Section,
  SectionHeading,
  SelectField,
  Skeleton,
  TextField,
} from "@/components/ui";
import styles from "./foundation.module.css";

export const metadata = { title: "Design system preview", robots: { index: false, follow: false } };

/** Every token shown here is read from the CSS variable, so nothing is duplicated. */
const colorTokens = [
  "--color-navy",
  "--color-navy-hover",
  "--color-navy-tint",
  "--color-red",
  "--color-red-hover",
  "--color-red-tint",
  "--color-ink",
  "--color-muted",
  "--color-faint",
  "--color-line",
  "--color-line-strong",
  "--color-surface-alt",
  "--color-ok",
  "--color-ok-tint",
  "--color-gold",
  "--color-gold-tint",
  "--color-footer-bg",
  "--color-footer-ink",
  "--color-footer-accent",
  "--color-navy-label",
  "--color-live",
];

/**
 * DEVELOPMENT-ONLY page for checking the foundation visually. It returns 404 in
 * production builds (including `next build && next start` and Vercel deployments),
 * so it never ships as a public route.
 */
export default function FoundationPreview() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <>
      <Section>
        <Container>
          <SectionHeading
            label="Development only"
            title="DevSia design system preview"
            description="Colors, type, buttons, badges, form controls and section tones, built from the recovered Home design."
          />
        </Container>
      </Section>

      <Section tone="tint">
        <Container className={styles.grid}>
          <SectionHeading label="Colors" title="Color tokens" />
          <div className={styles.swatches}>
            {colorTokens.map((token) => (
              <div key={token} className={styles.swatch}>
                <div className={styles.chip} style={{ background: `var(${token})` }} />
                <div className={styles.swatchName}>{token}</div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container className={styles.grid}>
          <SectionHeading label="Type" title="Type scale" />
          <div className={styles.panel}>
            <h1 className="t-hero">Find a home the paperwork already agrees with.</h1>
            <p className="t-lead" style={{ maxWidth: "56ch" }}>
              Hero paragraph. Every DevSia listing is RERA-checked and title-verified before it appears here.
            </p>
            <h2 className="t-h2">This week&apos;s three best-value properties</h2>
            <h3 className="t-title">Sundaram Greens, Phase II</h3>
            <p className="t-price num">₹62 – 88 L</p>
            <p className="t-stat num">14 years</p>
            <p className="t-body">Body paragraph in muted color, 15px.</p>
            <p className="t-small">Card body text, 13.5px, used inside cards.</p>
            <Label>Residential plot</Label>
          </div>
        </Container>
      </Section>

      <Section tone="tint">
        <Container className={styles.grid}>
          <SectionHeading label="Buttons and badges" title="Actions and status" />
          <div className={styles.row}>
            <Button>Primary</Button>
            <Button variant="red">Red</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="sm">Small</Button>
            <Button loading>Sending…</Button>
            <Button disabled>Disabled</Button>
            <ButtonLink href="/">Link button</ButtonLink>
          </div>
          <div className={styles.row}>
            <Badge tone="navy">Best value</Badge>
            <Badge tone="ok">RERA</Badge>
            <Badge tone="red">Price revised</Badge>
            <Badge tone="gold">Pre-launch</Badge>
            <Badge tone="tint">Market note</Badge>
            <Badge tone="outline">Zero brokerage</Badge>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className={styles.grid}>
          <SectionHeading label="Forms" title="Form controls" />
          <div className={styles.panel}>
            <div className={styles.formGrid}>
              <TextField label="Full name" placeholder="Rahul Sharma" required />
              <TextField
                label="Mobile number"
                placeholder="+91 98765 43210"
                inputMode="tel"
                required
                hint="We call you at the time you choose."
              />
              <SelectField label="Purpose" required defaultValue="">
                <option value="">Select</option>
                <option>Self Use</option>
                <option>Investment</option>
                <option>Rental</option>
              </SelectField>
              <TextField label="Preferred location" error="Enter at least one area." defaultValue="" />
            </div>
            <div style={{ marginTop: 20 }}>
              <Checkbox label="I agree to be contacted about this enquiry and accept the privacy policy." required />
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="navy" spacing="snug">
        <Container className={styles.grid}>
          <SectionHeading label="Navy section" labelTone="onNavy" title="Section tones and spacing" />
          <div className={styles.row}>
            <ButtonLink href="/" variant="outline">
              Outline on navy
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section tone="red" spacing="tight">
        <Container className={styles.row}>
          <span className="t-title">Red strip</span>
          <Button variant="onRed">Register as an associate</Button>
        </Container>
      </Section>

      <Section>
        <Container className={styles.grid}>
          <SectionHeading label="Loading and depth" title="Skeleton and shadows" />
          <div className={styles.panel}>
            <Skeleton height={160} radius={14} />
            <div style={{ height: 12 }} />
            <Skeleton width="60%" height={18} />
            <div style={{ height: 8 }} />
            <Skeleton width="40%" height={14} />
          </div>
          <div className={styles.formGrid}>
            <div className={styles.shadowBox} style={{ boxShadow: "var(--shadow-sm)" }}>
              --shadow-sm
            </div>
            <div className={styles.shadowBox} style={{ boxShadow: "var(--shadow-md)" }}>
              --shadow-md
            </div>
            <div className={styles.shadowBox} style={{ boxShadow: "var(--shadow-lg)" }}>
              --shadow-lg
            </div>
          </div>
          <div className={`${styles.demo} anim-rise`} style={{ background: "var(--color-navy-tint)" }}>
            Load-in animation (anim-rise). Reload to replay.
          </div>
        </Container>
      </Section>
    </>
  );
}
