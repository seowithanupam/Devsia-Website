/**
 * Static page copy, taken from the walkthrough video and the recovered Home design.
 * In the original these are CMS blocks (hero, trust-strip, why-devsia, about-intro,
 * company-values, company-services, ...). They move into MongoDB in the CMS phase.
 *
 * Several claims here (RERA-checked and title-verified on every listing, 14 years,
 * 2,400+ families, credentials, the customer quote) are unverified placeholders in the
 * original; the client must confirm or replace them (Re-evaluation items 20, 21, N2).
 */

export const homeHero = {
  title: "Find a home the paperwork already agrees with.",
  paragraph:
    "Every DevSia listing is RERA-checked and title-verified before it appears here. One advisor takes you from first call to registry — and you pay no brokerage on developer inventory.",
};

export const trustStrip = [
  { value: "RERA verified", caption: "Registration on every listing" },
  { value: "14 years", caption: "Advising buyers in Jaipur" },
  { value: "2,400+ families", caption: "Handed over since 2012" },
  { value: "Zero brokerage", caption: "On developer inventory" },
];

export const highlightsCopy = {
  label: "Highlights",
  title: "This week's three best-value properties",
  description:
    "Shortlisted by our advisors on price per sq ft against the last six registered sales in the same locality.",
};

export const localitiesCopy = { label: "Explore Jaipur", title: "Where buyers are moving right now" };

export const whyDevsia = {
  label: "Why DevSia",
  title: "Four things we put in writing before a rupee moves",
  points: [
    {
      title: "Title checked before listing",
      text: "RERA registration, encumbrance certificate and sanctioned plan read by our legal desk. If it is not clean, it never appears.",
    },
    {
      title: "One advisor, start to registry",
      text: "No call centre, no handover to a closer. The advisor on your first site visit signs off on your agreement.",
    },
    {
      title: "Developer rate card, no markup",
      text: "We are paid by the developer, so you pay no brokerage on our inventory and every quoted number is the builder's own.",
    },
    {
      title: "Discretion when you need it",
      text: "Off-market inventory and private viewings for buyers who would rather not appear on a portal.",
    },
  ],
  quote: {
    text: "They talked us out of the first plot we wanted. Eleven months later they called about a corner parcel that never reached a portal.",
    name: "A. Raghunathan",
    caption: "Purchased at Tonk Road · 2024",
  },
  credentials: [
    { label: "RERA Rajasthan registered agent", value: "RAJ/A/12345" },
    { label: "NAR-India member firm", value: "Since 2016" },
    { label: "CREDAI Rajasthan channel partner", value: "Grade A" },
    { label: "In-house legal & title desk", value: "4 advocates" },
  ],
};

export const upcomingCopy = {
  label: "Upcoming projects",
  title: "Launching in Jaipur this year",
  description:
    "Pre-launch allocations open to registered buyers first. Prices are indicative until the RERA registration is published.",
};

export const insightsPreviewCopy = { label: "Insights", title: "Reading before you book" };

export const enquiryCta = {
  label: "Enquire",
  title: "Tell us the budget. We send three that actually fit.",
  description: "One advisor reads every enquiry and calls at the time you choose. No mailing list, no drip campaign.",
  promises: [
    "Reply within 4 working hours, Mon–Sat 10:00–19:00 IST",
    "Off-market options included where they fit your brief",
    "Your number is never shared with a developer without consent",
  ],
  panelTitle: "Fill it once. One advisor calls you back personally.",
  panelButton: "Post your enquiry",
};

export const associateStrip = {
  title: "Are you a broker or channel partner?",
  text: "Join the DevSia associate pool — shared inventory, transparent payouts and a dedicated desk for your closings.",
  button: "Register as an associate",
};

export const aboutIntro = {
  label: "About DevSia",
  title: "Fourteen years of advising on the same nine corridors.",
  paragraphs: [
    "DevSia Realty started in 2012 as a two-person title-verification desk for a single developer on Tonk Road. We still run that desk — now for every listing on this site — because it is the part of the transaction that goes wrong most often and gets talked about least.",
    "Today we advise buyers, sellers and developers across Jaipur's southern and western corridors, with four in-house advocates and a standing relationship with the sub-registrar's office for registry-day support.",
  ],
  stats: [
    { value: "2,400+", caption: "Families handed over since 2012" },
    { value: "14 years", caption: "Advising in Jaipur" },
    { value: "9 corridors", caption: "Actively tracked" },
  ],
  /** The original photo (a handshake) was not recovered; a placeholder is used. */
  image: { src: "/mock/editorial-placeholder.svg", alt: "Placeholder photo for the About page" },
};

export const aboutValues = [
  { title: "Title before price", text: "We check the paperwork before we discuss the number." },
  { title: "One advisor, whole journey", text: "No handover to a closer partway through." },
  { title: "Developer rate, no markup", text: "Paid by the developer, so buyers pay no brokerage." },
  { title: "Say no when it's warranted", text: "Three layouts turned down last year over conversion status." },
];

export const aboutServices = {
  label: "Services",
  title: "Everything between a shortlist and a registry",
  items: [
    { title: "Buyer advisory", text: "Shortlisting, site visits and negotiation for plots, apartments and villas across nine corridors." },
    { title: "Title & legal verification", text: "RERA registration, encumbrance certificate and sanctioned-plan review before any listing goes live." },
    { title: "Developer channel sales", text: "Pre-launch and channel-partner sales for developers on Jaipur's growth corridors." },
    { title: "Registry & documentation", text: "Sub-registrar coordination, stamp duty calculation and registry-day support." },
    { title: "Home loan facilitation", text: "Introductions to four partner lenders with pre-negotiated processing terms." },
    { title: "Associate & broker network", text: "Shared inventory and transparent payouts for independent brokers across Rajasthan." },
  ],
};

export const aboutContact = {
  label: "Contact",
  title: "Talk to the advisory desk",
  text: "Call, WhatsApp or write in — every message reaches an advisor, not a call centre.",
  successTitle: "Message sent",
  successText: "An advisor will get back to you within 4 working hours.",
};

export const enquirePage = {
  breadcrumb: "Forms",
  title: "Tell us what you are looking for",
  intro: "One advisor reads every enquiry and calls at the time you choose. Three options that fit the budget, no mailing list.",
  sidePanel: [
    { label: "Reply window", value: "4 working hours" },
    { label: "Desk hours", value: "Mon–Sat, 10–19 IST" },
    { label: "Options sent", value: "3 shortlisted" },
    { label: "Off-market inventory", value: "Included", tone: "ok" as const },
    { label: "Number shared with builder", value: "Only with consent" },
  ],
  success: {
    title: "Enquiry sent",
    text: "An advisor will call you within 4 working hours, Mon–Sat 10:00–19:00 IST, with three options that fit your brief.",
  },
};

export const associatesPage = {
  title: "Join the DevSia associate pool",
  intro: "Shared inventory, transparent payouts and a dedicated desk for your closings. Applications are reviewed within two working days.",
  success: {
    title: "Application submitted",
    text: "The partner team reviews applications within two working days and will reach out on the number you provided.",
  },
};

export const insightsPage = {
  label: "Insights",
  title: "DevSia Insights",
  intro: "Market notes, buyer guides and legal explainers written by our advisory and legal desks. Updated every fortnight.",
  /** Shown after a reader asks for a callback from an article. */
  callbackSuccessTitle: "Callback requested",
  callbackSuccessText: "An advisor will call you within 4 working hours, Mon–Sat 10:00–19:00 IST.",
};
