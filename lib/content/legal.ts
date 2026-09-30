import type { LegalDocument } from "./types";

/**
 * Legal text exactly as shown on the original /legal page ("Last updated 1 September 2026").
 * The Handoff Dossier says this text is developer-drafted placeholder wording that has
 * NOT been reviewed by counsel. It must be reviewed before launch.
 */
export const legalDocuments: LegalDocument[] = [
  {
    id: "privacy",
    navLabel: "Privacy policy",
    title: "Privacy policy",
    lastUpdated: "1 September 2026",
    intro:
      "DevSia Realty LLP (“DevSia”, “we”) collects personal information you provide through our enquiry, associate registration and contact forms — including your name, phone number, WhatsApp number, email, location preferences and budget — to respond to your enquiry and, where relevant, to share it with a developer partner.",
    sections: [
      {
        heading: "What we collect",
        bullets: [
          "Contact details you submit through any form on this site",
          "Property preferences, budget and timeline you provide",
          "Technical data — pages visited, referral source, UTM campaign parameters",
        ],
      },
      {
        heading: "How we use it",
        paragraphs: [
          "To route your enquiry to the right advisor, to send you the properties or information you requested, and to improve the properties we show. We do not sell personal data. Your phone number is shared with a developer only with your explicit consent.",
        ],
      },
      {
        heading: "DNC / NDNC consent",
        paragraphs: [
          "By submitting an enquiry or associate form, you agree that DevSia may contact you regarding your enquiry even if your number is registered under the National Do Not Call registry, for the purpose of that specific enquiry only.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "You may request a copy of the data we hold about you, or ask us to delete it, by writing to privacy@devsia.in.",
        ],
      },
    ],
  },
  {
    id: "terms",
    navLabel: "Terms of use",
    title: "Terms of use",
    lastUpdated: "1 September 2026",
    intro:
      "These terms govern your use of the DevSia website. By browsing this site or submitting a form, you agree to the terms below.",
    sections: [
      {
        heading: "Listing accuracy",
        paragraphs: [
          "Prices, specifications and images are indicative and sourced from the DevSia PropDesk CRM or developer partners. DevSia verifies title and RERA registration for listings marked “RERA” but does not guarantee pricing, which is subject to change without notice.",
        ],
      },
      {
        heading: "No brokerage guarantee",
        paragraphs: [
          "“Zero brokerage” applies only to listings explicitly marked as such, where DevSia is compensated by the developer. Resale and third-party listings may carry a brokerage fee, disclosed before booking.",
        ],
      },
      {
        heading: "Associate program",
        paragraphs: [
          "Associate registration does not guarantee acceptance into the DevSia broker network. Applications are reviewed at DevSia's discretion, typically within two working days.",
        ],
      },
      {
        heading: "Limitation of liability",
        paragraphs: [
          "DevSia is not liable for decisions made based on indicative pricing or availability shown on this site prior to written confirmation from an advisor.",
        ],
      },
    ],
  },
];
