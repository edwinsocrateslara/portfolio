import type { Project } from "./projects"
import { vibeProjects } from "./vibe-projects"
import type { MessageBlock } from "@/hooks/use-scripted-stream"

// Which flow an entry takes, DERIVED from which list it is in rather than
// declared on the entry.
//
// This is the correction to the variant that was deleted in 433dd4d. That one
// used `variant?: "traditional" | "vibe-coded"` on Project, defaulting to
// traditional when omitted — so the vibe path was reachable only by setting a
// field nobody had a reason to set, and nothing ever did: 0 assignments across
// all 7 projects, 0 for each of its 8 fields. Its own comment predicted it:
// "With zero users, nothing will catch this rotting."
//
// Membership cannot fall out of sync the way a discriminator can. An entry in
// vibeProjects takes the vibe flow by existing; there is no second thing to
// remember to set, and no state where the flow has zero users while the code
// stays alive.
//
// It also adds NO fields to Project. The two flows read the same six copy
// fields and differ only in order and in the words above each section — which
// is the whole claim: the shape is in the content and its order.
function isVibe(p: Project): boolean {
  return vibeProjects.some((v) => v.slug === p.slug)
}

// The single definition of how a project case study is ordered.
//
// Mirrors the original Framer project page:
//   tagline -> image 1 -> KEY IMPACTS -> MY ROLE (role, what was at stake,
//   why I made those decisions) -> image 2 -> THE CHALLENGE -> the rest of
//   the images.
//
// Deliberately excludes the project header and the follow-up chips: the chat
// reveal wraps this body with its own versions of those.
//
// THIS FUNCTION ONCE HAD TWO CONSUMERS. It was extracted so the chat reveal and
// the standalone /case-study/[slug] route could not drift, and that route has
// since been deleted. The extraction still earns itself, but say why honestly:
// not because two surfaces share it, because it is the single statement of
// block order across TWO FLOWS and every entry in both lists. Folding it back
// into projectStream would move ~130 lines rather than remove them, and would
// merge "what order a case study goes in" with "what wraps it" — which are
// different questions with different reasons to change.
//
// The data is uneven. ai-workforce-development has no challenge, atStake
// or decision; ai-investing has no impacts; two projects have only two
// images. A missing section drops out entirely, heading included, rather
// than leaving a rule over nothing. The images keep their slots instead of
// shifting up to fill a gap, so image 2 still follows the role block
// wherever that lands — and if everything between the two images is
// missing they simply render consecutively, which is indistinguishable
// from a grouped row because images already stack full-width.
export function buildProjectBodyBlocks(p: Project): MessageBlock[] {
  const all = (p.images ?? []).map((img) => ({ url: img.url, alt: img.alt }))

  // ── The vibe flow ──────────────────────────────────────────────────────
  // A software tool needs a different order from a design case study, and it
  // needs its terms defined as they appear: "four boards" lands with no
  // referent in a shape that has no place to say what a board is.
  //
  // Same fields, different order and different section words. `challenge`
  // carries the pipeline, `impacts` carries the stack and the counts as one
  // mono block rather than an accent callout — reference material, not a
  // claim about outcomes. `atStake` is deliberately unread here: the reason
  // the tool exists is the opening line's job in this shape.
  //
  // It ends on the running artefact. That is the one thing a vibe entry can
  // do that the seven work projects structurally cannot — their work sits
  // behind client NDAs and app stores; this one is open in a tab.
  if (isVibe(p)) {
    const out: MessageBlock[] = []
    if (p.tagline) out.push({ kind: "text", text: p.tagline, lede: true })
    if (all[0]) out.push({ kind: "image", image: all[0], group: all, groupIndex: 0 })
    if (p.roleDescription) {
      out.push({ kind: "section-heading", text: "My role" })
      out.push({ kind: "text", text: p.roleDescription })
    }
    if (p.challenge) {
      out.push({ kind: "section-heading", text: "The pipeline" })
      // Split on the FIRST newline only, so the source screenshots sit against
      // the paragraph that describes the sources, and everything after stays
      // one block. Deliberately not split on every newline and indexed: that
      // would make image placement depend on the copy having exactly three
      // paragraphs, and adding a sentence later would silently move them.
      // Splitting once is stable however the tail grows.
      const nl = p.challenge.indexOf("\n")
      const sources = nl === -1 ? p.challenge : p.challenge.slice(0, nl)
      const rest = nl === -1 ? "" : p.challenge.slice(nl + 1)
      out.push({ kind: "text", text: sources })
      // Upstream then downstream, matching the sentence order above: the
      // transcripts are a tributary, the board post is where the three sources
      // converge — which is the clause that paragraph lands on.
      if (all[2]) out.push({ kind: "image", image: all[2], group: all, groupIndex: 2 })
      if (all[1]) out.push({ kind: "image", image: all[1], group: all, groupIndex: 1 })
      if (rest) out.push({ kind: "text", text: rest })
    }
    if (p.decision) {
      out.push({ kind: "section-heading", text: "The calls" })
      out.push({ kind: "text", text: p.decision })
    }
    if (p.impacts?.length) {
      out.push({ kind: "section-heading", text: "Stack and numbers" })
      out.push({ kind: "text", text: p.impacts.join("\n"), mono: true })
    }
    out.push({ kind: "section-heading", text: "See it running" })
    out.push({ kind: "doc-link", docKey: "ideas-showcase" })
    // The architecture diagram is LINKED, not embedded. Measured at the exact
    // render sizes: 4px annotation ink in the chat block, 7px in the lightbox
    // at 1440x900, 6px at 1280x720 — under the 12px floor this system states
    // for type. The 16:10 source also loses 10% of its height to the block's
    // 16:9 crop, which clips the top annotation line (first ink at y=78, crop
    // removes the first 80 rows). Native size in a tab is legible; a preview
    // that cannot be read is worse than a link that can.
    out.push({ kind: "doc-link", docKey: "ideas-architecture" })
    // ⚠ Anything past slot 2 lands HERE — after the proof links, at the very
    // end. That is fine for the work flow, where images trail by design, and
    // wrong for this one, which ends on the running artefact deliberately. A
    // fourth screenshot would be the last thing a reader sees, undercutting
    // the link it follows. If one ever earns a place, give it a slot in the
    // order above rather than letting it fall through to here.
    for (let i = 3; i < all.length; i++) {
      out.push({ kind: "image", image: all[i], group: all, groupIndex: i })
    }
    return out
  }

  // Every image opens a lightbox over the whole set regardless of where it
  // sits, so splitting them across the page doesn't strand each one alone.
  const imageAt = (i: number): MessageBlock | null =>
    all[i] ? { kind: "image", image: all[i], group: all, groupIndex: i } : null

  // A placeholder project has no tagline yet, and an empty text block renders
  // as an empty bubble. Skip it rather than assert a blank line — the seven
  // real projects all have one, so this only ever fires for a placeholder.
  // `lede` is set HERE rather than in the renderer, so which line is the
  // opening one is decided with the block order rather than alongside it.
  const blocks: MessageBlock[] = p.tagline
    ? [{ kind: "text", text: p.tagline, lede: true }]
    : []

  const push = (block: MessageBlock | null) => {
    if (block) blocks.push(block)
  }

  push(imageAt(0))

  // The impact card carries its own heading, so it needs no section rule.
  if (p.impacts && p.impacts.length > 0) {
    blocks.push({ kind: "impact", label: "Key impacts", items: p.impacts })
  }

  if (p.roleDescription || p.atStake || p.decision) {
    blocks.push({ kind: "section-heading", text: "My role" })
    if (p.roleDescription) blocks.push({ kind: "text", text: p.roleDescription })
    if (p.atStake) {
      blocks.push({ kind: "text", text: `**What was at stake:** ${p.atStake}` })
    }
    if (p.decision) {
      blocks.push({
        kind: "text",
        text: `**Why I made those decisions:** ${p.decision}`,
      })
    }
  }

  push(imageAt(1))

  if (p.challenge) {
    blocks.push({ kind: "section-heading", text: "The challenge" })
    blocks.push({ kind: "text", text: p.challenge })
  }

  // Individual blocks rather than an image-row: a row would give these
  // images a lightbox containing only themselves, while separate blocks
  // each carry the whole set. Visually identical — both stack full-width
  // with the same gap.
  for (let i = 2; i < all.length; i++) push(imageAt(i))

  return blocks
}
