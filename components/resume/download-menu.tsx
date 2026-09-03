"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { ArrowDownToLine, ChevronDown } from "lucide-react"
import { Shimmer } from "@/components/chat/shimmer"
import { ICON_STROKE } from "@/lib/icons"
import type { DocFormat } from "@/lib/constants"

// The résumé download control: one pill, three formats behind it.
//
// ── WHY THIS SURFACE AND NOT THE OTHER TWO ────────────────────────────────
//
// There are two places the résumé can be downloaded: the doc-link card in a
// chat transcript, and this pill. The card stays ONE CLICK at the PDF, and
// that is a decision rather than a scoping cut. A card in a transcript is an
// OFFER — it hands you the document. The pane is where someone is already
// reading the résumé and has formed an opinion about what they want to do
// with it, which is where a CHOICE belongs. (The rail's RESUME row is not a
// download at all; it swaps the pane. It looked like a third entry point and
// is not one.)
//
// ── THE MENU PATTERN, NOT A LISTBOX AND NOT A DIALOG ──────────────────────
//
// Three actions, one of which happens on activation, nothing selected
// afterwards. That is `menu` / `menuitem`: a listbox would announce a
// selected value that does not exist, and a dialog would trap focus for a
// three-item list. The items are real <a download> elements, so a middle
// click, a ⌘-click and "Save link as…" all still work — role="menuitem"
// changes what a screen reader calls them, not what the browser does with
// them.
//
// ── KEYBOARD, WRITTEN BEFORE ANY OF THE STYLING ───────────────────────────
//
//   Enter / Space / ↓   open, focus the first item
//   ↑                   open, focus the LAST item
//   ↓ ↑                 move, wrapping at both ends
//   Home / End          first / last
//   Enter / Space       activate the focused item
//   Escape              close AND RETURN FOCUS TO THE TRIGGER
//   Tab                 close, and let focus move on naturally
//   click outside       close, silently — a pointer user has already left
//
// The Escape rule is the one that is usually missed and the one a keyboard
// user notices immediately: closing a menu without restoring focus drops them
// at the top of the document.

export function DownloadMenu({ formats, label }: { formats: readonly DocFormat[]; label: string }) {
  const [open, setOpen] = useState(false)
  // Which item is focused. -1 while closed. The DOM holds real focus; this is
  // what decides where to put it after a render.
  const [active, setActive] = useState(-1)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const menuId = useId()

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false)
    setActive(-1)
    if (restoreFocus) triggerRef.current?.focus()
  }, [])

  // ── IT ALWAYS OPENS DOWNWARD, AND THAT WAS MEASURED, NOT ASSUMED ───────
  // This shipped for an afternoon with a flip: read the trigger's box at open
  // time and open upward when the panel would not fit below. It never fired,
  // and the reason is structural rather than lucky. The pill lives in
  // .deck-head, which is the first thing inside the pane's scroller and is
  // `position: static` — so the trigger is at the TOP of the viewport when the
  // pane opens and scrolls off the top from there. Measured on the running
  // page: top 36 at 1440 and 97 at 380 at rest; after scrolling the pane to
  // its end, -2227 and -5132. There is no scroll position and no viewport,
  // down to 380x420, that puts it low enough to need the flip.
  //
  // So the branch is gone. Unreachable code that looks like it is handling a
  // case is worse than no code: the next person reads it as evidence the case
  // was thought about and handled, and it is evidence of neither.
  //
  // IF THE HEAD EVER BECOMES STICKY, this comes back — a pinned head could sit
  // anywhere, and that is the change that would make the flip real.
  const openWith = (index: number) => {
    setOpen(true)
    setActive(index)
  }

  // Focus follows `active` after the menu has rendered. Doing this in an
  // effect rather than in the handlers is what makes every path — pointer,
  // Enter, ArrowUp-to-open — land in the same place by the same rule.
  useEffect(() => {
    if (!open || active < 0) return
    itemRefs.current[active]?.focus()
  }, [open, active])

  // Pointer outside, and focus leaving the control entirely. Both close it,
  // and neither restores focus: the user has already moved.
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t)) return
      close(false)
    }
    // A capture-phase listener, so a click on some other control closes this
    // BEFORE that control acts rather than after it.
    document.addEventListener("pointerdown", onPointer, true)
    return () => document.removeEventListener("pointerdown", onPointer, true)
  }, [open, close])

  const move = (to: number) => {
    const n = formats.length
    setActive(((to % n) + n) % n) // wraps at both ends
  }

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      openWith(0)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      openWith(formats.length - 1)
    }
  }

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        move(active + 1)
        break
      case "ArrowUp":
        e.preventDefault()
        move(active - 1)
        break
      case "Home":
        e.preventDefault()
        move(0)
        break
      case "End":
        e.preventDefault()
        move(formats.length - 1)
        break
      case "Escape":
        e.preventDefault()
        close(true)
        break
      case "Tab":
        // NOT prevented. The menu closes and focus goes wherever Tab was
        // taking it — trapping focus in a three-item menu would be a worse
        // failure than closing one the user meant to keep open.
        close(false)
        break
      default:
        break
    }
  }

  return (
    <div className="download-menu">
      <button
        ref={triggerRef}
        type="button"
        className="chip type-action deck-download download-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(false) : openWith(0))}
        onKeyDown={onTriggerKeyDown}
      >
        <ArrowDownToLine className="chip-icon" aria-hidden="true" strokeWidth={ICON_STROKE} />
        {label}
        {/* 12, NOT 16, and it is the ramp step below the arrow beside it on
            purpose. Two 16px marks on one control read as two actions; this
            one is a modifier on the arrow's action. The half-the-hit-target
            rule does not set it, because this is not an icon-only control —
            the label is the affordance and the glyph only says there is more
            behind it. */}
        <ChevronDown className="download-caret" aria-hidden="true" strokeWidth={ICON_STROKE} />
        <Shimmer />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          className="download-panel"
          onKeyDown={onMenuKeyDown}
        >
          {formats.map((f, i) => (
            <a
              key={f.ext}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              role="menuitem"
              // -1 THROUGHOUT, and the roving focus above is what makes it
              // reachable. A menu is one tab stop; three would put the three
              // formats into the page's tab order beside every other control.
              tabIndex={-1}
              className="download-item"
              href={f.url}
              download
              // The row reads "PDF · Formatted" on screen, which is enough
              // NEXT TO the pill that says Download. Read on its own by a
              // screen reader it is not, so the accessible name says the whole
              // action. Announced instead of the text, not as well as it.
              aria-label={`${label} as ${f.label}`}
              onClick={() => close(false)}
            >
              <span className="type-action download-item-label">{f.label}</span>
              <span className="type-value download-item-meta">{f.meta}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
