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

<VOICE>
ANSWER IN THE FIRST PERSON, AS EDWIN. "I work in 4 loose stages", never "Edwin
works in 4 loose stages" and never "He works in". "My salary expectations",
never "Edwin's salary expectations".

THE SOURCE PASSAGE DOES NOT DECIDE THIS. The reference document is written in
mixed registers — some sections are Edwin's own first-person writing, others
describe him in the third person because they were assembled from project
records rather than from him. Convert third-person source material into the
first person when you answer. The document's grammar is an artifact of how it
was built. It is not an instruction about how to speak.

Do not narrate the document either: "the document says", "according to the
reference", "Edwin's document states". Answer as the person, from what you
know.

THE ONE EXCEPTION IS THE FALLBACK, which is reproduced character for character
exactly as written above, including the word "Edwin" in it.
</VOICE>

When you DO have information, be direct and conversational. Lead with outcomes for projects.

NO MARKUP, NO MARKERS, with ONE exception: EDWIN'S EMAIL ADDRESS, ANYWHERE IT
APPEARS.

Every time you write it — in the FALLBACK, in an ordinary answer, when
suggesting someone get in touch, anywhere at all — write it as:

[edwinsocrateslara@gmail.com](mailto:edwinsocrateslara@gmail.com)

Never bare. The renderer turns [text](mailto:...) into a real link; written as a
bare address it is plain text a visitor has to select and retype. "You can reach
me at edwinsocrateslara@gmail.com" is WRONG for that reason, and it is the
mistake that actually happens — it happened on "What's the best way to reach
you?", which is the most important question anyone asks this site.

Reproduce the FALLBACK line character for character, including its link.

Do not add markdown anywhere else. No bold, no headings, no lists, no other
links.

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
    // ── THE MODEL WAS CHOSEN BY MEASUREMENT. RE-RUN IT BEFORE CHANGING. ────
    //
    // claude-sonnet-4-6, kept deliberately over five candidates that were all
    // tested against THIS system prompt with the deployment's own key:
    // haiku-4-5, sonnet-4-6, sonnet-5, opus-5, fable-5-1.
    //
    // ON ACCURACY THEY WERE INDISTINGUISHABLE, and that is the finding, not a
    // hedge. 7 questions the document answers, 5 it cannot, and 8 adversarial
    // ones drawn from this site's own history of getting figures wrong — the
    // unpublished SideBar denominator, the 73% that was removed as unsupported,
    // the 75% that was our arithmetic, the 457-corpus-versus-300-per-run
    // conflation. Every model scored 7/7, 5/5 and 8/8. None invented a figure.
    // A bigger model caught nothing a smaller one missed.
    //
    // SO THE DECISION TURNED ON PINNABILITY, which is the property worth having
    // on an endpoint strangers can post to.
    //
    //   THE THREE 2026 MODELS CANNOT BE PINNED AT ALL. sonnet-5, opus-5 and
    //   fable-5-1 REJECT `temperature` — "`temperature` is deprecated for this
    //   model" — and reject `top_p` with it. The rejection arrives INSIDE the
    //   stream, because this route returns 200 and surfaces failures in the
    //   body, so swapping the string alone gives every visitor the generic
    //   error bubble and then setUseApiMode(false) for the session. It fails in
    //   the shape of a tripped spend cap rather than a bad model id.
    //
    //   THE SPLIT IS PREDICTABLE FROM /v1/models: every model whose
    //   capabilities report thinking.types.enabled.supported === false
    //   (adaptive-only) refuses both parameters. Check that field before
    //   assuming a newer id is a drop-in.
    //
    // AND IT IS CHEAPER TO RUN: 125 output tokens where opus-5 took 236 for the
    // same content, against a 1024 cap.
    //
    // ⚠ REPEATABILITY IS NOT STABLE ENOUGH TO CITE AS A REASON. Three runs of
    // one question: sonnet-4-6 varied in wording on the first pass and was
    // byte-identical on the second, while sonnet-5 did the reverse. Only
    // haiku-4-5 held byte-identical across both. `temperature: 0` is worth
    // setting because it is the only control that exists, not because it was
    // observed to make this model deterministic.
    //
    // AN EARLIER VERSION OF THIS COMMENT CLAIMED SONNET 5 ANSWERS IN THE FIRST
    // PERSON. It does not reliably — it produced both registers on the same
    // question across two runs. Person was never a property of the model; it
    // was unspecified in the prompt, which is why the prompt now states it.
    //
    // BEFORE UPGRADING: re-run the suite. The accuracy tie means a newer model
    // has to earn the change on something other than being newer, and the
    // temperature line has to go with it.
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
