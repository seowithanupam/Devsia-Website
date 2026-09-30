/**
 * Site-wide settings.
 *
 * In the original these live in MongoDB and are edited at /admin/settings (agency
 * name, phone, WhatsApp, email, address, RERA number, partner desk). Until the CMS
 * exists they are static, and every value is exactly what the walkthrough video
 * showed. The client has NOT confirmed that these are real (the Handoff Dossier
 * lists all of them as unconfirmed), so treat them as TEMPORARY.
 */
export type SiteSettings = {
  brand: string;
  agencyName: string;
  blurb: string;
  phone: { display: string; tel: string };
  whatsapp: { display: string; href: string };
  email: string;
  privacyEmail: string;
  addressLines: [string, string];
  addressOneLine: string;
  reraNumber: string;
  hours: { weekdays: string; sunday: string };
  partnerDesk: { phone: string; tel: string; email: string };
  footerDisclaimer: string;
};

export const siteSettings: SiteSettings = {
  brand: "DevSia",
  agencyName: "DevSia Realty LLP",
  blurb: "DevSia Realty LLP — residential and plotted advisory across Jaipur since 2012.",
  phone: { display: "+91 141 4000 900", tel: "+911414000900" },
  whatsapp: { display: "+91 98290 41100", href: "https://wa.me/919829041100" },
  email: "advisory@devsia.in",
  privacyEmail: "privacy@devsia.in",
  addressLines: ["3rd Floor, Anand Bhawan, Tonk Road,", "Jaipur 302015, Rajasthan"],
  addressOneLine: "3rd Floor, Anand Bhawan, Tonk Road, Jaipur 302015, Rajasthan",
  reraNumber: "RAJ/A/12345",
  hours: { weekdays: "Mon–Sat 10:00–19:00 IST", sunday: "By appointment" },
  partnerDesk: { phone: "+91 141 4000 901", tel: "+911414000901", email: "partners@devsia.in" },
  footerDisclaimer:
    "Prices are indicative, exclusive of statutory charges, and subject to change without notice. Project images are representative.",
};

export type NavLink = { label: string; href: string };

/** Header links. The video shows Properties, Insights and About; there is no New projects link. */
export const primaryNav: NavLink[] = [
  { label: "Properties", href: "/properties" },
  { label: "Insights", href: "/insights" },
  { label: "About", href: "/about" },
];

/** Footer "Company" column, as shown in the video. */
export const companyLinks: NavLink[] = [
  { label: "About DevSia", href: "/about" },
  { label: "Services", href: "/about#services" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/about#contact" },
  { label: "Become an associate", href: "/associates" },
];

/** Bottom bar links. In the video all three open the single /legal page. */
export const legalLinks: NavLink[] = [
  { label: "Privacy", href: "/legal" },
  { label: "Terms", href: "/legal#terms" },
  { label: "Disclaimer", href: "/legal" },
];

/** Agency credit shown at the bottom of the common footer (requested by the client). */
export const agencyCredit = {
  prefix: "Design & Managed by",
  name: "Sriva Digital",
  href: "https://srivadigital.com/",
} as const;
