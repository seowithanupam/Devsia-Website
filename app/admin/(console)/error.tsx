"use client";

import { Button } from "@/components/ui";
import { Notice, PageHead } from "@/components/admin/AdminUi";

/** Shown when an admin page cannot load (for example the database is unreachable). No technical details are shown. */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <PageHead title="Something went wrong" />
      <Notice tone="error">This page could not be loaded. The database may be unreachable. Nothing was changed.</Notice>
      <Button onClick={reset}>Try again</Button>
    </>
  );
}
