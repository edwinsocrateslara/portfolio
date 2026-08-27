"use client"

import { Shimmer } from "@/components/lab/shimmer"

interface PromptChipProps {
  label: string
  onClick: () => void
  disabled?: boolean
  prefix?: string
}

// .type-control — 14/21, one step below the composer these sit under, and a
// step that exists for this component alone. Held deliberately; see DESIGN.md
// for why, and for the three moves that got here.
//
// The problem it solves is still the original one: chip and input had ended up
// identically typed, both Archivo 16/24 at 400 with normal tracking, separated
// only by colour. A suggestion and the thing you act with are not on the same
// level, and under "size ranks" saying so is size's job — colour alone could
// not, at roughly 12% in ink. 12 said it and said it too loudly for something
// you tap. 14 says it once.
//
// Still Archivo, not mono — these are things a person would say. The
// hover state lives in .chip rather than in React state — it was three
// useState hooks across three components doing what one CSS rule does, and a
// hover that depends on a re-render is a hover that can miss.
export function PromptChip({ label, onClick, disabled = false, prefix }: PromptChipProps) {
  return (
    <button type="button" className="chip type-control" onClick={onClick} disabled={disabled}>
      {prefix && <span className="type-attribute chip-prefix">{prefix}</span>}
      {label}
      {/* LAB — inert unless html[data-lab-shimmer]. Seven of these run at once
          on the front door plus a reveal, which is the case the border beam
          failed. */}
      <Shimmer />
    </button>
  )
}
