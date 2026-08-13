// Clear .next safely.
//
// `rm -rf .next` on its own is the problem this replaces: run while `next dev`
// is live, the server keeps its port and serves nothing, and every CDP probe
// then returns empty selectors that read as a regression in the page rather
// than a wrecked server. Kill first, then delete.
import { execSync } from "child_process"
import { rmSync, existsSync } from "fs"

const running = execSync("pgrep -f 'next dev' || true", { encoding: "utf8" }).trim()
if (running) {
  console.log(`stopping ${running.split("\n").length} dev process(es) before clearing`)
  execSync("pkill -f 'next dev' || true")
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
