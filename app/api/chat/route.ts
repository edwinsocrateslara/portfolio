import { createAnthropic } from "@ai-sdk/anthropic"
import { convertToModelMessages, streamText, type UIMessage } from "ai"
import { readFileSync } from "fs"
import { join } from "path"

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

FALLBACK (use verbatim):
"I don't know. That's not something Edwin has covered. Would you like to ask him yourself? He's at edwinsocrateslara@gmail.com."

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

TOPICS GENUINELY ABSENT FROM THE DOCUMENT, WHICH REQUIRE THE FALLBACK:
- Compensation, salary, rates, or equity
- Availability, notice period, or start dates
- References, or contact details for anyone other than Edwin
- Opinions about specific companies, products, or people the document does not discuss
- His personal life beyond what the document states
- Anything about unnamed or hypothetical future work
</ABSOLUTE_RULES>

When you DO have information, be direct and conversational. Lead with outcomes for projects.

NO MARKUP, NO MARKERS. Answer in plain sentences.

<REFERENCE_DOCUMENT>
${edwinContext}
</REFERENCE_DOCUMENT>`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    temperature: 0,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
  })
}
