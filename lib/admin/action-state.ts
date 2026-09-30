/** What every admin server action returns to its form. */
export type ActionState = {
  ok: boolean;
  /** A short message to show above the form. */
  message?: string;
  /** Field errors keyed by field name (or dotted path for lists). */
  errors?: Record<string, string>;
};

export const idleState: ActionState = { ok: false };
