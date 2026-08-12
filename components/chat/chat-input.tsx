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
          // The button is bottom-anchored 12px in from the right, and a fully
          // round container's corner radius is half its height, so the curve
          // eats that inset as the field grows. Measured clearance between the
          // two painted edges:
          //
          //     1 line   66px   12.0px clear
          //     2 lines  90px    7.0px clear
          //     3 lines 114px    2.1px clear
          //     4 lines 138px    2.9px OUTSIDE
          //     6 lines 180px   11.6px OUTSIDE   (max height, and it scrolls —
          //                                       a 4px thumb inside a 90px
          //                                       corner gets clipped too)
          //
          // Card radius is flat 12px clear at every height; the geometry stops
          // depending on how much the visitor has typed. The step also says
          // something true: round is "one line, ready", squared is "drafting".
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
      <style>{`textarea::placeholder { color: rgb(var(--bureau-text-muted)); }`}</style>
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        aria-label={isLoading ? "Sending" : "Send message"}
        className={`type-label chat-input-send absolute ${
          canSubmit ? "font-bold" : "font-semibold"
        }`}
        style={{
          // Bottom-anchored at a fixed height so it stays a button rather
          // than stretching when the textarea grows. At rest the field is
          // 2*20px padding + 24px line-height + 2*1px border = 66px, so a
          // 42px button leaves an equal 12px above, right and below.
          // 42 and 66 are off the 4px grid for the same reason line-height
          // is: both are derived from padding + content + border.
          right: "var(--space-12)",
          bottom: "var(--space-12)",
          height: 42,
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
        {isLoading ? (
          <>
            <span
              className="animate-bureau-pulse"
              style={{
                width: "var(--space-4)",
                height: "var(--space-4)",
                borderRadius: 9999,
                background: "rgb(var(--bureau-text-muted))",
              }}
            />
            Sending
          </>
        ) : (
          <>
            Send
            <ArrowUp className="h-3.5 w-3.5" />
          </>
        )}
      </button>
    </div>
  )
}
