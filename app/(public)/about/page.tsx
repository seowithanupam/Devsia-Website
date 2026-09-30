import Image from "next/image";
import { ContactForm } from "@/components/forms/ContactForm";
import { Container, Label, MailIcon, MapPinIcon, PhoneIcon, Section, SectionHeading, WhatsAppIcon } from "@/components/ui";
import type { AboutIntroData, CardsData, ContactCopyData, ResolvedBlock } from "@/lib/cms/blocks";
import { getPageBlocks, getPageSeo, getSiteSettings } from "@/lib/cms/public";
import type { SiteSettings } from "@/lib/content/site";
import { buildMetadata } from "@/lib/seo/metadata";
import styles from "@/components/pages/pages.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const blocks = await getPageBlocks("about");
  const intro = blocks.find((b) => b.type === "about-intro")?.data as AboutIntroData | undefined;
  return buildMetadata({
    title: "About DevSia",
    description: intro?.paragraphs[0] ?? "About DevSia Realty LLP.",
    path: "/about",
    seo: await getPageSeo("about"),
  });
}

function Intro({ data }: { data: AboutIntroData }) {
  return (
    <Section spacing="snug">
      <Container>
        <div className={styles.aboutIntro}>
          <div>
            <Label tone="red">{data.label}</Label>
            <h1 className="t-h2">{data.title}</h1>
            {data.paragraphs.map((paragraph) => (
              <p key={paragraph} className="t-body">
                {paragraph}
              </p>
            ))}
            <ul className={styles.stats}>
              {data.stats.map((stat) => (
                <li key={stat.value}>
                  <div className={styles.statValue}>{stat.value}</div>
                  <div className={styles.statCaption}>{stat.caption}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.aboutImage}>
            <Image src={data.image.src} alt={data.image.alt} fill sizes="(max-width: 1199px) 100vw, 50vw" unoptimized />
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Values({ data }: { data: CardsData }) {
  return (
    <Section tone="tint">
      <Container>
        <SectionHeading label={data.label} title={data.title} />
        <ul className={styles.cards}>
          {data.items.map((value) => (
            <li key={value.title} className={styles.infoCard}>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

function Services({ data }: { data: CardsData }) {
  return (
    <Section id="services">
      <Container>
        <SectionHeading label={data.label} title={data.title} />
        <ul className={`${styles.cards} ${styles.cards3}`}>
          {data.items.map((service) => (
            <li key={service.title} className={styles.infoCard}>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

function Contact({ data, settings }: { data: ContactCopyData; settings: SiteSettings }) {
  return (
    <Section tone="navy" id="contact">
      <Container>
        <div className={styles.contactLayout}>
          <div>
            <SectionHeading label={data.label} labelTone="onNavy" title={data.title} description={data.text} />
            <ul className={styles.contactList}>
              <li>
                <PhoneIcon size={16} /> <a href={`tel:${settings.phone.tel}`}>{settings.phone.display}</a>
              </li>
              <li>
                <WhatsAppIcon size={16} /> <a href={settings.whatsapp.href}>{settings.whatsapp.display}</a>
              </li>
              <li>
                <MailIcon size={16} /> <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </li>
              <li>
                <MapPinIcon size={16} /> {settings.addressOneLine}
              </li>
              <li>
                {settings.hours.weekdays} · Sunday: {settings.hours.sunday}
              </li>
            </ul>
          </div>
          <div className={styles.contactPanel}>
            <ContactForm
              kind="about-message"
              withMessage
              tone="onNavy"
              pageContext="/about"
              successTitle={data.successTitle}
              successText={data.successText}
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}

function renderBlock(block: ResolvedBlock, settings: SiteSettings) {
  switch (block.type) {
    case "about-intro":
      return <Intro key={block.type} data={block.data as AboutIntroData} />;
    case "company-values":
      return <Values key={block.type} data={block.data as CardsData} />;
    case "company-services":
      return <Services key={block.type} data={block.data as CardsData} />;
    case "company-contact":
      return <Contact key={block.type} data={block.data as ContactCopyData} settings={settings} />;
    default:
      return null;
  }
}

export default async function AboutPage() {
  const [blocks, settings] = await Promise.all([getPageBlocks("about"), getSiteSettings()]);
  return <>{blocks.map((block) => renderBlock(block, settings))}</>;
}
