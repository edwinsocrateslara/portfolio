/* The shimmer's three layers, as Magic UI composes them: a rotating conic
 * gradient behind, a backdrop that masks all but a rim of it, and an inset
 * highlight on top. Corner radius is irrelevant to it — which is the whole
 * reason it works on a pill where the border beam could not.
 *
 * The backdrop must be OPAQUE — a translucent one cannot mask the spark. */
export function Shimmer() {
  return (
    <>
      <span className="shimmer" aria-hidden="true">
        <span className="shimmer-spark" />
      </span>
      <span className="shimmer-backdrop" aria-hidden="true" />
      <span className="shimmer-highlight" aria-hidden="true" />
    </>
  )
}
