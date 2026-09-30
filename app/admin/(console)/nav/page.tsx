import { saveNavigationAction } from "@/app/admin/actions/nav";
import { Notice, PageHead } from "@/components/admin/AdminUi";
import { NavEditor } from "@/components/admin/NavEditor";
import { requireCapability } from "@/lib/auth/session";
import { navigationFromRecord } from "@/lib/cms/nav";
import { getNavigationRecord } from "@/lib/cms/repo/content";

export const metadata = { title: "Navigation" };

export default async function NavAdmin() {
  await requireCapability("nav.manage");
  const nav = navigationFromRecord(await getNavigationRecord());
  return (
    <>
      <PageHead title="Navigation" intro="The header menu, the footer's company column and the links along the bottom of the footer." />
      <Notice>The footer&apos;s Properties and Localities columns are automatic: they list the property types and areas that have live listings, so they are not edited here.</Notice>
      <NavEditor initial={nav} action={saveNavigationAction} />
    </>
  );
}
