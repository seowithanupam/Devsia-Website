/**
 * Session version.
 *
 * Each user has a number that goes up whenever their password is changed or reset. A sign-in copies it into the
 * session token. On every admin request the token's number is compared with the database's, so every session
 * that was issued before the change stops working at once. The 8-hour lifetime is unchanged.
 *
 * Sessions created before this feature existed carry no number; they count as version 0, which is what every
 * account starts at, so nobody is signed out by the upgrade itself.
 */
export function isSessionCurrent(tokenVersion: number | null | undefined, currentVersion: number | null | undefined): boolean {
  return (tokenVersion ?? 0) === (currentVersion ?? 0);
}
