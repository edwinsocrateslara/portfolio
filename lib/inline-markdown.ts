import { ICON_STROKE } from "./icons"
/* ── Inline markdown, and why this escapes first ──────────────────────────
 * This builds an HTML string, and model output reaches it: app-shell commits
 * an API answer as `kind: "text"` and it renders through here, streaming and
 * committed. Before this, the two .replace() calls transformed **bold** and
 * [link](url) and passed EVERYTHING ELSE THROUGH RAW, so `<img onerror=...>`
 * or a javascript: link in a response executed.
 *
 * SCOPED TO WHAT IS ACTUALLY EXPOSED. There is no persistence, no accounts,
 * no storage and no second viewer here — nothing a visitor injects is stored
 * or shown to anyone else. So this is self-XSS plus a javascript:-link vector,
 * not stored or reflected XSS, and the fix is two small ones rather than a
 * sanitiser dependency or a rewritten renderer:
 *
 *   1. ESCAPE FIRST. Entities are escaped before the replacements run, so raw
 *      tags cannot survive. The markdown patterns match on *, [, ] and ( ),
 *      none of which escaping touches, so both replacements still work.
 *   2. ALLOW-LIST THE PROTOCOL. http, https and mailto only. Anything else —
 *      javascript:, data:, vbscript:, a bare unknown scheme — renders as the
 *      link's text with no anchor at all, so the words survive and the
 *      navigation does not.
 *
 * The href is escaped too: it goes into a double-quoted attribute, so an
 * unescaped `"` in a url would end the attribute and open the element to
 * everything the escaping above just prevented. */
const ESC: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c])

/** http, https and mailto. Parsed rather than pattern-matched, and a url the
 *  URL constructor rejects is rejected here too. Relative urls are allowed:
 *  they resolve against this origin and cannot carry a scheme. */
