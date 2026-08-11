"use client"

import Image from "next/image"
import { projects } from "@/lib/projects"

// Three of the seven, below the prompt chips on the front door. Proof, not
// navigation — the rail is the index and already lists all seven, so this
// carries no heading: the mono client eyebrows self-label each card and a
// heading would be the only orphan label in the pane.
//
// `client` and `railSubtitle` are read straight off the project. Same two
// fields the rail rows use; nothing about these three is described twice.
const SAMPLE_SLUGS = ["ai-workforce-development", "retail-banking", "live-selling"] as const

export function ProjectSampler({
  onSelect,
  className,
  animationDelay,
}: {
  onSelect: (slug: string) => void
  className?: string
  animationDelay?: string
}) {
  const sample = SAMPLE_SLUGS.map((slug) => projects.find((p) => p.slug === slug)).filter(
    (p): p is (typeof projects)[number] => Boolean(p)
  )

  return (
    <div className={`sampler ${className ?? ""}`} style={{ animationDelay }}>
      {sample.map((p) => (
        <button
          key={p.slug}
          type="button"
          className="sampler-card"
          onClick={() => onSelect(p.slug)}
        >
          {/* Decorative: the client and subtitle below name the project, so
              alt="" keeps a screen reader from hearing it three times. The
              source is 2048px square; `sizes` is what keeps the optimizer
              from shipping it. */}
          <span className="sampler-media">
            <Image
              src={p.previewImage.url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 56px, 240px"
            />
          </span>
          <span className="sampler-foot">
            <span className="type-label sampler-client">{p.client}</span>
            <span className="type-caption sampler-sub">{p.railSubtitle}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
