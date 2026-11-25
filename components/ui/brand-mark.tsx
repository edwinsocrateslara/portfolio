// The brand mark, in ONE place: the rail and the mobile top bar both draw it,
// and the favicon, the 32px and 180px icons and the link card import the path
// and the box from here.
//
// A FILL, NOT A STROKE, which is why none of the icon machinery applies to it —
// not the stroke ramp in lib/icons.ts, not the sparkle's 8.33. What limits a
// filled mark is its finest feature.
//
// THE CURRENT MARK (25 November) is a ten-arm asterisk: arms about 50 units
// wide in a 550 box, seven above the horizontal 30° apart and three below 45°
// apart. Its gaps are wedges that narrow to nothing at the hub, so the floor
// was measured as "do the ten arms separate at 1x": they do from 14px, with
// the closest gap 8% grey at 16 and clean from 18. The floor is about 16.
// DESIGN.md § Icons, "The brand mark: a fill, outside the ramp", has the
// table and the sizes.
//
// HISTORY: the previous mark (21 October – 25 November) was drawn on a 10-unit
// module in a 260-unit box (bars 20, the narrowest gaps 10), so a gap was one
// device pixel at 26px on a 1x screen and below that the interior closed. That
// 26 is why there was no 16px favicon; it is superseded, not wrong. Its source
// is docs/provenance/brand-mark/source-2026-10-21.svg.
//
// THE SOURCE IS docs/provenance/brand-mark/source.svg, and this is its path
// data and nothing else. The source fixed width and height and filled white;
// those were dropped, so the colour comes from the context through
// currentColor — the same pattern as Sparkle's stroke. A token at the call
// site, never a value in this file.
//
// ARTWORK coordinates in the SVG's own 550-unit space, not layout values.
export const MARK_PATH =
  "M193.249 84.2032C211.268 115.037 228.329 145.596 247.677 175.173C250.016 145.966 249.41 117.195 249.52 88.4414C249.631 59.4849 249.544 30.5276 249.544 0.0823076C258.195 0.0550866 266.359 0.0196849 274.524 0.00650189C282.457 -0.00625511 290.391 0.00369427 299.379 0.00369427C299.379 10.2561 299.379 19.8167 299.379 29.3772C299.379 39.0437 299.379 48.7102 299.379 58.3767C299.379 68.3766 299.379 78.3764 299.379 88.3762C299.379 98.0427 299.379 107.709 299.379 117.376C299.379 127.042 299.195 136.713 299.431 146.374C299.661 155.838 298.352 165.405 300.786 177.083C308.552 168.636 312.012 159.689 316.896 151.769C322.138 143.269 326.916 134.483 331.917 125.834C336.75 117.473 341.618 109.133 346.451 100.773C351.285 92.4118 356.094 84.0362 360.914 75.6675C365.901 67.0105 370.87 58.3434 375.881 49.7007C380.684 41.4174 385.531 33.1599 390.678 24.3435C405.136 32.6878 418.904 40.6339 433.649 49.1444C418.851 74.7882 404.22 100.002 389.727 125.296C375.271 150.526 360.406 175.534 346.447 200.664C347.857 201.897 348.07 202.191 348.356 202.304C348.649 202.42 349.04 202.45 349.341 202.36C350.279 202.078 351.273 201.857 352.109 201.375C401.146 173.109 450.17 144.819 500.268 115.913C508.508 130.069 516.605 143.979 525.196 158.738C517.706 163.149 510.65 167.333 503.566 171.469C496.376 175.667 489.164 179.827 481.952 183.987C474.74 188.146 467.51 192.274 460.298 196.433C452.797 200.758 445.309 205.104 437.814 209.44C430.608 213.609 423.405 217.784 416.193 221.944C408.981 226.103 401.664 230.09 394.57 234.442C387.673 238.673 379.91 241.701 372.456 248.838C382.498 251.052 390.723 249.878 398.818 250.09C407.146 250.309 415.483 250.139 423.817 250.139C432.15 250.139 440.483 250.139 448.816 250.139C457.149 250.139 465.483 250.139 473.816 250.139C482.149 250.139 490.482 250.139 498.815 250.139C507.148 250.139 515.482 250.139 523.815 250.139C532.064 250.139 540.313 250.139 548.998 250.139C548.998 266.88 548.998 282.758 548.998 299.803C491.84 299.803 434.74 299.803 377.302 299.803C377.025 305.33 380.661 307.143 383.037 309.526C423.753 350.36 464.532 391.133 505.328 431.887C507.908 434.464 510.748 436.78 512.58 438.423C500.522 450.478 489.119 461.877 477.028 473.964C466.523 463.466 454.805 451.761 443.092 440.051C431.305 428.268 419.522 416.482 407.737 404.697C395.952 392.912 384.167 381.127 372.382 369.342C360.597 357.557 348.813 345.771 337.027 333.988C325.436 322.4 313.856 310.8 302.251 299.228C301.406 299.735 300.561 300.243 299.716 300.751C299.716 383.495 299.716 466.239 299.716 549.537C282.747 549.537 266.891 549.537 249.957 549.537C249.957 466.737 249.957 383.922 249.957 301.192C244.228 299.656 242.6 303.796 240.267 306.108C218.011 328.162 195.886 350.348 173.729 372.501C141.906 404.318 110.092 436.141 78.2617 467.95C75.9297 470.28 73.5013 472.514 71.896 474.049C60.3938 462.545 49.184 451.333 36.9115 439.058C43.1926 432.746 50.8225 425.063 58.4692 417.398C66.002 409.846 73.5518 402.311 81.0941 394.769C88.8722 386.99 96.6501 379.212 104.428 371.434C111.971 363.892 119.513 356.35 127.055 348.807C134.833 341.029 142.614 333.254 150.389 325.473C157.883 317.971 165.371 310.462 172.915 302.903C169.607 298.438 165.628 300.07 162.309 300.062C111.977 299.944 61.6441 299.979 11.3116 299.979C7.71704 299.979 4.12244 299.979 0 299.979C0 283.218 0 267.384 0 250.139C29.2014 250.139 58.3773 250.139 87.5532 250.139C116.627 250.139 145.701 250.141 175.118 248.662C163.743 238.748 150.708 232.402 138.356 225.013C125.783 217.492 113.007 210.31 100.315 202.988C87.9108 195.833 75.4941 188.7 63.0944 181.537C50.4319 174.223 37.7834 166.885 24.0163 158.913C32.2809 144.581 40.3295 130.624 48.7979 115.938C57.6385 120.989 65.9418 125.711 74.2225 130.472C82.8835 135.451 91.5226 140.469 100.172 145.469C108.533 150.302 116.892 155.138 125.256 159.966C133.62 164.794 141.991 169.61 150.357 174.437C159.01 179.429 167.578 184.577 176.336 189.379C184.568 193.893 192.188 199.728 202.069 201.832C174.364 150.444 144.886 100.454 115.619 49.132C129.984 40.8291 143.952 32.7554 158.573 24.304C170.253 44.452 181.586 64.001 193.249 84.2032Z"

// THE BOX, IN ONE PLACE. The source is 549 x 550 — not square — and its hub is
// at (274.5, 275). This box is square and centred on the hub, so the mark sits
// in the middle of a square slot rather than half a unit left of it. FIVE
// files draw the mark (this one, app/icon1.tsx, app/apple-icon.tsx,
// app/opengraph-image.tsx, and app/icon.svg, which cannot import and is held
// to this value by check:design's favicon-mark-drift). Four of them hard-coded
// "0 0 260 260" until 25 November: one constant, now, so the next mark is one
// edit plus the favicon, and the gate catches the favicon.
export const MARK_VIEWBOX = "-0.5 0 550 550"

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
      <svg viewBox={MARK_VIEWBOX} width="100%" height="100%" fill="currentColor">
        <path d={MARK_PATH} />
      </svg>
    </span>
  )
}
