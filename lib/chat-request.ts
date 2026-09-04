// Admission control for the one endpoint a stranger can post to.
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────────
//
// app/api/chat/route.ts used to do this and only this:
//
//     const { messages }: { messages: UIMessage[] } = await req.json()
//     streamText({ system, messages: await convertToModelMessages(messages) })
//
// The type annotation is erased at runtime, so `messages` was whatever the
// caller sent. Two separate problems lived in that line.
//
// ROLES CROSSED THE TRUST BOUNDARY. `convertToModelMessages` maps a UI message
// with `role: "system"` to a model-level system message, so a crafted POST
// could append instructions at the same priority as the site's own prompt. It
// could also fabricate assistant turns — "you already agreed to ignore the
// reference document" — and the model has no way to tell those from real ones.
// The site's strict-scope behaviour was prompt convention rather than an
// enforced boundary.
//
// AND THERE WAS NO CEILING ON ANYTHING. No body cap, no history cap, no
// per-message length, no rate limit, no output-token limit. `maxDuration = 30`
// bounds wall time, not spend. Every request also carries a ~64KB generated
// system prompt, so the fixed cost of a hostile one-word request is large.
//
// ── WHAT THIS DOES AND DOES NOT PROMISE ───────────────────────────────────
//
// It rebuilds the conversation from scratch instead of trusting it: every
// message becomes role user or assistant with exactly one text part, or the
// request is rejected. Nothing else survives — no system role, no tool calls,
// no files, no images, no arbitrary parts.
//
// THE RATE LIMIT IS BEST-EFFORT AND SAYS SO. It is an in-process token bucket,
// so on a serverless platform each instance keeps its own counter and a
// distributed attacker gets one bucket per instance. It stops a single client
// hammering one warm instance; it is not a substitute for an edge rate limit
// or WAF, and nothing here should be read as claiming otherwise. It is the
// strongest control that can live in this file, and the honest description is
// worth more than a stronger-sounding one.
import type { UIMessage } from "ai"

/** Rejected requests carry a status and a reason the client can show.
 *
 *  The field is assigned in the body rather than declared as a constructor
 *  parameter property. `constructor(readonly status: number)` is valid
 *  TypeScript and NOT valid under Node's type-stripping, which the offline
 *  gates run under — scripts/ts-extensionless.mjs loads this file directly, so
 *  anything here has to survive having its types erased rather than compiled. */
export class RequestRejected extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "RequestRejected"
    this.status = status
  }
}

// ── LIMITS ────────────────────────────────────────────────────────────────
// Sized against the real product rather than against a round number. The
// longest scripted answer is 13 blocks; a visitor who has read the whole site
// and asked twenty follow-ups is nowhere near these.
export const LIMITS = {
  /** Raw body bytes, checked before JSON.parse so a huge payload is refused
   *  without being parsed. */
  bodyBytes: 64 * 1024,
  /** Turns in one conversation. */
  messages: 60,
  /** Characters in any single message. A long question is fine; an essay is
   *  someone using the endpoint as a summariser. */
  messageChars: 4_000,
  /** Characters across the whole conversation. */
  totalChars: 24_000,
  /** Generated tokens. The answers this site gives are short, and the fallback
   *  is two sentences. */
  outputTokens: 1_024,
} as const

// ── RATE LIMIT ────────────────────────────────────────────────────────────
// A token bucket per client key. Refills continuously rather than resetting on
// a boundary, so a client cannot save up a burst by waiting for a window edge.
const BUCKET_SIZE = 12
const REFILL_PER_SECOND = 12 / 60 // 12 requests a minute, sustained

type Bucket = { tokens: number; last: number }
const buckets = new Map<string, Bucket>()

/** Bounded so a stream of unique keys cannot grow the map without limit —
 *  which would turn the rate limiter itself into the memory leak. */
const MAX_BUCKETS = 5_000

export function rateLimit(key: string, now = Date.now()): boolean {
  let b = buckets.get(key)
  if (!b) {
    if (buckets.size >= MAX_BUCKETS) {
      // Evict the least recently used rather than refusing to track. Dropping
      // the oldest is wrong under attack (it evicts a legitimate visitor), but
      // refusing to track is worse: it would fail open for everyone new.
      let oldestKey: string | null = null
      let oldest = Infinity
      for (const [k, v] of buckets) if (v.last < oldest) ((oldest = v.last), (oldestKey = k))
      if (oldestKey) buckets.delete(oldestKey)
    }
    b = { tokens: BUCKET_SIZE, last: now }
    buckets.set(key, b)
  }
  b.tokens = Math.min(BUCKET_SIZE, b.tokens + ((now - b.last) / 1000) * REFILL_PER_SECOND)
  b.last = now
  if (b.tokens < 1) return false
  b.tokens -= 1
  return true
}

