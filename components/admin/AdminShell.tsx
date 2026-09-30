import { logoutAction } from "@/app/admin/actions/auth";
import { Button } from "@/components/ui";
import { ROLE_LABELS, type Role } from "@/lib/auth/capabilities";
import { AdminNav } from "./AdminNav";
import styles from "./admin.module.css";

/** Sidebar and content frame for every signed-in admin page. */
export function AdminShell({ user, children }: { user: { name: string; email: string; role: Role }; children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <AdminNav role={user.role}>
        <div className={styles.userBox}>
          <span className={styles.userName}>{user.name}</span>
          <span className={styles.userMeta}>{user.email}</span>
          <span className={styles.userMeta}>{ROLE_LABELS[user.role]}</span>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm" fullWidth>
              Sign out
            </Button>
          </form>
        </div>
      </AdminNav>
      <main className={styles.content} id="main">
        <div className={styles.inner}>{children}</div>
      </main>
    </div>
  );
}
