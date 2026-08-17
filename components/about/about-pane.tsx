"use client"

import Image from "next/image"
import { CURRENTLY_READING } from "@/lib/currently-reading"

// The About page. Full pane width rather than the 720px chat column — the
// Claude Design mock argues it and the argument holds: "With two images the
// text could sit on the 720 column line and still leave a 524px portrait. A
// third image forces the choice, and the photos win." So the pane goes wide
// and the PROSE keeps a narrow measure inside it, rather than the whole page
// narrowing to the words.
//
// These photographs are the only human presence on the site. Everything around
// them stays achromatic; the lime appears only on the rail's active bar.

// The mock's grid, in its own numbers: two 280px squares stacked with a 16px
// gap, and a portrait shortened to 392x576 so its height is exactly the stack
// (280 + 16 + 280). One gutter, 16px everywhere, so it reads as a single unit.
// Expressed here as ratios and fractions so it scales; the relationship is
// what matters, not the pixel values.
const PORTRAIT_RATIO = "392 / 576"
const SQUARE_RATIO = "1 / 1"

// TODO(edwin): supply the three photographs and their alt text. Alt text is
// authored, never generated — same rule as the 32 project images. Until then
// the slots hold their aspect ratios so the layout is real and reviewable, and
// carry no <img> at all: a broken image is worse than an honest empty frame.
const PHOTOS = {
  portrait: { src: null as string | null, alt: "" },
  bouldering: { src: null as string | null, alt: "" },
  race: { src: null as string | null, alt: "" },
}

function Slot({
  photo,
  ratio,
  sizes,
}: {
  photo: { src: string | null; alt: string }
  ratio: string
  sizes: string
}) {
  return (
    <div className="about-slot" style={{ aspectRatio: ratio }}>
      {photo.src && (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          style={{ objectFit: "cover" }}
        />
      )}
    </div>
  )
}

export function AboutPane() {
  return (
    <div className="about">
      {/* Spine. Narrow measure inside a wide pane. */}
      <div className="about-spine">
        {/* Heading + metadata line, the same object the deck pane carries.
            It stays INSIDE the spine rather than being hoisted above the
            .about row: the spine is the row's first column, so the heading
            lands on the pane's left edge either way, and hoisting it would
            push the mosaic down by the header's full height. The photographs
            do not move. */}
        <h1 className="type-h2 pane-title about-title">About</h1>
        <p className="type-label pane-meta">Toronto, Canada</p>

        {/* Verbatim from lib/sources/voice.md § Outside work, first sentence.
            The rest of that paragraph — the recent-reads list — stays in the
            chat answer, which is unchanged. This page shows what is open now;
            the chat still answers what has been finished.

            ⚠ NOTHING CHECKS THIS. check-voice.mjs reads voice-answers.ts and
            currently-reading.ts; this literal is in neither, so it can drift
            from voice.md silently. It did not on the last edit only because
            the sweep found it. Either wire it to a source or extend the gate. */}
        <p className="type-title about-lede">
          In my downtime, I&apos;m usually bouldering or running races, camping
          and hiking with my ten-year-old Alaskan Malamute.
        </p>

        <hr className="about-rule" />

        <div className="about-reading">
          <p className="type-label about-reading-label">
            <span className="rail-square" />
            Currently reading
          </p>
          {CURRENTLY_READING.map((book) => (
            <div key={book.title} className="about-book">
              <p className="type-body about-book-title">{book.title}</p>
              <p className="type-label about-book-author">{book.author}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mosaic. Portrait left, two supports stacked right. */}
      <div className="about-mosaic">
        <figure className="about-figure">
          <Slot
            photo={PHOTOS.portrait}
            ratio={PORTRAIT_RATIO}
            sizes="(max-width: 900px) 100vw, 392px"
          />
          <figcaption className="type-label about-caption">
            Ten-year-old Alaskan Malamute
          </figcaption>
        </figure>

        {/* ONE caption for two images, deliberately. The mock: "Captions
            consolidate to the grid's base edges (squares share one line,
            top-to-bottom order) so nothing intrudes on the inner gutter."
            A caption between the stacked squares would break the 16px gutter
            that makes the mosaic read as one object. */}
        <figure className="about-figure">
          <div className="about-stack">
            <Slot
              photo={PHOTOS.bouldering}
              ratio={SQUARE_RATIO}
              sizes="(max-width: 900px) 100vw, 280px"
            />
            <Slot
              photo={PHOTOS.race}
              ratio={SQUARE_RATIO}
              sizes="(max-width: 900px) 100vw, 280px"
            />
          </div>
          <figcaption className="type-label about-caption">
            Indoor bouldering · Race day
          </figcaption>
        </figure>
      </div>
    </div>
  )
}
