import { ButtonLink } from "@/components/ui";
import { Notice, PageHead } from "@/components/admin/AdminUi";
import { requireUser } from "@/lib/auth/session";

export const metadata = { title: "No access" };

export default async function ForbiddenPage() {
  await requireUser();
  return (
    <>
      <PageHead title="You do not have access to that page" />
      <Notice tone="warn">Your role does not include this section. If you need it, ask a super admin.</Notice>
      <ButtonLink href="/admin">Back to the dashboard</ButtonLink>
    </>
  );
}
