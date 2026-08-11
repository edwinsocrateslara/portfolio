import { AppShell } from "@/components/shell/app-shell"

// The shell itself lives in components/shell/app-shell.tsx because the deck
// route renders it too. This file is only the "/" entry point.
export default function HomePage() {
  return <AppShell />
}
