// The brand mark, in ONE place: the rail and the mobile top bar both draw it.
//
// A FILL, NOT A STROKE, which is why none of the icon machinery applies to it —
// not the stroke ramp in lib/icons.ts, not the sparkle's 8.33. What limits a
// filled mark is its finest feature. The drawing is on a 10-unit module in a
// 260-unit box (bars 20, the narrowest gaps 10), so a gap is one device pixel
// at 26px on a 1x screen; below that the interior closes and it reads as a
// blob. DESIGN.md § Iconography records the sizes that follow from that.
//
// THE SOURCE IS docs/provenance/brand-mark/source.svg, and this is its path
// data and nothing else. The source hardcoded white through an embedded
// <style> block on a class; that block, the class and the layer ids were
// dropped, so the colour comes from the context through currentColor — the
// same pattern as Sparkle's stroke. A token at the call site, never a value
// in this file.
//
// ARTWORK coordinates in the SVG's own 260-unit space, not layout values.
export const MARK_PATH =
  "m260,120h-27.65c4.75-5.31,7.65-12.31,7.65-20v-30h-20v30c0,5.52-4.48,10-10,10h-1.71c1.11-3.13,1.71-6.49,1.71-10v-20h-20v20c0,5.52-4.48,10-10,10h-1.71c1.11-3.13,1.71-6.49,1.71-10v-10h-10v-10h-10c-3.51,0-6.87.61-10,1.71v-1.71c0-5.52,4.48-10,10-10h20v-20h-20c-3.51,0-6.87.61-10,1.71v-1.71c0-5.52,4.48-10,10-10h30v-20h-30c-7.69,0-14.69,2.89-20,7.65V0h-20v27.65c-5.31-4.75-12.31-7.65-20-7.65h-30v20h30c5.52,0,10,4.48,10,10v1.71c-3.13-1.11-6.49-1.71-10-1.71h-20v20h20c5.52,0,10,4.48,10,10v1.71c-3.13-1.11-6.49-1.71-10-1.71h-10v10h-10v10c0,3.51.61,6.87,1.71,10h-1.71c-5.52,0-10-4.48-10-10v-20h-20v20c0,3.51.61,6.87,1.71,10h-1.71c-5.52,0-10-4.48-10-10v-30h-20v30c0,7.69,2.89,14.69,7.65,20H0v20h27.65c-4.75,5.31-7.65,12.31-7.65,20v30h20v-30c0-5.52,4.48-10,10-10h1.71c-1.11,3.13-1.71,6.49-1.71,10v20h20v-20c0-5.52,4.48-10,10-10h1.71c-1.11,3.13-1.71,6.49-1.71,10v10h10v10h10c3.51,0,6.87-.61,10-1.71v1.71c0,5.52-4.48,10-10,10h-20v20h20c3.51,0,6.87-.61,10-1.71v1.71c0,5.52-4.48,10-10,10h-30v20h30c7.69,0,14.69-2.89,20-7.65v27.65h20v-27.65c5.31,4.75,12.31,7.65,20,7.65h30v-20h-30c-5.52,0-10-4.48-10-10v-1.71c3.13,1.11,6.49,1.71,10,1.71h20v-20h-20c-5.52,0-10-4.48-10-10v-1.71c3.13,1.11,6.49,1.71,10,1.71h10v-10h10v-10c0-3.51-.61-6.87-1.71-10h1.71c5.52,0,10,4.48,10,10v20h20v-20c0-3.51-.61-6.87-1.71-10h1.71c5.52,0,10,4.48,10,10v30h20v-30c0-7.69-2.89-14.69-7.65-20h27.65v-20Zm-230,17.65v-15.29c5.31,4.75,12.31,7.65,20,7.65-7.69,0-14.69,2.89-20,7.65Zm30,0v-15.29c5.31,4.75,12.31,7.65,20,7.65-7.69,0-14.69,2.89-20,7.65Zm100-37.65c0,5.52-4.48,10-10,10,0-5.52,4.48-10,10-10Zm-22.35-70c-4.75,5.31-7.65,12.31-7.65,20,0-7.69-2.89-14.69-7.65-20h15.29Zm-7.65,30h7.65c-4.75,5.31-7.65,12.31-7.65,20,0-7.69-2.89-14.69-7.65-20h7.65Zm0,30h7.65c-4.75,5.31-7.65,12.31-7.65,20,0-7.69-2.89-14.69-7.65-20h7.65Zm-20,20c-5.52,0-10-4.48-10-10,5.52,0,10,4.48,10,10Zm-20,20v-7.65c5.31,4.75,12.31,7.65,20,7.65-7.69,0-14.69,2.89-20,7.65v-7.65Zm10,30c0-5.52,4.48-10,10-10,0,5.52-4.48,10-10,10Zm22.35,70c4.75-5.31,7.65-12.31,7.65-20,0,7.69,2.89,14.69,7.65,20h-15.29Zm7.65-30h-7.65c4.75-5.31,7.65-12.31,7.65-20,0,7.69,2.89,14.69,7.65,20h-7.65Zm0-30h-7.65c4.75-5.31,7.65-12.31,7.65-20,0,7.69,2.89,14.69,7.65,20h-7.65Zm0-30h-10v-20h20v20h-10Zm20,10c5.52,0,10,4.48,10,10-5.52,0-10-4.48-10-10Zm20-20v7.65c-5.31-4.75-12.31-7.65-20-7.65,7.69,0,14.69-2.89,20-7.65v7.65Zm30,0v7.65c-5.31-4.75-12.31-7.65-20-7.65,7.69,0,14.69-2.89,20-7.65v7.65Zm30,7.65c-5.31-4.75-12.31-7.65-20-7.65,7.69,0,14.69-2.89,20-7.65v15.29Z"

/**
 * Decorative — aria-hidden. The control around it carries the name.
 *
 * `size` is a CSS length, always passed as a token by the caller.
 * `currentColor` for the fill, so the mark inherits its colour from the
 * control. check:design rule 6 fails the build if that colour is the accent.
 */
export function BrandMark({ size }: { size: string }) {
  return (
    // inline-flex for the reason Sparkle records: width and height do not
    // apply to an inline box.
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        flex: "none",
      }}
    >
      <svg viewBox="0 0 260 260" width="100%" height="100%" fill="currentColor">
        <path d={MARK_PATH} />
      </svg>
    </span>
  )
}
