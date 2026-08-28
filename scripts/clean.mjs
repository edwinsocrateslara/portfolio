// Clear .next safely.
//
// `rm -rf .next` on its own is the problem this replaces: run while `next dev`
// is live, the server keeps its port and serves nothing, and every CDP probe
// then returns empty selectors that read as a regression in the page rather
// than a wrecked server. Kill first, then delete.
import { execSync } from "child_process"
import { rmSync, existsSync } from "fs"

// SCOPED TO THIS CHECKOUT. `pkill -f 'next dev'` matched on the command line,
// which for a Next dev server is just "next dev --turbo" with no path in it —
// so cleaning this portfolio killed every Next dev server on the machine,
// including ones belonging to other projects. Each candidate's working
// directory is checked against this repo's root, and anything else is left
// alone. lsof is the only portable way to read another process's cwd on macOS.
const ROOT = process.cwd()
const candidates = execSync("pgrep -f 'next dev' || true", { encoding: "utf8" })
  .trim().split("\n").filter(Boolean)

const mine = candidates.filter((pid) => {
  try {
    const cwd = execSync(`lsof -a -d cwd -p ${pid} -Fn 2>/dev/null | sed -n 's/^n//p'`,
      { encoding: "utf8" }).trim()
    return cwd === ROOT || cwd.startsWith(ROOT + "/")
  } catch {
    // Unreadable cwd — another user's process, or gone already. Not ours.
    return false
  }
})

const skipped = candidates.length - mine.length
if (skipped > 0) {
  console.log(`leaving ${skipped} dev process(es) alone — not this checkout`)
}
const running = mine.join("\n")
if (running) {
  console.log(`stopping ${mine.length} dev process(es) before clearing`)
  execSync(`kill ${mine.join(" ")} 2>/dev/null || true`)
  // pkill returns before the port is released; give it a moment so a dev
  // server started straight after this does not hit EADDRINUSE.
  execSync("sleep 2")
} else {
  console.log("no dev server running")
}

if (existsSync(".next")) {
  rmSync(".next", { recursive: true, force: true })
  console.log("removed .next")
} else {
  console.log(".next was already absent")
}
console.log("\nrestart with:  npx next dev -p 3200")
