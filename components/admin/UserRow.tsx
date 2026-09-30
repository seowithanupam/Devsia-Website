import { resetUserPasswordAction, updateUserAccessAction } from "@/app/admin/actions/users";
import { Badge } from "@/components/ui";
import { ROLES, ROLE_LABELS } from "@/lib/auth/capabilities";
import type { UserRecord } from "@/lib/cms/types";
import { ACheck, AField, ASelect, AdminForm } from "./AdminForm";
import { formatDateTime } from "./AdminUi";
import styles from "./admin.module.css";

/** One staff account: change role and access, or set a temporary password. Only super admins ever see this. */
export function UserRow({ user, isSelf }: { user: UserRecord; isSelf: boolean }) {
  return (
    <section className={styles.card}>
      <div className={styles.actions} style={{ justifyContent: "space-between" }}>
        <div>
          <h2 className={styles.cardTitle}>
            {user.name} {isSelf ? <Badge tone="outline">You</Badge> : null}
          </h2>
          <p className={`${styles.muted} ${styles.small}`} style={{ margin: 0 }}>
            {user.email} · last sign-in {formatDateTime(user.lastLoginAt)}
            {user.mustChangePassword ? " · must change password" : ""}
          </p>
        </div>
        {user.active ? <Badge tone="ok">Active</Badge> : <Badge tone="red">Deactivated</Badge>}
      </div>
      <AdminForm action={updateUserAccessAction} submitLabel="Save access">
        <input type="hidden" name="id" value={user.id} />
        <div className={styles.grid2}>
          <ASelect name="role" label="Role" defaultValue={user.role} options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
          <ACheck name="active" label="Account is active (can sign in)" defaultChecked={user.active} />
        </div>
        {isSelf ? <p className={styles.hintLine}>You cannot change your own role or deactivate yourself. Ask another super admin.</p> : null}
      </AdminForm>
      <details>
        <summary className={styles.hintLine} style={{ cursor: "pointer" }}>
          Set a temporary password
        </summary>
        <div style={{ marginTop: 10 }}>
          <AdminForm action={resetUserPasswordAction} submitLabel="Set temporary password">
            <input type="hidden" name="id" value={user.id} />
            <AField name="password" label="Temporary password" type="password" autoComplete="new-password" hint="They must choose their own at next sign-in. Share this one in person or by phone, not by email." />
          </AdminForm>
        </div>
      </details>
    </section>
  );
}
