/**
 * Feature flags.
 *
 * NEW_PROJECTS_LIVE: the handover says /new-projects returns 404 until PropDesk has
 * an endpoint for pre-launch inventory ("flip one flag in the route file"). No such
 * endpoint is documented in the vendor PDF, so the flag stays false. The page, its
 * components and the mock provider are fully built so it can be switched on later.
 */
export const NEW_PROJECTS_LIVE = false as boolean;
