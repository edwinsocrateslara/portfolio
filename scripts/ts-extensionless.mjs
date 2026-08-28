// Lets the offline gates import the app's own TypeScript.
//
// WHY. check:render and check:intent assert against the REAL functions rather
// than a copy, which is the only version of those gates worth having. Node
// runs the .ts directly — but Node's ESM resolver requires a file extension,
// while every import in this repo is written extensionless because the bundler
// resolves them. So `import { ICON_STROKE } from "./icons"` inside a file a
// gate imports fails with ERR_MODULE_NOT_FOUND, and the gate dies.
//
// That is not hypothetical. check-intent.mjs carries a note explaining it
// tests a predicate rather than the matcher precisely because of this, and the
// icon work broke check:render the moment lib/inline-markdown.ts imported a
// stroke token. The failure is loud, but it is triggered by an ordinary import
// in app code, which makes it a tax on writing normal code to keep a gate
// alive. This removes the tax.
//
// WHAT IT DOES NOT DO: it never invents a module. It only runs after normal
// resolution has already failed with ERR_MODULE_NOT_FOUND, and only for a
// relative specifier. A genuinely missing import still fails, with the
// original error.
//
//   node --import ./scripts/ts-extensionless.mjs scripts/check-render.mjs
import { register } from "node:module"
register("./ts-extensionless-hooks.mjs", import.meta.url)
