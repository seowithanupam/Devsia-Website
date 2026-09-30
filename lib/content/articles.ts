import type { Article, ArticleBlock } from "./types";

/**
 * Insights articles. LOCAL CONTENT, ready to move into MongoDB.
 *
 * Source: the walkthrough video, which showed 8 articles. Titles, categories, read
 * times, dates, authors and excerpts are exactly as shown. Only the first article's full
 * text was visible, and it is reproduced from the video. The original marks its own
 * figures "illustrative placeholders for this design review", so treat them as
 * placeholders too.
 *
 * The other seven bodies were never shown. They carry stand-in text and
 * `placeholderBody: true`, and the article page says so.
 * Cover photos are stock or placeholder images, not the originals.
 * Slugs were readable in the video for three articles (tonk-road-rate-catches-up,
 * eleven-documents-before-booking, why-plot-loans-cost-more); the other five are derived
 * from their titles and are UNKNOWN.
 */

const PLACEHOLDER_NOTE =
  "The full text of this article was not recovered from the original site. This is stand-in text until the article is added through the CMS.";

function standInBody(excerpt: string): ArticleBlock[] {
  return [{ type: "p", text: excerpt }];
}

const placeholderCover = {
  src: "/mock/editorial-placeholder.svg",
  alt: "Placeholder photo",
  caption: "Placeholder photography — client imagery to replace.",
};

export const PLACEHOLDER_BODY_NOTE = PLACEHOLDER_NOTE;

