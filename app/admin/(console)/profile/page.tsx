import { changePasswordAction, updateProfileAction } from "@/app/admin/actions/profile";
import { AField, AdminForm } from "@/components/admin/AdminForm";
import { Card, Notice, PageHead } from "@/components/admin/AdminUi";
import { ROLE_LABELS } from "@/lib/auth/capabilities";
import { requireUser } from "@/lib/auth/session";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  // The only admin page a person with a temporary password may open.
  const user = await requireUser({ allowPasswordChange: true });
  return (
    <>
      <PageHead title="Your profile" intro={`${user.email} · ${ROLE_LABELS[user.role]}`} />
      {user.mustChangePassword ? <Notice tone="warn">You are using a temporary password. Choose your own below before you do anything else.</Notice> : null}
      <Card title="Your name">
        <AdminForm action={updateProfileAction} submitLabel="Save name">
          <AField name="name" label="Name" required defaultValue={user.name} maxLength={80} />
        </AdminForm>
      </Card>
      <Card title="Change your password" help="At least 10 characters, with a letter and a number, and not based on your email.">
        <AdminForm action={changePasswordAction} submitLabel="Change password">
          <AField name="currentPassword" label="Current password" type="password" required autoComplete="current-password" />
          <AField name="newPassword" label="New password" type="password" required autoComplete="new-password" />
          <AField name="confirmPassword" label="Repeat the new password" type="password" required autoComplete="new-password" />
        </AdminForm>
      </Card>
    </>
  );
}
