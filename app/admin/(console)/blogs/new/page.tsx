import { PostEditor } from "@/components/admin/PostEditor";
import { PageHead } from "@/components/admin/AdminUi";
import { loadMediaOptions } from "@/lib/admin/media-options";
import { requireCapability } from "@/lib/auth/session";

export const metadata = { title: "New post" };

export default async function NewPost() {
  await requireCapability("blogs.manage");
  return (
    <>
      <PageHead title="New post" />
      <PostEditor post={null} media={await loadMediaOptions()} />
    </>
  );
}
