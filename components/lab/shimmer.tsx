/* The shimmer's three layers, as Magic UI composes them: a rotating conic
 * gradient behind, a backdrop that masks all but a rim of it, and an inset
 * highlight on top. Corner radius is irrelevant to it — which is the whole
 * reason it works on a pill where the border beam could not.
 *
 * Rendered inert; app/lab.css only paints it under html[data-lab-shimmer]. */
export function Shimmer() {
  return (
    <>
      <span className="lab-shimmer" aria-hidden="true">
        <span className="lab-shimmer-spark" />
      </span>
      <span className="lab-shimmer-backdrop" aria-hidden="true" />
      <span className="lab-shimmer-hl" aria-hidden="true" />
    </>
  )
}
