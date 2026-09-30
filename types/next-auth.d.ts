import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/auth/capabilities";

declare module "next-auth" {
  interface User {
    role?: Role;
    sessionVersion?: number;
  }
  interface Session {
    /** sessionVersion is missing on sessions issued before the feature existed; that counts as 0. */
    user: { id: string; role: Role; sessionVersion?: number } & DefaultSession["user"];
  }
}

// In Auth.js v5 the JWT interface is declared in @auth/core; "next-auth/jwt" only re-exports it, and augmenting a
// re-export does not change the original interface. Augment the module that declares it.
declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string;
    role?: Role;
    sv?: number;
  }
}
