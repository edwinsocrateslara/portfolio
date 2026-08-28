// The resolve hook itself. Runs on the loader thread; see ts-extensionless.mjs
// for why it exists.
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context)
  } catch (err) {
    if (err?.code !== "ERR_MODULE_NOT_FOUND") throw err
    if (!specifier.startsWith(".") && !specifier.startsWith("/")) throw err
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      try { return await next(specifier + ext, context) } catch { /* try the next */ }
    }
    throw err
  }
}
