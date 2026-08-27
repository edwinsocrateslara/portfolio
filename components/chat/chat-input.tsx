"use client"

import React, { useRef, useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  placeholder?: string
  className?: string
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = "Ask anything...",
  className,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [grown, setGrown] = useState(false)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    // scrollHeight is content + padding but excludes the border, while
    // box-sizing is border-box — so assigning it raw made the field 2px
    // short of its own content and left the resting height indeterminate.
    const borderY = el.offsetHeight - el.clientHeight
    const next = Math.min(el.scrollHeight + borderY, 180)
    el.style.height = `${next}px`

    // The resting height is DERIVED, not written down: padding + one line of
    // leading + border. A literal 66 here would be a fourth place that number
    // lives and would silently go wrong the next time the type step or the
    // padding moves.
    const cs = getComputedStyle(el)
    const oneLine =
      parseFloat(cs.lineHeight) +
      parseFloat(cs.paddingTop) +
      parseFloat(cs.paddingBottom) +
      borderY
    setGrown(next > oneLine + 1)
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading) onSubmit()
    }
  }

  const canSubmit = value.trim().length > 0 && !isLoading

  return (
    <div
      className={cn("relative", className)}
      style={{ opacity: isLoading ? 0.55 : 1, transition: "opacity 0.15s" }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={isLoading}
        className="type-body chat-input-field focus:outline-none transition-shadow"
        style={{
          background: "var(--layer-1)",
          color: "rgb(var(--bureau-text-primary))",
          border: "1px solid var(--hairline)",
          // Fully round at rest, card radius once it grows past one line.
          //
          // Not a taste call — a stadium collides with its own SEND button.
          // SEND is bottom-anchored --send-inset from the right, and a fully
          // round container's corner radius is half its height, so the curve
          // eats that inset as the field grows. Measured clearance between the
          // two painted edges, at the CURRENT geometry (50px field, 34px
          // button, 8px inset):
          //
          //     1 line   50px    8.0px clear
          //     2 lines  74px    3.0px clear
          //     3 lines  98px    1.9px OUTSIDE
          //     4 lines 122px    6.9px OUTSIDE
          //     6 lines 180px   18.9px OUTSIDE   (max height, and it scrolls —
          //                                       a 4px thumb inside a 90px
          //                                       corner gets clipped too)
          //
          // The crossing moved from between 3 and 4 lines to between 2 and 3
          // when the padding shrank: a smaller inset has less margin before
          // the curve reaches it. Card radius is flat 8px clear at every
          // height, because that geometry does not depend on the height at
          // all. The step also says something true: round is "one line,
          // ready", squared is "drafting".
          //
          // Both names in full, never `--bureau-radius-${...}` — see the note
          // on the SEND border below for what interpolating a token name cost.
          borderRadius: grown ? "var(--bureau-radius-card)" : "var(--bureau-radius-chip)",
          caretColor: "rgb(var(--bureau-accent))",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgb(var(--bureau-text-secondary))"
          e.currentTarget.style.boxShadow = "var(--bureau-focus-ring)"
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--hairline)"
          e.currentTarget.style.boxShadow = "none"
        }}
        aria-label="Chat input"
      />
      {/* SECONDARY, not muted. The hero wash went from 0.13 to 0.20 alpha, and
          DESIGN.md had already named this the binding constraint: measured at
          380px, where the field is narrowest and sits highest in the wash, the
          brightest background under it is rgb(38,47,32) and muted reads 4.30
          against a 4.5 floor. Secondary reads 5.32 there and 5.89 at 1440.
          Sampled with the placeholder blanked — measuring the mean with the
          glyphs present reads the glyph colour as background and reports a
          number that is wrong in both directions. */}
      <style>{`textarea::placeholder { color: rgb(var(--bureau-text-muted)); }`}</style>
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        aria-label={isLoading ? "Sending" : "Send message"}
        className="chat-input-send absolute"
        style={{
          // Box lives in .chat-input-send: size, inset and the 44px hit area
          // are all derived from --input-rest-h, so nothing here has to know
          // how tall the field is. The old `height: 42` with `right`/`bottom`
          // of 12 was correct only while the field was 66px, and would have
          // gone quietly wrong the moment the padding changed.
          background: canSubmit ? "rgb(var(--bureau-accent))" : "transparent",
          // Both token names written out in full. This was
          // `--bureau-${canSubmit ? "accent" : "border"}`, and building the
          // name by interpolation is what let it break silently: --bureau-border
          // was deleted when surfaces became alpha layers, grep for the token
          // could not see a name that does not appear in the source, and an
          // invalid var() makes the browser drop the whole border shorthand.
          // The resting button rendered `0px none`. Never interpolate a token name.
          border: `1px solid ${canSubmit ? "rgb(var(--bureau-accent))" : "var(--hairline)"}`,
          borderRadius: "var(--bureau-radius-chip)",
          color: canSubmit ? "rgb(var(--bureau-on-accent))" : "rgb(var(--bureau-text-muted))",
          cursor: isLoading ? "not-allowed" : canSubmit ? "pointer" : "default",
        }}
      >
        {/* Icon only. The accessible name comes from aria-label above, which
            already varies with state, so a screen reader still hears "Send
            message" / "Sending" — the label was never what carried it. */}
        {isLoading ? (
          <span
            className="animate-bureau-pulse"
            style={{
              width: "var(--space-8)",
              height: "var(--space-8)",
              borderRadius: "var(--bureau-radius-chip)",
              background: "rgb(var(--bureau-text-muted))",
            }}
          />
        ) : (
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
