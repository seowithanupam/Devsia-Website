import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { Notice, PageHead } from "@/components/admin/AdminUi";
import { PostEditor } from "@/components/admin/PostEditor";
import { loadMediaOptions } from "@/lib/admin/media-options";
import { requireCapability } from "@/lib/auth/session";
import { getPost } from "@/lib/cms/repo/posts";

export const metadata = { title: "Edit post" };

export default async function EditPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireCapability("blogs.manage");
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();
  const query = await searchParams;
  return (
    <>
      <PageHead title={post.title} actions={post.status === "published" ? <Badge tone="ok">Published</Badge> : <Badge tone="outline">Draft</Badge>} />
      {query.saved ? <Notice tone="ok">Post created.</Notice> : null}
      <PostEditor post={post} media={await loadMediaOptions()} />
    </>
  );
}
