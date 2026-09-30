import type { UpcomingProject } from "./types";

/**
 * PLACEHOLDER CONTENT. Not real projects.
 *
 * The original Home page showed these three "Upcoming projects" in both the design
 * artifact and the live site. The original itself flags this as placeholder content
 * ("Copy and photography on this page are placeholders for review"). PropDesk has no
 * pre-launch endpoint, so there is no real source. The client must decide whether to
 * remove this section or supply real projects (Re-evaluation item N2).
 *
 * The video's version of The Exchange also claimed "8% assured rental for 24 months".
 * That claim is NOT reproduced here: it is an unverified financial promise, and it is not
 * in the design artifact.
 */
export const upcomingProjects: UpcomingProject[] = [
  {
    slug: "aravalli-skyline",
    name: "Aravalli Skyline",
    kind: "3 & 4 BHK apartments",
    location: "Ajmer Road",
    description:
      "Two towers of 22 floors with a 40,000 sq ft podium deck. Structural work begins March 2027; allocations open to 60 registered buyers.",
    status: "Pre-launch",
    statusTone: "gold",
    priceLabel: "₹1.35 Cr onward",
    facts: [
      { value: "₹1.35 Cr onward", label: "indicative" },
      { value: "1,780–2,410", label: "sq ft" },
      { value: "Q4 2029", label: "possession" },
    ],
    image: { src: "/images/home/upcoming-aravalli-skyline.jpg", alt: "Aravalli Skyline under construction, Ajmer Road, Jaipur" },
  },
  {
    slug: "rajmahal-estate",
    name: "Rajmahal Estate",
    kind: "Villa plots",
    location: "Vaishali Nagar",
    description: "48 plots of 2,000–3,600 sq ft with a clubhouse and internal 40 ft roads. JDA sanction expected by June.",
    status: "Approvals in process",
    statusTone: "navy",
    priceLabel: "₹78 L onward",
    image: { src: "/images/home/upcoming-rajmahal-estate.jpg", alt: "Rajmahal Estate, Vaishali Nagar, Jaipur" },
  },
  {
    slug: "the-exchange",
    name: "The Exchange",
    kind: "Commercial",
    location: "Jagatpura",
    description:
      "Ground-floor showrooms and two office floors on the Jagatpura arterial, with 90 basement bays.",
    status: "Pre-launch",
    statusTone: "gold",
    priceLabel: "₹1.1 Cr onward",
    image: { src: "/images/home/upcoming-the-exchange.jpg", alt: "The Exchange commercial block, Jagatpura, Jaipur" },
  },
];
