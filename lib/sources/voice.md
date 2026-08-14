# Voice: Edwin's own words

Source file. Everything here is written by Edwin. Anything the chat says
that isn't traceable to this file, framer-export.json, or resume.txt is
not permitted.

<!--
  Operational notes for anyone editing downstream files:

  This file covers what the other two sources can't — design philosophy,
  process, opinions, working preferences, and the Framer site's static
  page copy, which lives outside the CMS and so never appears in
  framer-export.json (see README.md).

  Everything below is VERBATIM. Do not paraphrase it in
  lib/edwin-context.md or lib/scripted-responses.ts. Scripted answers are
  checked character-for-character against this file; see
  lib/voice-answers.ts.

  A question this file doesn't cover must fall through to the refusal
  path, which offers Edwin's email. Never invent an answer to avoid it.
-->

---

## Intro

I'm Edwin, a designer & AI builder making useful products and workflows.

---

## Outside work

In my downtime, I like to stay active by running races, camping or hiking
with my ten-year-old Alaskan Malamute. I'm always reading; my recent reads
include: Meditations by Marcus Aurelius, The Personal MBA by Josh Kaufman,
and How to Win Friends and Influence People by Dale Carnegie.

---

## Currently reading

Right now I'm in the middle of Rock Climbing Technique: The Practical Guide to Movement Mastery by John Kettle, and Simple Numbers, Straight Talk, Big Profits! by Greg Crabtree.

---

## Design process

It usually starts with data. I build integrations into the places feedback already lives (Canny, Clarify) and pull from them directly rather than waiting for a research cycle. From there I move quickly into prototypes, test them remotely with tools like Useberry, and iterate. Once the feedback is in, I make a recommendation on the direction with evidence behind it.

---

## A challenging project

While working on Volkswagen's vehicle comparison tool, leadership set a clear requirement: VW models could only be compared against other VW models. My user research pointed the other way, people cross-shop across brands, and a tool that pretended otherwise would send them elsewhere to do the comparison anyway.

I showed the execs a design that met the underlying goal in a different way. Cross-brand comparison stayed available, but the experience was weighted toward Volkswagen: only VW vehicles carried the rich marketing content, like video, cinematic shots of key features and the first comparison slot came preselected with VW's most popular models, like the Tiguan.

---

## Collaborating with PMs and cross-functional teams

I partner with PMs during the early stages of discovery, by bringing data to the table while defining the problem. In practice that means writing my own scripts in Claude Code to hit the APIs of our internal tools: pulling customer feedback out of Canny, extracting recurring pain points from client conversations in Clarify (our AI meeting tool), and analyzing Heap data with LLMs to discover insights.

I also worked with the customer success and go-to-market teams to stand those integrations up, so market and customer feedback flows into one place and gets distilled with LLM tooling instead of sitting in scattered call notes and support threads.

I meet weekly with my PM, and beyond that I set up the shared infrastructure the team actually uses day to day, including product dashboards that surface roadmap priority and flag quick wins that engineering can pick up, or that I can build and ship myself.

---

## The project I'm most proud of

The work I'm most proud of is the livestream bidding feature I helped ship at NTWRK. At the time, all our videos were prerecorded, people watched, then shopped. The insight was that watch time was the real conversion lever: the longer someone stayed with the content, the more likely they were to buy.

Taking inspiration from Asian livestreaming culture, we introduced live shopping, sellers showcasing products in real time, with viewers bidding on the items they wanted. It gave people a reason to stay, and a reason to act while they were there.

It ended up driving over 63% of NTWRK's revenue.

---

## Strengths and weaknesses

**Weakness**

My weakness is exploring beyond the scope. When I'm given a problem, I tend to follow the threads around it, adjacent opportunities, what the system could become, and that exploration can pull me past what the project actually called for. The work usually gets better for it, but it costs time, and I've had to learn to pull it back to the scope we agreed on.

**Strengths**

My strengths are learning quickly and connecting pieces that don't obviously go together. I'm comfortable starting from an ambiguous direction with no clear brief, scattered data, and turning it into a coherent feature. Part of that is being able to build the tooling I need to understand the problem, and part of it is taste: knowing what "good" is once the picture comes together.

---

## Design tools and Figma proficiency

Proficient with Claude Code, Cursor, GitHub, Vercel, Supabase, CloudFront, S3, and git, along with Claude Design and Figma. Most of my work now happens in LLM-based tools: they let me handle discovery, design, and building in one place rather than moving between separate stacks. I still bring my design fundamentals to that work, applying things like spacing systems and layout principles to what I build with them.

---

## Deadlines and workload

I rank priority collaboratively with PMs and engineering to figure out what's needed first. I weight toward high-impact work and anything with a tight deadline. I track it all in a spreadsheet, revisit the ranking as things shift, and keep everyone current on where things stand.

---

## Where I see myself in five years

I want to be building at the edge of what AI tooling makes possible, running experiments, and turning the ones that work into tools others can adopt. Alongside that, teaching: the vibe coding community is growing fast and under-supported, and I'd like to be one of the people making it easier to get good at this.

---

## Giving and receiving design critique

I hold design reviews to get feedback from key stakeholders, and I use LLM tooling to capture and structure what comes out of them. Rather than letting notes scatter, it gives me a way to see patterns across sessions and decide what's actually worth pursuing.

---

## Prioritizing and making tradeoffs under constraints

I lead with business goals. Design and user experience only exist inside a business that can fund them, and I'm honest that those things sometimes trade against each other. I advocate for users within that, but for net-new work I lean on internal knowledge, because users can't specify what they've never seen.

User research is strongest at the evaluative layer, which of these would you choose, what's unclear, where did this break down. It's weakest at invention. Nobody asks for AI chips in an interface; that comes from understanding the system and what the model can do. With AI especially, the gap between what users can articulate and what's now possible keeps growing.

---

## What I'm looking for in my next role

High autonomy on a team that's genuinely collaborative, one that ships frequently, tests, and iterates hard on whatever's working. I want big swings in the mix: a few of the highest-urgency, highest-stakes features shipped every year, not a roadmap of small increments.

I also want the freedom to build AI tooling and infrastructure, and to work in the codebase directly, shipping accessibility work and smaller features myself rather than handing everything off. And a culture where a prototype is a legitimate way to propose something new.

---

## Conducting user research and validating designs

I test with real prototypes, currently running them remotely through Useberry to get volume on the feedback. Sometimes not the whole prototype either, a first-click test on one page or one feature answers the question faster. On the quantitative side, I'm pairing Heap with LLMs to get more out of the analytics.

---

## Collaborating with engineers on handoff and feasibility

Handoff depends on the work. Sometimes I ship it myself as a pull request; other times I write a codebase rundown with links to the prototype. We're on a shared design system, so it's less about annotating specs and more about the intent. I walk the team through features in review, and I QA and verify them once they're ready.

---

## Using metrics and data to measure success

I build out my own integrations across Canny, Clarify, Heap, and similar tools. I've also started wiring Heap and Contentsquare into my prototypes directly, which lets me do journey mapping on a prototype rather than waiting for production data.

---

## Design fundamentals I work from

A 4-point spacing scale, proximity hierarchy, sibling, parent, grandparent, so spacing communicates relationship, and an 80/20 rule for color balance.

---

## Staying current and finding inspiration

I stay current by following leading design and AI voices on LinkedIn, and I use Mobbin to break down how major apps handle their flows, seeing how established products solve a problem before deciding how I want to.

---

## motusbank and Meridian

The deck refers to the product as motusbank, Meridian Credit Union's digital-only bank. I refer to this work as Meridian throughout.
