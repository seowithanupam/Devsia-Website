import { redirect } from "next/navigation";
import { loginAction } from "@/app/admin/actions/auth";
import { AField, AdminForm } from "@/components/admin/AdminForm";
import { Notice } from "@/components/admin/AdminUi";
import styles from "@/components/admin/admin.module.css";
import { getCurrentUser } from "@/lib/auth/session";
import { isAuthConfigured, isDatabaseConfigured } from "@/lib/env";

export const metadata = { title: "Sign in" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const ready = isDatabaseConfigured() && isAuthConfigured();
  if (ready && (await getCurrentUser())) redirect("/admin");
  const next = typeof params.next === "string" ? params.next : "";
  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <div>
          <span className={styles.brand} style={{ padding: 0 }}>
            DevSia <span className={styles.brandTag}>Admin</span>
          </span>
          <p className={styles.pageIntro}>Sign in with your staff account.</p>
        </div>
        {params.changed ? <Notice tone="ok">Your password was changed and you were signed out everywhere. Sign in with the new password.</Notice> : null}
        {ready ? null : <Notice tone="warn">Admin sign-in is not set up yet. MONGODB_URI and AUTH_SECRET must be set on the server (see .env.example).</Notice>}
        <AdminForm action={loginAction} submitLabel="Sign in">
          <input type="hidden" name="next" value={next} />
          <AField name="email" label="Email" type="email" required autoComplete="username" />
          <AField name="password" label="Password" type="password" required autoComplete="current-password" />
        </AdminForm>
      </div>
    </div>
  );
}
