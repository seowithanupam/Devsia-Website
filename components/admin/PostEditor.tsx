import Link from "next/link";
import { deletePostAction, savePostAction } from "@/app/admin/actions/posts";
import { Button } from "@/components/ui";
import type { PostRecord } from "@/lib/cms/types";
import { AArea, ACheck, AdminForm, AField } from "./AdminForm";
import { Card } from "./AdminUi";
import { ConfirmSubmit } from "./ConfirmSubmit";
import { ImageField } from "./ImageField";
import type { MediaOption } from "./MediaPicker";
import { SeoFieldset } from "./SeoFieldset";
import styles from "./admin.module.css";

const SYNTAX = `## Heading            a section heading
Plain text.           paragraphs are separated by a blank line
- item                a bullet list
> quote               a pull quote
1. Title :: text     numbered steps
!note Title :: text   a highlighted note
Table: caption
| A | B |
| --- | --- |
| 1 | 2 |`;

/** Create or edit an insights article. Buttons: Save, Publish / Move to draft, and Delete. */
export function PostEditor({ post, media }: { post: PostRecord | null; media: MediaOption[] }) {
  const published = post?.status === "published";
  return (
    <>
      <AdminForm action={savePostAction} hideSubmit>
        {post ? <input type="hidden" name="id" value={post.id} /> : null}
        <Card title="Article">
          <AField name="title" label="Title" required defaultValue={post?.title} maxLength={160} />
          <AField name="slug" label="Web address (slug)" defaultValue={post?.slug} hint="Lowercase words joined by dashes. Leave blank on a new post to make it from the title. Changing it breaks old links." />
          <AArea name="excerpt" label="Summary" required rows={3} defaultValue={post?.excerpt} hint="Shown on cards and in search results." />
        </Card>
        <Card title="Article text" help="Written in plain text with a few simple marks (see the guide below). It is shown on the site as text, never as raw HTML.">
          <AArea name="body" label="Text" required rows={24} mono defaultValue={post?.body} />
          <details>
            <summary className={styles.hintLine} style={{ cursor: "pointer" }}>
              Formatting guide
            </summary>
            <pre className={styles.codeArea} style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
              {SYNTAX}
            </pre>
          </details>
          <ACheck name="placeholderBody" label="This text is a stand-in (shows a notice that the full article is still to come)" defaultChecked={post?.placeholderBody} />
        </Card>
        <Card title="Details">
          <div className={styles.grid2}>
            <AField name="category" label="Category" required defaultValue={post?.category} hint="For example: Market note, Buyer guide. Used for the filter chips." />
            <AField name="tags" label="Tags" defaultValue={post?.tags.join(", ")} hint="Separate with commas. Up to 8." />
          </div>
          <div className={styles.grid2}>
            <AField name="authorName" label="Author" required defaultValue={post?.authorName} />
            <AField name="authorRole" label="Author role (optional)" defaultValue={post?.authorRole} />
          </div>
          <div className={styles.grid2}>
            <AField name="publishedDate" label="Publish date" defaultValue={post?.publishedAt?.slice(0, 10)} placeholder="YYYY-MM-DD" hint="Leave blank to use today when you publish. A future date keeps the article hidden until then." />
            <AField name="readMinutes" label="Reading time in minutes (optional)" defaultValue={post?.readMinutes ? String(post.readMinutes) : ""} hint="Leave blank to work it out from the length." />
          </div>
          <ACheck name="featured" label="Featured article (shown large at the top of Insights; only one at a time)" defaultChecked={post?.featured} />
        </Card>
        <Card title="Cover image">
          <ImageField name="coverUrl" label="Image" defaultValue={post?.coverUrl} media={media} altName="coverAlt" />
          <AField name="coverAlt" label="Image description" defaultValue={post?.coverAlt} hint="Describe the image for people who cannot see it. Required when there is an image." />
          <AField name="coverCaption" label="Caption (optional)" defaultValue={post?.coverCaption} />
        </Card>
        <Card title="Search and sharing (SEO)">
          <SeoFieldset prefix="seo." defaults={post?.seo ?? {}} media={media} />
        </Card>
        <div className={styles.formBar}>
          <Button type="submit" name="intent" value="save">
            {post ? "Save" : "Save as draft"}
          </Button>
          {published ? (
            <Button type="submit" name="intent" value="unpublish" variant="outline">
              Move back to draft
            </Button>
          ) : (
            <Button type="submit" name="intent" value="publish" variant="red">
              Publish
            </Button>
          )}
          {published && post ? (
            <Link href={`/insights/${post.slug}`} target="_blank" rel="noopener noreferrer">
              View on the site ↗
            </Link>
          ) : null}
        </div>
      </AdminForm>
      {post ? (
        <Card title="Delete this article">
          <AdminForm action={deletePostAction} hideSubmit>
            <input type="hidden" name="id" value={post.id} />
            <p className={styles.cardHelp}>Deleting removes it for good. To hide it without deleting, use “Move back to draft”.</p>
            <div>
              <ConfirmSubmit variant="outline" message="Delete this article permanently? This cannot be undone.">
                Delete article
              </ConfirmSubmit>
            </div>
          </AdminForm>
        </Card>
      ) : null}
    </>
  );
}
