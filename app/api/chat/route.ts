import { createAnthropic } from "@ai-sdk/anthropic"
import { convertToModelMessages, streamText, type UIMessage } from "ai"
import { readFileSync } from "fs"
import { join } from "path"
import { clientKey, LIMITS, parseChatRequest, rateLimit, readBody, RequestRejected } from "@/lib/chat-request"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const maxDuration = 30

// Read Edwin's context from the markdown file.
//
// ⚠ THIS RUNS ONCE, AT MODULE SCOPE. Editing lib/edwin-context.md has NO
// effect on the running dev server until it is restarted — the file is not a
// module, so nothing invalidates it and Fast Refresh will not pick it up.
//
//     pkill -f 'next dev' && npx next dev -p 3200
//
// This is not a bug worth fixing: reading the file per request would re-read
// ~550 lines on every message to catch an edit that happens a few times a
// year. It is just invisible. Adding LinkedIn to § Contact and then asking the
// chat about it returned the old answer twice, which reads exactly like the
// edit not having landed rather than like a stale cache.
const edwinContext = readFileSync(
  join(process.cwd(), "lib", "edwin-context.md"),
  "utf-8"
)

// THE [DOC:...] AND [PROJECT:slug] INSTRUCTIONS ARE GONE, and nothing replaced
// them. The prompt used to ask the model to emit those markers; nothing has
// ever parsed either one. The API branch renders a model answer as a single
// flat text bubble, and TextBubble transforms exactly two things — **bold**
// and [text](url) — so a marker with no parentheses matched neither and would
// have printed to the visitor as the literal string "[DOC:resume]".
//
// REMOVED RATHER THAN PARSED, deliberately. Parsing is not the small change it
// looks like: the markers would have to survive being split across stream
// chunks, the API branch would have to render a LIST of blocks where it now
// renders one bubble, and the commit-into-thread path takes a single message
// rather than a sequence. That is a rewrite of the API render path to reach a
// card the scripted answers already produce — the résumé and the deck both
// have scripted triggers and both render a real doc-link card today.
//
// If the API path ever should emit cards, this is a feature to design rather
// than an instruction to restore: the parsing, the streaming, and the unknown
// -key case all need answers, and none of them existed.
const SYSTEM_PROMPT = `You are a strict Q&A bot for Edwin Socrates Lara's portfolio. You can ONLY answer questions using the REFERENCE DOCUMENT below.

<ABSOLUTE_RULES>
BEFORE EVERY RESPONSE, ASK YOURSELF: "Can I find this exact information in the reference document?"
- If YES: Answer using only what's written there.
- If NO: Reply with the FALLBACK below, word for word, and nothing else.

FALLBACK (use verbatim, INCLUDING the markdown link):
"I don't know. That's not something Edwin has covered. Would you like to ask him yourself? He's at [edwinsocrateslara@gmail.com](mailto:edwinsocrateslara@gmail.com)."

NEVER GUESS. Do not infer, extrapolate, or assemble an answer out of adjacent
facts. Do not reason from one project to another, or from a tool he uses to an
opinion he might hold. If the document does not contain it, use the fallback.
An honest "I don't know" is always the correct answer here; a plausible
invention never is.

YOU ARE FORBIDDEN FROM:
- Generating opinions, philosophies, or design approaches not explicitly quoted in the document
- Creating numbered lists of "principles," "moves," or "steps" unless copying from the document
- Inferring what Edwin might think or do
- Being creative or helpful beyond the document's contents

The document now includes a section of Edwin's own writing covering his design
process, how he works with PMs and engineers, research, metrics, tradeoffs,
tools, strengths and weaknesses, and what he wants next. Answer those from it
directly. Earlier versions of this prompt told you to refuse process and
design-with-AI questions; that is no longer correct.

COMPENSATION AND AVAILABILITY ARE NOW IN THE DOCUMENT. They used to be on the
refusal list below; that was a deliberate policy change, not an oversight.
Answer them from § Salary expectations and availability and nowhere else — the
document states that his expectations are flexible and depend on the whole
opportunity, and it names no number. Do not infer, estimate or bracket one.

TOPICS GENUINELY ABSENT FROM THE DOCUMENT, WHICH REQUIRE THE FALLBACK:
- A specific salary figure, rate, or equity percentage
- References, or contact details for anyone other than Edwin
- Opinions about specific companies, products, or people the document does not discuss
- His personal life beyond what the document states
- Anything about unnamed or hypothetical future work
</ABSOLUTE_RULES>

When you DO have information, be direct and conversational. Lead with outcomes for projects.

NO MARKUP, NO MARKERS, with ONE exception: the mailto link in the FALLBACK
above. Reproduce that line character for character. The renderer turns
[text](mailto:...) into a real link; written as a bare address it is plain text
the visitor has to retype. Do not add markdown anywhere else.

<REFERENCE_DOCUMENT>
${edwinContext}
</REFERENCE_DOCUMENT>`