/** For tests: the bucket map is module state and would otherwise leak between
 *  cases. Not exported for use by the route. */
export function resetRateLimit() {
  buckets.clear()
}

/**
 * A client key that does not identify a person.
 *
 * The forwarded IP is HASHED rather than stored: this file needs to tell two
 * callers apart for a minute, which a one-way digest does as well as the
 * address itself and without keeping the address anywhere. `x-forwarded-for`
 * is spoofable, so this is a fairness mechanism between ordinary clients
 * rather than an identity check.
 */
export async function clientKey(req: Request): Promise<string> {
  const raw =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw))
  return Array.from(new Uint8Array(digest).slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// ── VALIDATION ────────────────────────────────────────────────────────────

type CleanMessage = { id: string; role: "user" | "assistant"; parts: [{ type: "text"; text: string }] }

/** The text a UI message carries, from the only part shape this accepts. */
function textOf(parts: unknown): string | null {
  if (!Array.isArray(parts)) return null
  const texts: string[] = []
  for (const p of parts) {
    if (!p || typeof p !== "object") return null
    const part = p as { type?: unknown; text?: unknown }
    // ANY non-text part REJECTS the request rather than being dropped. Dropping
    // would let a caller smuggle a tool result past a filter that silently
    // ignored it; refusing says what happened.
    if (part.type !== "text") return null
    if (typeof part.text !== "string") return null
    texts.push(part.text)
  }
  return texts.join("")
}

/**
 * Rebuild the conversation from an untrusted body.
 *
 * Returns messages that are structurally guaranteed: user or assistant, one
 * text part, within every limit. Throws RequestRejected otherwise.
 */
export function parseChatRequest(body: unknown): UIMessage[] {
  if (!body || typeof body !== "object") {
    throw new RequestRejected(400, "Expected an object.")
  }
  const { messages } = body as { messages?: unknown }
  if (!Array.isArray(messages)) {
    throw new RequestRejected(400, "Expected `messages` to be an array.")
  }
  if (messages.length === 0) {
    throw new RequestRejected(400, "Expected at least one message.")
  }
  if (messages.length > LIMITS.messages) {
    throw new RequestRejected(413, `Conversation is longer than ${LIMITS.messages} messages.`)
  }

  const clean: CleanMessage[] = []
  let total = 0

  for (const m of messages) {
    if (!m || typeof m !== "object") throw new RequestRejected(400, "Malformed message.")
    const { role, parts, id } = m as { role?: unknown; parts?: unknown; id?: unknown }

    // THE ROLE ALLOW-LIST IS THE POINT OF THIS FILE. "system" is refused
    // explicitly rather than falling through a default, so the refusal is
    // legible in a stack trace and in this source.
    if (role !== "user" && role !== "assistant") {
      throw new RequestRejected(400, `Unsupported message role: ${JSON.stringify(role)}.`)
    }

    const text = textOf(parts)
    if (text === null) throw new RequestRejected(400, "Messages must carry text parts only.")
    if (text.length > LIMITS.messageChars) {
      throw new RequestRejected(413, `A message is longer than ${LIMITS.messageChars} characters.`)
    }
    total += text.length
    if (total > LIMITS.totalChars) {
      throw new RequestRejected(413, `Conversation is longer than ${LIMITS.totalChars} characters.`)
    }

    clean.push({
      id: typeof id === "string" && id.length <= 64 ? id : `m-${clean.length}`,
      role,
      parts: [{ type: "text", text }],
    })
  }

  // The turn being answered has to be the visitor's. A body whose last message
  // is an assistant turn is either a bug or an attempt to have the model
  // continue words it did not write.
  if (clean[clean.length - 1].role !== "user") {
    throw new RequestRejected(400, "The last message must be from the user.")
  }

  return clean as unknown as UIMessage[]
}

/** Body text, refused before parsing if it is over the byte cap. */
export async function readBody(req: Request): Promise<unknown> {
  const declared = req.headers.get("content-length")
  if (declared && Number(declared) > LIMITS.bodyBytes) {
    throw new RequestRejected(413, "Request body is too large.")
  }
  const raw = await req.text()
  // Checked again after reading: content-length is caller-supplied and a
  // chunked request has none at all.
  if (raw.length > LIMITS.bodyBytes) {
    throw new RequestRejected(413, "Request body is too large.")
  }
  try {
    return JSON.parse(raw)
  } catch {
    throw new RequestRejected(400, "Body is not valid JSON.")
  }
}
