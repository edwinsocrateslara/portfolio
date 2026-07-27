"use client"

import React, { useRef, useEffect } from "react"
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

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
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
        className="type-body w-full resize-none py-5 pl-5 pr-14 focus:outline-none transition-shadow"
        style={{
          background: "rgb(var(--bureau-surface))",
          color: "rgb(var(--bureau-text-primary))",
          border: "1px solid rgb(var(--bureau-border))",
          borderRadius: "var(--bureau-radius-btn)",
          caretColor: "rgb(var(--bureau-accent))",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgb(var(--bureau-text-secondary))"
          e.currentTarget.style.boxShadow = "var(--bureau-focus-ring)"
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgb(var(--bureau-border))"
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
        className={`type-label absolute right-3 bottom-3 flex h-11 items-center justify-center gap-2 px-3 ${
          canSubmit ? "font-bold" : "font-semibold"
        }`}
        style={{
          background: canSubmit ? "rgb(var(--bureau-accent))" : "transparent",
          border: `1px solid rgb(var(--bureau-${canSubmit ? "accent" : "border"}))`,
          borderRadius: "var(--bureau-radius-btn)",
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
