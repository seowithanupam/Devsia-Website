import { notFound } from "next/navigation";
import { UpcomingProjects } from "@/components/home/HomeSections";
import { getContentProvider } from "@/lib/content";
import { blockData, type CopyData } from "@/lib/cms/blocks";
import { getPageBlocks, getPageSeo } from "@/lib/cms/public";
import { upcomingCopy } from "@/lib/content/pages";
import { NEW_PROJECTS_LIVE } from "@/lib/config/features";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  return buildMetadata({
    title: "New projects in Jaipur",
    description: "Pre-launch and upcoming projects in Jaipur.",
    path: "/new-projects",
    seo: await getPageSeo("new-projects"),
  });
}

export const dynamic = "force-dynamic";

/**
 * The handover says this route returns 404 until PropDesk has an endpoint for pre-launch inventory.
 * That behaviour is kept: while NEW_PROJECTS_LIVE (lib/config/features.ts) is false the route is a 404.
 * The page UI below is complete and uses the ContentProvider, so switching the flag on and pointing
 * the provider at the CRM is all that is needed. No project data is invented here.
 */
export default async function NewProjectsPage() {
  if (!NEW_PROJECTS_LIVE) notFound();
  const [projects, blocks] = await Promise.all([getContentProvider().getUpcomingProjects(), getPageBlocks("new-projects")]);
  const copy = blockData<CopyData>(blocks, "new-projects-hero") ?? upcomingCopy;
  return <UpcomingProjects projects={projects} copy={copy} headingAs="h1" />;
}