export const articles: Article[] = [
  {
    slug: "tonk-road-rate-catches-up",
    title: "Why Tonk Road's rate per sq ft finally caught up with Mansarovar",
    excerpt:
      "Registered sale data for the southern corridor shows a 19% shift over six quarters. We break down what drove it — the Ring Road interchange, the Sitapura employment base, and a supply gap in plotted inventory that has not closed.",
    category: "Market note",
    categorySlug: "market-note",
    readMinutes: 6,
    publishedAt: "2026-08-24",
    author: { name: "Amit Kumar", role: "Senior advisor · Tonk Road & Sanganer" },
    cover: {
      src: "/images/insights/southern-corridor-towers.jpg",
      alt: "New towers along the southern corridor",
      caption: "New towers along the southern corridor. Placeholder photography — client imagery to replace.",
    },
    featured: true,
    tags: ["Tonk Road plots", "Rate analysis"],
    placeholderBody: false,
    body: [
      {
        type: "p",
        text: "Between the first quarter of 2025 and the second quarter of 2026, the average registered rate on Tonk Road moved from ₹3,480 per sq ft to ₹4,150 — a 19.3% rise across six quarters. Mansarovar over the same period moved from ₹5,240 to ₹5,700, a rise of 8.8%. The gap between the two corridors has narrowed from 51% to 37%.",
      },
      {
        type: "p",
        text: "That is the headline. The more useful number is the spread within Tonk Road: plots on the eastern side of the arterial, closer to the Ring Road interchange, now register 11% above the corridor average, where eighteen months ago the premium was 4%.",
      },
      {
        type: "quote",
        text: "The corridor did not appreciate evenly. Roughly two-thirds of the rise sits within three kilometres of the interchange.",
      },
      { type: "h2", id: "what-moved-the-rate", text: "Three things that moved the rate" },
      {
        type: "steps",
        items: [
          {
            title: "The Ring Road interchange opened to full traffic",
            text: "The southern interchange took a year longer than announced, but since it opened, drive time from the corridor to the Sitapura employment cluster has fallen from roughly 26 minutes to 12. That single change made the corridor viable for buyers who work in Sitapura and previously bought in Pratap Nagar.",
          },
          {
            title: "Plotted supply stopped releasing",
            text: "Four of the seven JDA-sanctioned layouts on the corridor sold through their released phases by mid-2025 and have not opened new ones. Where a buyer had eleven layouts to choose from in 2024, there are now four with inventory.",
          },
          {
            title: "Institutional buyers entered the plot market",
            text: "We have seen a measurable increase in two-plot and three-plot purchases by single families and small investor groups, which was rare on this corridor before 2025. Where the marginal buyer changes, the marginal price changes with it.",
          },
        ],
      },
      { type: "h2", id: "corridor-comparison", text: "Corridor comparison" },
      {
        type: "table",
        caption: "Average registered rate per sq ft for residential plots, and the change across six quarters.",
        headers: ["Corridor", "Q1 2025", "Q2 2026", "Change"],
        rows: [
          ["Tonk Road", "₹3,480", "₹4,150", "+19.3%"],
          ["Mansarovar", "₹5,240", "₹5,700", "+8.8%"],
          ["Jagatpura", "₹5,610", "₹6,200", "+10.5%"],
          ["Vaishali Nagar", "₹6,390", "₹6,850", "+7.2%"],
          ["Ajmer Road", "₹3,910", "₹4,380", "+12.0%"],
        ],
      },
      {
        type: "callout",
        title: "How we count.",
        text: "Rates are drawn from registered sale deeds filed with the sub-registrar, not from asking prices or listing portals. Layouts with fewer than six registrations in a quarter are excluded. Figures are illustrative placeholders for this design review.",
      },
      { type: "h2", id: "supply-gap", text: "Where the supply gap sits" },
      {
        type: "p",
        text: "The shortage is specific: it is in 1,500–2,000 sq ft plots inside sanctioned, walled layouts with commissioned utilities. Larger parcels are available, and unsanctioned land is available at a considerable discount, but the band most first-time plot buyers want has thinned to roughly nineteen available units across the four active layouts we track.",
      },
      {
        type: "ul",
        items: [
          "1,500–2,000 sq ft, sanctioned: 19 units available, down from 140 in early 2025.",
          "2,000–3,000 sq ft, sanctioned: 61 units available, broadly stable.",
          "Above 3,000 sq ft: 38 units, slow-moving at current rates.",
          "Unsanctioned / conversion pending: plentiful, and not something we list.",
        ],
      },
      { type: "h2", id: "what-we-tell-buyers", text: "What we are telling buyers" },
      {
        type: "p",
        text: "If you are buying to build within two years, the corridor still prices below Mansarovar and Jagatpura for a comparable commute, and the utilities question is settled in the walled layouts. If you are buying purely to hold, understand that a good part of the interchange story is now in the price.",
      },
      {
        type: "p",
        text: "Either way, ask for the sanction letter and the encumbrance certificate before the booking amount, not after. On this corridor specifically, we have turned down three layouts in the last year over conversion status.",
      },
    ],
  },
  {
    slug: "eleven-documents-before-booking",
    title: "The eleven documents to read before you pay a booking amount",
    excerpt: "What our legal desk checks, in the order it checks them.",
    category: "Buyer guide",
    categorySlug: "buyer-guide",
    readMinutes: 9,
    publishedAt: "2026-08-11",
    author: { name: "DevSia Legal Desk" },
    cover: {
      src: "/images/insights/residential-facade.jpg",
      alt: "Residential building facade in Jaipur",
      caption: "Placeholder photography — client imagery to replace.",
    },
    featured: false,
    tags: ["Buyer guide", "Due diligence"],
    placeholderBody: true,
    body: standInBody("What our legal desk checks, in the order it checks them."),
  },
  {
    slug: "plots-versus-apartments-ten-year-horizon",
    title: "Plots versus apartments on a ten-year horizon",
    excerpt: "Two ledgers, the same capital, side by side — including stamp duty and the resale spread.",
    category: "Investment",
    categorySlug: "investment",
    readMinutes: 5,
    publishedAt: "2026-08-02",
    author: { name: "DevSia Advisory Desk" },
    cover: placeholderCover,
    featured: false,
    tags: ["Investment"],
    placeholderBody: true,
    body: standInBody("Two ledgers, the same capital, side by side — including stamp duty and the resale spread."),
  },
  {
    slug: "reading-a-rera-registration",
    title: "Reading a RERA registration the way a lawyer reads it",
    excerpt: "Which four fields on the RERA Rajasthan portal actually matter to a buyer.",
    category: "Legal & RERA",
    categorySlug: "legal-rera",
    readMinutes: 7,
    publishedAt: "2026-07-27",
    author: { name: "DevSia Legal Desk" },
    cover: placeholderCover,
    featured: false,
    tags: ["RERA"],
    placeholderBody: true,
    body: standInBody("Which four fields on the RERA Rajasthan portal actually matter to a buyer."),
  },
  {
    slug: "why-plot-loans-cost-more",
    title: "Why plot loans cost more than home loans, and by how much",
    excerpt: "Loan-to-value caps, tenure limits and the construction clause banks apply.",
    category: "Home loans",
    categorySlug: "home-loans",
    readMinutes: 8,
    publishedAt: "2026-07-19",
    author: { name: "DevSia Advisory Desk" },
    cover: placeholderCover,
    featured: false,
    tags: ["Home loans"],
    placeholderBody: true,
    body: standInBody("Loan-to-value caps, tenure limits and the construction clause banks apply."),
  },
  {
    slug: "vaishali-nagar-in-2026",
    title: "Vaishali Nagar in 2026: schools, water and the resale market",
    excerpt: "A full quarter-by-quarter read on Jaipur's most established western suburb.",
    category: "Locality report",
    categorySlug: "locality-report",
    readMinutes: 11,
    publishedAt: "2026-07-08",
    author: { name: "DevSia Research" },
    cover: placeholderCover,
    featured: false,
    tags: ["Locality report"],
    placeholderBody: true,
    body: standInBody("A full quarter-by-quarter read on Jaipur's most established western suburb."),
  },
  {
    slug: "what-an-assured-rental-clause-is-worth",
    title: "What an assured-rental clause is really worth",
    excerpt: "Reading the fine print on commercial showroom guarantees in Jaipur.",
    category: "Investment",
    categorySlug: "investment",
    readMinutes: 6,
    publishedAt: "2026-06-30",
    author: { name: "DevSia Advisory Desk" },
    cover: placeholderCover,
    featured: false,
    tags: ["Investment"],
    placeholderBody: true,
    body: standInBody("Reading the fine print on commercial showroom guarantees in Jaipur."),
  },
  {
    slug: "stamp-duty-in-rajasthan-2026",
    title: "Stamp duty in Rajasthan: the 2026 numbers",
    excerpt: "The current stamp duty and registration slabs, and who qualifies for a concession.",
    category: "Legal & RERA",
    categorySlug: "legal-rera",
    readMinutes: 5,
    publishedAt: "2026-06-22",
    author: { name: "DevSia Legal Desk" },
    cover: placeholderCover,
    featured: false,
    tags: ["Stamp duty"],
    placeholderBody: true,
    body: standInBody("The current stamp duty and registration slabs, and who qualifies for a concession."),
  },
];
