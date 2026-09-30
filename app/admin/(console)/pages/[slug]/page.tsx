import { notFound } from "next/navigation";
import { resetPageAction, savePageAction } from "@/app/admin/actions/pages";
import { AdminForm } from "@/components/admin/AdminForm";
import { Card, Notice, PageHead } from "@/components/admin/AdminUi";
import { BlockEditor, type EditorBlock } from "@/components/admin/BlockEditor";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { ButtonLink } from "@/components/ui";
import { PAGE_DEFS, isPageSlug, resolveBlocks } from "@/lib/cms/blocks";
import { getPage } from "@/lib/cms/repo/content";
import { loadMediaOptions } from "@/lib/admin/media-options";
import { requireCapability } from "@/lib/auth/session";

export const metadata = { title: "Edit page" };

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireCapability("pages.manage");
  const { slug } = await params;
  if (!isPageSlug(slug) || PAGE_DEFS[slug].allowed.length === 0) notFound();
  const def = PAGE_DEFS[slug];
  const stored = await getPage(slug);

  // Show every stored block, including hidden ones, in order. With nothing stored, show the built-in blocks.
  const defaults = resolveBlocks(slug, null);
  const fromStore: EditorBlock[] = [...(stored?.blocks ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((b) => ({ type: b.type, enabled: b.enabled, data: { ...(defaults.find((d) => d.type === b.type)?.data ?? {}), ...b.data } }));
  // A page saved before one of its required blocks existed opens with that block added, using its built-in text.
  const missingRequired: EditorBlock[] = def.required
    .filter((type) => !fromStore.some((b) => b.type === type))
    .map((type) => ({ type, enabled: true, data: defaults.find((d) => d.type === type)?.data ?? {} }));
  const initial: EditorBlock[] = fromStore.length > 0 ? [...fromStore, ...missingRequired] : defaults.map((b) => ({ type: b.type, enabled: true, data: b.data }));

  const media = await loadMediaOptions();
  return (
    <>
      <PageHead
        title={`Edit: ${def.title}`}
        intro="Changes go live as soon as you save."
        actions={
          <ButtonLink href={def.path} variant="outline" size="sm" target="_blank" rel="noopener noreferrer">
            View the page ↗
          </ButtonLink>
        }
      />
      {slug === "home" ? <Notice tone="warn">The trust strip, upcoming projects, customer quote and credentials are unverified placeholders carried over from the original site. Replace or remove anything that is not true before launch.</Notice> : null}
      <BlockEditor slug={slug} initial={initial} action={savePageAction} media={media} />
      <Card title="Reset this page" help="Puts every block back to the built-in text this site shipped with. Search settings are kept.">
        <AdminForm action={resetPageAction} hideSubmit>
          <input type="hidden" name="slug" value={slug} />
          <div>
            <ConfirmSubmit variant="outline" message="Reset this page to the built-in content? Your edits to its blocks will be lost.">
              Reset to built-in content
            </ConfirmSubmit>
          </div>
        </AdminForm>
      </Card>
    </>
  );
}
