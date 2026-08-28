/** Does this question actually ask where Edwin lives or is based?
 *
 * PHRASES, NOT THE WORD "where". The location test is the last branch before
 * the API fallback in scripted-responses.ts, so a bare `t.includes("where")`
 * claimed every un-triggered question containing it — "Where did you study?"
 * answered "Toronto, Ontario, Canada." confidently and about the wrong thing.
 * "based" had the same problem: "Which projects were based on research?" is
 * not a question about anyone's address.
 *
 * Its own module, with no imports, so a gate can exercise it directly. */
export function asksLocation(t: string): boolean {
  return (
    /\bwhere (are|do) you (based|live|located)\b/.test(t) ||
    /\bwhere(?:'s| is) (?:he|edwin)\b/.test(t) ||
    /\bwhere are you (?:from|based)\b/.test(t) ||
    /\bbased (?:in|out of)\b/.test(t) ||
    /\byour location\b/.test(t) ||
    /\b(?:what|which) (?:city|country|timezone|time zone)\b/.test(t) ||
    /\b(?:are|were) you based\b/.test(t) ||
    t.includes("location?") ||
    t.trim() === "location"
  )
}
