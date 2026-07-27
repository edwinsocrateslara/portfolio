import type { Project } from "./projects"
import type { MessageBlock } from "@/hooks/use-scripted-stream"

// The single definition of how a project case study is ordered.
//
// Mirrors the original Framer project page:
//   tagline -> image 1 -> KEY IMPACTS -> MY ROLE (role, what was at stake,
//   why I made those decisions) -> image 2 -> THE CHALLENGE -> the rest of
//   the images.
//
// Deliberately excludes the project header and the follow-up chips: the
// chat reveal and the standalone /case-study route wrap this body with
// their own versions of those (different chips, different handlers), but
// must not diverge on the order in between.
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

  // Every image opens a lightbox over the whole set regardless of where it
  // sits, so splitting them across the page doesn't strand each one alone.
  const imageAt = (i: number): MessageBlock | null =>
    all[i] ? { kind: "image", image: all[i], group: all, groupIndex: i } : null

  const blocks: MessageBlock[] = [{ kind: "text", text: p.tagline }]

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
