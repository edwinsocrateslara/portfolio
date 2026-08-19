import { AppShell } from "@/components/shell/app-shell"
import { resume } from "@/lib/resume"

// The shell itself lives in components/shell/app-shell.tsx because the deck
// route renders it too. This file is only the "/" entry point.
//
// `resume` is parsed from lib/sources/resume.txt HERE, in a server component,
// and passed down. The Resume pane cannot import it: the parser reads the file
// with `fs`, and AppShell is a client tree. Parsing at this boundary keeps the
// source file the single copy — nothing is generated, nothing is retyped.
export default function HomePage() {
  return <AppShell resume={resume} />
}
