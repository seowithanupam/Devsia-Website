import type { Metadata } from "next";
import type { ReactNode } from "react";

// The admin panel is private: never indexed, and never cached.
export const metadata: Metadata = { title: { default: "Admin", template: "%s · DevSia Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
