import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui";
import { Card, PageHead, formatDateTime } from "@/components/admin/AdminUi";
import styles from "@/components/admin/admin.module.css";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, can } from "@/lib/auth/capabilities";
import { requireUser } from "@/lib/auth/session";
import { recentAudit } from "@/lib/cms/repo/audit";
import { leadCountLastDays } from "@/lib/cms/repo/leads";
import { postCounts } from "@/lib/cms/repo/posts";
import { listUsers } from "@/lib/cms/repo/users";
import { isAuthConfigured, isBlobConfigured, isDatabaseConfigured } from "@/lib/env";

export const metadata = { title: "Dashboard" };

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li>
      <span className={`${styles.dot} ${ok ? styles.dotOk : styles.dotBad}`} aria-hidden="true" />
      {label}: {ok ? "set" : "not set"}
    </li>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [posts, leads, users, audit] = await Promise.all([
    can(user.role, "blogs.manage") ? postCounts() : null,
    can(user.role, "leads.view") ? leadCountLastDays(7) : null,
    can(user.role, "roles.manage") ? listUsers() : null,
    can(user.role, "audit.view") ? recentAudit(8) : null,
  ]);
  return (
    <>
      <PageHead title={`Welcome, ${user.name.split(" ")[0]}`} intro={`${ROLE_LABELS[user.role]}. ${ROLE_DESCRIPTIONS[user.role]}`} />
      <ul className={styles.stats}>
        {posts ? (
          <li className={styles.stat}>
            <div className={styles.statValue}>{posts.published}</div>
            <div className={styles.statLabel}>Published articles ({posts.draft} draft)</div>
          </li>
        ) : null}
        {leads !== null ? (
          <li className={styles.stat}>
            <div className={styles.statValue}>{leads}</div>
            <div className={styles.statLabel}>Enquiries in the last 7 days</div>
          </li>
        ) : null}
        {users ? (
          <li className={styles.stat}>
            <div className={styles.statValue}>{users.filter((u) => u.active).length}</div>
            <div className={styles.statLabel}>Active staff accounts</div>
          </li>
        ) : null}
      </ul>
      {can(user.role, "settings.manage") ? (
        <Card title="Server settings" help="Whether each setting exists on the server. The values themselves are never shown.">
          <ul className={styles.status}>
            <Flag ok={isDatabaseConfigured()} label="MONGODB_URI" />
            <Flag ok={isAuthConfigured()} label="AUTH_SECRET" />
            <Flag ok={isBlobConfigured()} label="BLOB_READ_WRITE_TOKEN (uploads)" />
          </ul>
          <p className={styles.hintLine}>The CRM (PropDesk) is not connected yet. Property listings and lead delivery use local sample providers.</p>
        </Card>
      ) : null}
      {audit ? (
        <Card title="Recent activity">
          {audit.length === 0 ? (
            <p className={styles.muted}>Nothing has been recorded yet.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
              {audit.map((a) => (
                <li key={a.id} className={styles.small}>
                  <span className={styles.muted}>{formatDateTime(a.at)}</span> · {a.actorEmail || "system"} · {a.summary}
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/audit">
            Open the audit log <ArrowRightIcon size={14} />
          </Link>
        </Card>
      ) : null}
    </>
  );
}
