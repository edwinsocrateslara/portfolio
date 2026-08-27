"use client"

interface PromptChipProps {
  label: string
  onClick: () => void
  disabled?: boolean
  prefix?: string
}

// .type-caption — the ramp's floor, in Product voice, and deliberately a step
// BELOW the composer these sit under.
//
// They had ended up identically typed: chip and input were both Archivo 16/24
// at weight 400 with normal tracking, separated only by colour. That was a
// regression from retiring the 14px step — chips were .type-control and got
// merged upward into .type-body, landing on the input. A suggestion and the
// thing you act with are not on the same level, and under "size ranks" saying
// so is size's job. Colour was already trying and could not carry it alone:
// secondary against primary is about a 12% difference in ink.
//
// Still Archivo, not mono — these are things a person would say. The
// hover state lives in .chip rather than in React state — it was three
// useState hooks across three components doing what one CSS rule does, and a
// hover that depends on a re-render is a hover that can miss.
export function PromptChip({ label, onClick, disabled = false, prefix }: PromptChipProps) {
  return (
    <button type="button" className="chip type-caption" onClick={onClick} disabled={disabled}>
      {prefix && <span className="type-attribute chip-prefix">{prefix}</span>}
      {label}
    </button>
  )
}
