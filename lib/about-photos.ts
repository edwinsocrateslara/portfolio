// The 3 photographs on the About pane, and the only images on the site whose
// subject is Edwin.
//
// ── WHY THIS IS A MODULE AND NOT A CONST IN about-pane.tsx ────────────────
//
// It was one, and that made these 3 the only content images on the site whose
// alt text nothing validated. scripts/check-alt.mjs checks written alt by
// importing the real data — it cannot read a .tsx, and it could not reach a
// module-private object even if it could. Its source scan sees `alt: ""` and
// nothing else, so length, the closing full stop, medium-announcing openings
// and cross-image references were all unchecked here. Deleting the final full
// stop from one of these left the gate green.
//
// That the data was private was a fact about the module, not a reason the rule
// stopped applying at its edge. As a plain .ts content module beside
// lib/projects.ts, it is data the pane renders and the gate reads, which is
// what every other image on the site already was.
//
// ⚠ `alt: ""` IS NOT A PLACEHOLDER HERE. To a screen reader it declares an
// image DECORATIVE and removes it from the accessibility tree. These are the
// only human presence on the site; an empty string on one would be a claim
// that it carries nothing.
//
// ALT TEXT IS AUTHORED, never generated, and these are written to
// lib/sources/README.md § "Alt text describes the frame". They are the ONE
// exception that section names: first person, because their subject is Edwin
// and this pane is already in his voice. A third-person description of him on
// his own site reads as though somebody else wrote it.
//
// Each also sits beside a caption, the only images on the site that do, so
// none repeats what the caption already says — the malamute's alt names
// neither the breed nor the age.

export interface AboutPhoto {
  src: string | null
  alt: string
  /** object-position. Belongs to the PHOTOGRAPH rather than the frame: it
   *  describes where that image's subject sits, so it travels with the file if
   *  the file moves to another slot. Omitted means centred. */
  position?: string
}

export const PHOTOS: Record<"portrait" | "bouldering" | "race", AboutPhoto> = {
  portrait: {
    src: "/about/malamute.webp",
    alt: "My dog standing at a bright window, looking out at a red-brick building and a tree, with his bed on the floor beside him.",
  },
  // 1:1 SOURCE IN A 1:1 FRAME, so `cover` trims nothing and there is no
  // `position` to pick — unlike `race` below, which is 3:4 in the same square.
  // 3024x3024 iPhone original, downscaled to 1200 and encoded webp q82, which
  // is the same recipe as the two beside it. EXIF was stripped at encode
  // (`cwebp -metadata none`) and verified: the file is a single VP8 chunk. The
  // source carried GPS.
  bouldering: {
    src: "/about/bouldering.webp" as string | null,
    alt: "Me part-way up an indoor bouldering wall, my face not visible from this angle. One hand high, the other lower, legs spread wide to 2 footholds. Grey panels, dozens of coloured holds.",
  },
  // 3:4 source in a 1:1 frame, so cover trims 25.2% of the height. Centred it
  // took 12.6% off each edge and cut the shoes; bottom-aligned it takes the
  // whole 25.2% off the top, which the frame can afford — the subject's head
  // still clears the top edge, with less headroom rather than none.
  // 33 WORDS TO 32, AND ONE ARTICLE IS THE WHOLE EDIT. "a bib and a medal"
  // became "a bib and medal". This alt was approved at 33 and had been over the
  // ceiling since the day it was written; nothing could see it until the About
  // photographs entered check:alt's second pass, which is the point of moving
  // them here. The rule was held rather than excepted for the same reason the
  // bouldering alt was cut from 72 to 32: a 9-clause rule with an exception
  // attached to the first thing that tests it is not a rule.
  race: {
    src: "/about/race-day.webp",
    alt: "Me walking through the finish area after a winter race, in a brown tracksuit with a bib and medal, a water bottle in one hand, runners and a yellow banner behind me.",
    position: "50% 100%",
  },
}
