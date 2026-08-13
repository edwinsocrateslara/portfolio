# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two confirmed audiences, evaluated in different ways and on different budgets
of attention.

**Hiring managers at AI companies** — design leads and heads of product at
companies building AI products. They are assessing craft and, specifically,
whether this designer can operate inside an AI-native workflow rather than
describe one. They will read a case study.

**Recruiters and talent partners** — screening rather than evaluating. They
skim for role level, company names, recency, and fit against a brief. They
will not read a case study; they need the résumé path to be short and the
seniority legible fast.

The two are not in tension so much as differently paced: the same surface has
to reward a thirty-second skim and a ten-minute read.

## Product Purpose

A personal design portfolio whose success condition is a **senior or lead
in-house product design role**. Not contract enquiries, not peer recognition.

The measure is whether it gets to an interview and then supports one — so
depth per project matters more than breadth of project count, and anything
that reads as freelance-marketing works against it.

## Positioning

The portfolio is a chat interface. A visitor asks about the work and the work
answers, rather than scrolling a case-study page.

That is not a presentation choice layered on a conventional portfolio; it is
the claim itself. The designer's stated specialism is AI products,
conversational design, and agentic workflows, and the site is an instance of
the thing rather than a description of it. A neighbouring portfolio could copy
the visual system; it could not truthfully copy this without having built one.

## Operating Context

Evaluated in a browser, usually desktop, often in a tab opened from LinkedIn
or an application, frequently alongside a résumé PDF. Mobile matters for
recruiters specifically, who screen on phones.

The visitor arrives cold, gives it seconds, and either engages or leaves. The
front door has to work without instruction.

## Capabilities and Constraints

- Seven projects, each with a client, a short subtitle, a challenge, impacts,
  and a role description. The set and its framing are **fixed**.
- A 21-slide Meridian case-study deck, browsable and downloadable as a PDF.
- A chat that answers from a scripted layer first and falls through to the
  Claude API, whose system prompt is generated from the same source files.
- **Every claim the site makes about the designer traces to `lib/sources/`.**
  The chat must never invent an answer to avoid a fallback. This is enforced
  mechanically by `check:sources` and, during the visual experiment, by
  `check:frozen`.
- The site is statically prerendered at `/`; work that forces it dynamic is a
  regression, not a tradeoff.

**The craft bar is an input, not something a tool elicits.** When a refinement
pass needs a quality benchmark, the project owner names two or three reference
products and their craft level becomes the bar. Impeccable only offers this
mechanic behind the canon action inside its replacement flow (`new-work.md`),
which is not a route this project takes; `polish.md` wants a quality bar as
context but has no way to ask for one. So it is supplied, not discovered.

**Explicitly undecided:** nothing outstanding from this interview.

## Brand Commitments

- **Name: "Edwin Socrates Lara".** Decided during init, replacing "EdwinOS".
  Executed on main. The Claude Design handoff bundle is still cited by its
  real filename, `EdwinOS 1D.dc.html`, because renaming a citation would
  falsify the provenance record.
- **Chat-first interaction is binding.** A direction that turns this into a
  scrolling page violates the product, not the aesthetic.
- **Voice is the designer's own**, recorded verbatim in
  `lib/sources/voice.md`. It is first-person, plain, and specific — "It usually
  starts with data", not "I leverage data-driven insights". Copy may be
  re-presented; it may not be rewritten.
- **No status or availability indicator.** An AVAILABLE badge was removed
  deliberately and is not to be reintroduced. The CURRENTLY block that
  followed it — "Designing the AI coach experience at FutureFit AI" — is
  also gone, replaced by a CONTACT block. **Nothing on the site now shows
  current work at a glance**; FutureFit is still the first rail row and the
  chat still answers it. That is intended, and is a stronger version of the
  same commitment: no recency signalling, no intent, no availability.

## Evidence on Hand

Real, in the repository:

- `lib/sources/framer-export.json` — case-study copy for all seven projects,
  the CMS export the site's project copy derives from.
- `lib/sources/resume.txt` — employment history, dates, education.
- `lib/sources/voice.md` — the designer's own writing, 17 sections.
- `lib/sources/meridian-case-study.txt` — the deck's verbatim text.
- `public/framer/<slug>/` — 32 real project screenshots with written alt text.
- `public/meridian-case-study.pdf` — the real 21-slide deck.

**Absences that must not be fabricated:** there are no testimonials, no press,
no metrics beyond those already stated in the project copy, and no live demo
links. FutureFit AI is in progress and its impacts line reads "work in
progress; coming soon" — that is the truth and must stay.

## Product Principles

1. **The claim is demonstrated, not asserted.** The site's argument for
   AI-native practice is that it is one. Anything that makes it look like a
   conventional portfolio with a chat feature weakens the claim.
2. **Sourced or absent.** Nothing about the designer appears unless it traces
   to a source file. A gap is stated, never filled.
3. **Reward both budgets.** The same surface serves a thirty-second recruiter
   skim and a ten-minute hiring-manager read, without a separate "short
   version".
4. **Seniority is shown by judgment, not adjectives.** The work should read as
   decisions made and defended — which is what the case-study copy already
   does — rather than as claimed expertise.

## Accessibility & Inclusion

WCAG AA is an established requirement, not an aspiration: the incumbent system
already raised a locked palette value (`#767676` → `#8f8f8f`) because it failed
the 4.5:1 floor on real small text. Any direction inherits that bar. Motion
respects `prefers-reduced-motion`; this is implemented and verified, not
intended.

---

## Appendix: the impeccable experiment, August 2026

Not part of the impeccable product schema. Recorded so this is not
re-litigated later.

**What was tried.** An isolated branch (`experiment/impeccable`) evaluated
[impeccable](https://impeccable.style) v3.5.0 as an alternative to the
hand-built Bureau 1D system, with the content layer sealed by
`scripts/check-content-frozen.mjs` and its detector swapped in for
`check-design.mjs` as the build gate.

**What it concluded.** *The tool's mechanical half does not apply to this
codebase.* Its detector matches CSS syntax (`font-family:`) and not React
style-object syntax (`fontFamily:`). Reduced to one variable:

    const a = { fontFamily: "Inter" }   ->  0 findings
    const a = `font-family: Inter;`     ->  1 finding

This repo carries ~102 `style={{ }}` blocks and ~154 camelCase declarations,
so the detector is blind to most of its styling. Run against the whole of
`app/` and `components/` it returned **zero findings and exit 0** — and it
returned zero against a control file containing an AI-default purple gradient,
`Inter`, a clickable `div`, an `<img>` with no alt, a 20x20 button, and
`#999` on `#aaa`. `check-design.mjs`, sixty lines of grep, catches strictly
more here.

**What was kept.** `PRODUCT.md` itself, which the tool's `init` produced and
which is genuinely useful; `check-content-frozen.mjs`; and
`capture-compare.mjs`. The judgment half of the tool — its playbooks — read as
real design thinking and were not the problem.

**What was rejected.** Replacing Bureau 1D. The goal was refinement, and
impeccable's world-selection flow has no refinement path: `SKILL.md` states
"Refinement preserves; redesign replaces... Never split the difference into
polish on the discarded look," and the canon action still replaces `DESIGN.md`.

**If revisited:** check whether the detector has learned to read style objects.
That single gap is what made it inapplicable, not its taste.
