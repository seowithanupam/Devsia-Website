import { createUserAction } from "@/app/admin/actions/users";
import { AField, ASelect, AdminForm } from "@/components/admin/AdminForm";
import { Card, PageHead } from "@/components/admin/AdminUi";
import { UserRow } from "@/components/admin/UserRow";
import styles from "@/components/admin/admin.module.css";
import { CAPABILITIES, ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, can } from "@/lib/auth/capabilities";
import { requireCapability } from "@/lib/auth/session";
import { listUsers } from "@/lib/cms/repo/users";

export const metadata = { title: "Roles and users" };

export default async function RolesAdmin() {
  const me = await requireCapability("roles.manage");
  const users = await listUsers();
  return (
    <>
      <PageHead title="Roles and users" intro="Staff accounts and what each role can do. Only super admins can open this page." />
      <Card title="What each role can do">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Capability</th>
                {ROLES.map((r) => (
                  <th key={r}>{ROLE_LABELS[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAPABILITIES.map((c) => (
                <tr key={c}>
                  <td className={styles.mono}>{c}</td>
                  {ROLES.map((r) => (
                    <td key={r}>{can(r, c) ? "Yes" : "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className={styles.hintLine} style={{ margin: 0, paddingLeft: 18 }}>
          {ROLES.map((r) => (
            <li key={r}>
              <strong>{ROLE_LABELS[r]}:</strong> {ROLE_DESCRIPTIONS[r]}
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Add a staff account" help="The new person signs in with the temporary password you set and must choose their own straight away.">
        <AdminForm action={createUserAction} submitLabel="Create account">
          <div className={styles.grid2}>
            <AField name="name" label="Name" required />
            <AField name="email" label="Email" type="email" required autoComplete="off" />
            <ASelect name="role" label="Role" defaultValue="content_editor" options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
            <AField name="password" label="Temporary password" type="password" required autoComplete="new-password" hint="At least 10 characters, with a letter and a number." />
          </div>
        </AdminForm>
      </Card>
      {users.map((u) => (
        <UserRow key={u.id} user={u} isSelf={u.id === me.id} />
      ))}
    </>
  );
}
