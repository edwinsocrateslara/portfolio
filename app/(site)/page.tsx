// "/" — the front door. The shell is rendered by app/(site)/layout.tsx, which
// every route in this group shares; this page only marks the route as existing
// and carries no content of its own. Title and description are the site's
// defaults, from app/layout.tsx.
//
// THE RÉSUMÉ USED TO BE PARSED HERE and passed down. It is not any more: a
// prop is serialised into this page's HTML, so every visitor received 6 roles,
// 21 bullets, 6 skills bands and 3 education entries whether or not they ever
// opened the Resume pane. The pane fetches /api/resume instead, which imports
// the same parser — one source, delivered to the people who ask for it.
export default function HomePage() {
  return null
}