// ── ADMISSION BEFORE INFERENCE ────────────────────────────────────────────
// Nothing reaches the model until it has been rebuilt from scratch by
// lib/chat-request.ts. That file carries the reasoning; the short version is
// that `const { messages }: { messages: UIMessage[] } = await req.json()` is a
// type annotation, not a check, and this endpoint spends money on behalf of
// whoever posts to it.
//
// The order matters and is deliberate: rate limit, then size, then shape. Each
// step is cheaper than the one after it, so a hostile request is refused as
// early as it can be — the byte cap runs before JSON.parse, and the shape
// check before the ~64KB system prompt is assembled into a provider call.
export async function POST(req: Request) {
  let messages: UIMessage[]
  try {
    if (!rateLimit(await clientKey(req))) {
      return new Response(JSON.stringify({ error: "Too many requests. Try again shortly." }), {
        status: 429,
        headers: { "content-type": "application/json", "retry-after": "30" },
      })
    }
    messages = parseChatRequest(await readBody(req))
  } catch (e) {
    if (e instanceof RequestRejected) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: e.status,
        headers: { "content-type": "application/json" },
      })
    }
    throw e
  }

  const result = streamText({
    // ── THE MODEL ID IS CURRENT AND WAS VERIFIED, NOT ASSUMED ──────────────
    //
    // Checked against /v1/models with the deployment's own key: claude-sonnet-4-6
    // resolves, and it answers this prompt correctly — an in-scope question from
    // the document, and the FALLBACK returned byte-for-byte on an out-of-scope
    // one, including the mailto link.
    //
    // claude-sonnet-5 IS AVAILABLE AND SWITCHING IS NOT A ONE-LINE CHANGE. Two
    // things were measured before leaving this alone:
    //
    //   IT REJECTS `temperature`. The call below sets it to 0. Sonnet 5 returns
    //   "`temperature` is deprecated for this model" — an error that arrives
    //   INSIDE the stream, because this route returns 200 and surfaces failures
    //   in the body. The visitor would get the generic error bubble and then
    //   setUseApiMode(false) for the rest of the session. Changing the string
    //   alone breaks every chat, and it breaks it in the shape that looks like
    //   a spend cap rather than like a bad model id.
    //
    //   IT ANSWERS IN THE FIRST PERSON. Asked about the design process, 4.6
    //   says "Edwin works in 4 loose stages"; 5 says "I work in 4 loose
    //   stages". The scripted answers are first person, so 5 is arguably the
    //   better match — but that is a change to the site's voice, decided
    //   deliberately and checked against the scripted register, not a version
    //   bump.
    //
    // So: an upgrade is a real piece of work — drop temperature, re-verify the
    // fallback is still verbatim, and rule on the person. Not a maintenance
    // edit.
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    temperature: 0,
    // A CEILING ON WHAT A REQUEST CAN COST TO ANSWER. maxDuration above bounds
    // wall time and nothing bounded spend. The longest answer this site gives
    // is a few hundred tokens and the fallback is two sentences.
    maxOutputTokens: LIMITS.outputTokens,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    // The SANITISED list, not the caller's. Echoing the original back would
    // reintroduce whatever was stripped, one layer further along.
    originalMessages: messages,
  })
}
