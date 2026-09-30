import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeCredentials } from "@/lib/auth/authorize";
import { isRole } from "@/lib/auth/capabilities";

/**
 * Auth.js configuration for the admin panel (email + password, signed session cookie).
 *
 * - The secret is AUTH_SECRET, read by Auth.js on the server. It is never sent to the browser.
 * - Sessions are JWTs that last 8 hours. PROPOSAL: the original session length was not recorded.
 * - The token carries the user id and the user's "session version". The role, the active flag and the version are
 *   re-read from the database on every admin request (lib/auth/session.ts), so a role change, a deactivation or a
 *   password change takes effect immediately for sessions issued earlier.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials, request) => {
        const user = await authorizeCredentials(credentials, request);
        return user ? { id: user.id, name: user.name, email: user.email, role: user.role, sessionVersion: user.sessionVersion } : null;
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  callbacks: {
    jwt({ token, user }) {
      // Only a real sign-in (where `user` is present) writes these. Session "update" calls are ignored on purpose, so a
      // client can never raise its own session version.
      if (user) {
        token.uid = user.id;
        token.role = user.role;
        token.sv = user.sessionVersion ?? 0;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.uid === "string") session.user.id = token.uid;
      if (isRole(token.role)) session.user.role = token.role;
      if (typeof token.sv === "number") session.user.sessionVersion = token.sv;
      return session;
    },
  },
});