const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"])
export function isSafeHref(raw: string): boolean {
  const url = raw.trim()
  if (url === "") return false
  // A leading "/" or "#" or "./" is same-origin by construction.
  if (/^[/#]/.test(url) || url.startsWith("./") || url.startsWith("../")) return true
  // Reject control characters, which are how `java\0script:` style bypasses work.
  if (/[\u0000-\u001F]/.test(url)) return false
  try {
    return SAFE_PROTOCOLS.has(new URL(url, "https://example.invalid").protocol)
  } catch {
    return false
  }
}

/* ── The contact address is ALWAYS a link, and the model cannot be trusted
 * to make it one ─────────────────────────────────────────────────────────
 *
 * THE DEFECT. Asked "What's the best way to reach you?", claude-haiku-4-5
 * answered "The best way to reach me is by email at edwinsocrateslara@gmail
 * .com." — reproducibly, both runs. Nothing in this renderer autolinked it, so
 * it painted as inert text: no anchor, no mailto, nothing to click. The single
 * highest-stakes question on a job-seeking portfolio, answered with an address
 * a recruiter has to select and retype.
 *
 * It was not a one-model quirk. Across one captured run of 12 questions and 5
 * models, 2 of 27 mentions were bare — one from haiku on an ORDINARY answer,
 * one from opus-5 on a refusal. Re-run against the live prompt, haiku produced
 * a bare address in 6 of 10 runs across three different questions.
 *
 * THE PROMPT ALONE CANNOT FIX THIS, which is why the fix is here as well as
 * there. The system prompt now requires the markdown form wherever the address
 * appears, and that lowers the rate. It cannot take it to zero: the FALLBACK
 * has said "reproduce that line character for character" all along and models
 * still paraphrased it. An instruction is a probability. This is not.
 *
 * ONLY THIS ONE ADDRESS, matched literally. A general email pattern would also
 * linkify an address a VISITOR typed and the model echoed back, which is a
 * small injection surface for no benefit. Edwin's is the only address that
 * should ever appear, so it is the only one that is ever linked.
 *
 * AND IT MUST NOT DOUBLE-LINK. The address legitimately occurs twice inside an
 * already-correct markdown link — once as the label, once inside the href — so
 * an occurrence is skipped when it directly follows `mailto:` or sits in the
 * `[addr](` position. check:render holds both directions.
 *
 * ⚠ THE ADDRESS IS WRITTEN IN THREE OTHER PLACES: the FALLBACK in
 * app/api/chat/route.ts, the API error message in app-shell.tsx, and
 * CONTACT_EMAIL in sidebar.tsx. If they ever disagree, this autolinker
 * silently stops matching and the defect returns with no gate firing —
 * so check:render asserts this constant against the FALLBACK's copy. */
export const CONTACT_EMAIL = "edwinsocrateslara@gmail.com"

function autolinkContact(s: string): string {
  let out = ""
  let i = 0
  for (;;) {
    const at = s.indexOf(CONTACT_EMAIL, i)
    if (at === -1) return out + s.slice(i)
    const before = s.slice(Math.max(0, at - 7), at)
    const after = s.slice(at + CONTACT_EMAIL.length, at + CONTACT_EMAIL.length + 2)
    const alreadyLinked = before.endsWith("mailto:") || (before.endsWith("[") && after === "](")
    out +=
      s.slice(i, at) +
      (alreadyLinked ? CONTACT_EMAIL : `[${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL})`)
    i = at + CONTACT_EMAIL.length
  }
}

export function renderInline(p: string): string {
  // autolinkContact runs on the ESCAPED string and BEFORE the two replacements,
  // so anything it inserts goes through the same protocol allow-list and the
  // same mailto branch as an address the model linked itself. It emits markdown,
  // not markup, precisely so it cannot bypass them.
  return autolinkContact(escapeHtml(p))
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700">$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, href: string) => {
      // Escaping ran first, so `&` in a url is already `&amp;`. Decode only
      // that one entity to test the protocol, then use the escaped form in the
      // attribute — testing the escaped string would reject valid query urls.
      if (!isSafeHref(href.replace(/&amp;/g, "&"))) return label

      // MAILTO IS NOT A NEW TAB, and this branch used to say it was. Every
      // markdown link got target="_blank", rel="noopener noreferrer" and an
      // announcement reading "(opens in a new tab)" — on a protocol that opens
      // no tab and hands off to whatever handles mail.
      //
      // components/ui/new-tab-mark.tsx has stated the rule since it was
      // written: "a mailto does not open a tab... The new-tab wording would be
      // false, and a false announcement is worse than none." The rail obeys it
      // through MailMark. This renderer did not, because it had no mailto
      // branch — and nothing had hit it, since no source had ever contained a
      // markdown mailto. The error state is the first.
      //
      // target and rel come off with the wording. A mailto with target="_blank"
      // leaves an empty tab behind in some browsers, which is the visible half
      // of the same mistake.
      const isMail = href.replace(/&amp;/g, "&").trim().toLowerCase().startsWith("mailto:")
      return (
        `<a href="${href}"${isMail ? "" : ' target="_blank" rel="noopener noreferrer"'}` +
        ' style="color:rgb(var(--bureau-text-primary));text-decoration:underline;text-underline-offset:3px">' +
        label +
        // THE SAME GLYPH NewTabMark AND MailMark RENDER, inlined as markup because
        // this branch builds an HTML string and cannot render a component. All
        // three are one mark and MUST be changed together — path data and stroke
        // both. Path data from lucide-react v0.544 move-up-right; stroke from the
        // token. MailMark deliberately shares this glyph rather than using an
        // envelope: "same glyph, different truth" — what differs is the sentence
        // beneath it, not the drawing.
        '<svg class="link-ext" aria-hidden="true" viewBox="0 0 24 24" fill="none"' +
        ` stroke="currentColor" stroke-width="${ICON_STROKE}" stroke-linecap="round"` +
        ' stroke-linejoin="round"><path d="M13 5H19V11"/><path d="M19 5L5 19"/></svg>' +
        `<span class="sr-only"> (opens ${isMail ? "your email app" : "in a new tab"})</span></a>`
      )
    })
}
