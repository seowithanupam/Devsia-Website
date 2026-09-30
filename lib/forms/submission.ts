import { checkSpam } from "./spam";
import type {
  AssociateInput,
  ContactRequestInput,
  EnquiryInput,
  FieldErrors,
  LeadProvider,
  SubmissionMeta,
  ValidationResult,
} from "./types";
import { validateAssociate, validateContactRequest, validateEnquiry } from "./validation";

/**
 * Server-side handling shared by the route handlers and server actions. It validates,
 * applies spam protection, then calls the provider. Written as plain functions with
 * injected dependencies so it can be tested without Next.js.
 */

export type HandlerResult =
  | { status: 200; body: { ok: true } }
  | { status: 422; body: { ok: false; errors: FieldErrors } }
  | { status: 502; body: { ok: false; error: string } };

export type HandlerDeps = { provider: LeadProvider; now?: () => number };

type Envelope = { honeypot?: unknown; formStartedAt?: unknown; pageEnquired?: unknown };

function envelopeOf(body: unknown): Envelope {
  if (typeof body !== "object" || body === null) return {};
  const raw = body as Record<string, unknown>;
  return { honeypot: raw.website_url, formStartedAt: raw.formStartedAt, pageEnquired: raw.pageEnquired };
}

function metaOf(envelope: Envelope): SubmissionMeta {
  return typeof envelope.pageEnquired === "string" && envelope.pageEnquired !== ""
    ? { pageEnquired: envelope.pageEnquired.slice(0, 300) }
    : {};
}

const UNAVAILABLE_MESSAGE = "We could not send this right now. Please call the advisory desk instead.";

async function run<T>(
  body: unknown,
  deps: HandlerDeps,
  validate: (b: unknown) => ValidationResult<T>,
  send: (value: T, meta: SubmissionMeta) => Promise<{ ok: boolean }>,
): Promise<HandlerResult> {
  const now = (deps.now ?? Date.now)();
  const envelope = envelopeOf(body);

  // Validate first so real visitors always see field errors.
  const validation = validate(body);
  if (!validation.ok) return { status: 422, body: { ok: false, errors: validation.errors } };

  // Bots are discarded silently: they get the same success response and nothing is sent.
  if (checkSpam({ honeypot: envelope.honeypot, formStartedAt: envelope.formStartedAt, now }).suspicious) {
    return { status: 200, body: { ok: true } };
  }

  try {
    const result = await send(validation.value, metaOf(envelope));
    if (!result.ok) return { status: 502, body: { ok: false, error: UNAVAILABLE_MESSAGE } };
    return { status: 200, body: { ok: true } };
  } catch {
    return { status: 502, body: { ok: false, error: UNAVAILABLE_MESSAGE } };
  }
}

export function processEnquiry(body: unknown, deps: HandlerDeps): Promise<HandlerResult> {
  return run<EnquiryInput>(body, deps, validateEnquiry, (v, m) => deps.provider.submitLead(v, m));
}

export function processAssociate(body: unknown, deps: HandlerDeps): Promise<HandlerResult> {
  return run<AssociateInput>(body, deps, validateAssociate, (v, m) => deps.provider.registerAssociate(v, m));
}

export function processContactRequest(body: unknown, deps: HandlerDeps): Promise<HandlerResult> {
  return run<ContactRequestInput>(body, deps, validateContactRequest, (v, m) => deps.provider.submitContactRequest(v, m));
}
