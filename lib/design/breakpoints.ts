/**
 * Breakpoints from the original design artifact.
 *
 * Desktop is 1200px and up, tablet is 810px to 1199px, mobile is 809px and below.
 * CSS cannot read these from variables inside media queries, so the same literal
 * values appear in styles/ and in each component's CSS Module. Keep them in sync.
 */
export const BREAKPOINTS = {
  /** Largest viewport width still treated as tablet or smaller. */
  tabletMax: 1199,
  /** Largest viewport width treated as mobile. */
  mobileMax: 809,
} as const;

export const MEDIA_QUERIES = {
  tabletAndBelow: `(max-width: ${BREAKPOINTS.tabletMax}px)`,
  mobile: `(max-width: ${BREAKPOINTS.mobileMax}px)`,
} as const;
