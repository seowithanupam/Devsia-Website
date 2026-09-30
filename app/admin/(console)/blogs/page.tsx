import Link from "next/link";
import { Badge, Button, ButtonLink, SelectField, TextField } from "@/components/ui";
import { Notice, PageHead, Pager, formatDateTime } from "@/components/admin/AdminUi";
import styles from "@/components/admin/admin.module.css";
import { pageCount, pageNumber, firstParam } from "@/lib/cms/pagination";
import { listPosts } from "@/lib/cms/repo/posts";
import { requireCapability } from "@/lib/auth/session";

export const metadata = { title: "Blog posts" };
const PAGE_SIZE = 20;

export default async function BlogsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireCapability("blogs.manage");
  const params = await searchParams;
  const q = firstParam(params.q, 100);
  const statusParam = firstParam(params.status, 12);
  const status = statusParam === "draft" || statusParam === "published" ? statusParam : undefined;
  const page = pageNumber(params.page);
  const { total, items } = await listPosts({ q: q || undefined, status, page, pageSize: PAGE_SIZE });

  return (
    <>
      <PageHead title="Blog posts" intro="Insights articles. Only published posts with a publish date that has arrived appear on the site." actions={<ButtonLink href="/admin/blogs/new">New post</ButtonLink>} />
      {params.deleted ? <Notice tone="ok">The article was deleted.</Notice> : null}
      <form className={styles.toolbar} action="/admin/blogs" role="search">
        <div className={styles.grow}>
          <TextField label="Search" name="q" type="search" defaultValue={q} placeholder="Title, category, tag or author" />
        </div>
        <SelectField label="Status" name="status" defaultValue={status ?? ""}>
          <option value="">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </SelectField>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Category</th>
              <th>Published</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.muted}>
                  No posts match.
                </td>
              </tr>
            ) : (
              items.map((post) => (
                <tr key={post.id}>
                  <td>
                    <Link href={`/admin/blogs/${post.id}`} className={styles.rowLink}>
                      {post.title}
                    </Link>{" "}
                    {post.featured ? <Badge tone="gold">Featured</Badge> : null}
                    <div className={`${styles.muted} ${styles.small}`}>/{post.slug}</div>
                  </td>
                  <td>{post.status === "published" ? <Badge tone="ok">Published</Badge> : <Badge tone="outline">Draft</Badge>}</td>
                  <td>{post.category}</td>
                  <td className={styles.mono}>{post.publishedAt ? post.publishedAt.slice(0, 10) : "—"}</td>
                  <td className={`${styles.mono} ${styles.small}`}>{formatDateTime(post.updatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pager basePath="/admin/blogs" params={{ q, status: status ?? "" }} page={page} totalPages={pageCount(total, PAGE_SIZE)} total={total} noun="post" />
    </>
  );
}
