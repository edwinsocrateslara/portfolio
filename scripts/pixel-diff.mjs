// Pixel-diff two PNGs, and say WHERE they differ.
//
// No dependencies, same as shot.mjs. Chrome's Page.captureScreenshot emits
// 8-bit non-interlaced PNG, colour type 2 (RGB) or 6 (RGBA), which is the only
// shape this decodes — anything else throws rather than guessing.
import { inflateSync } from "zlib"

function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG")
  let pos = 8, w = 0, h = 0, depth = 0, type = 0, interlace = 0
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const tag = buf.toString("ascii", pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (tag === "IHDR") {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4)
      depth = data[8]; type = data[9]; interlace = data[12]
    } else if (tag === "IDAT") idat.push(data)
    else if (tag === "IEND") break
    pos += 12 + len
  }
  if (depth !== 8 || interlace !== 0 || (type !== 2 && type !== 6)) {
    throw new Error(`unsupported PNG: depth ${depth}, colour type ${type}, interlace ${interlace}`)
  }
  const ch = type === 6 ? 4 : 3
  const raw = inflateSync(Buffer.concat(idat))
  const stride = w * ch
  const out = Buffer.alloc(w * h * ch)
  // Un-filter, per PNG spec. `prev` is the previous reconstructed scanline.
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const cur = Buffer.alloc(stride)
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0
      const b = prev[i]
      const c = i >= ch ? prev[i - ch] : 0
      let v = line[i]
      if (f === 1) v += a
      else if (f === 2) v += b
      else if (f === 3) v += (a + b) >> 1
      else if (f === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      cur[i] = v & 0xff
    }
    cur.copy(out, y * stride)
    prev = cur
  }
  return { w, h, ch, data: out }
}

/**
 * Compare two PNG buffers.
 *
 * `tolerance` is the per-channel value a pixel may move before it counts as
 * different. It exists for subpixel text rasterisation, NOT as a dial to turn
 * up until a run passes — a real difference moves a channel far further than
 * a rasteriser does.
 *
 * `masks` are [x, y, w, h] rectangles excluded from the comparison, for
 * content that legitimately cannot match. Each one is reported, so a mask can
 * never quietly hide a growing difference.
 */
export function diffPNG(aBuf, bBuf, { tolerance = 24, masks = [] } = {}) {
  const a = decodePNG(aBuf), b = decodePNG(bBuf)
  if (a.w !== b.w || a.h !== b.h) {
    return { sizeMismatch: true, a: [a.w, a.h], b: [b.w, b.h], differing: Infinity, ratio: 1, regions: [] }
  }
  const masked = (x, y) => masks.some(([mx, my, mw, mh]) => x >= mx && x < mx + mw && y >= my && y < my + mh)
  const hit = new Uint8Array(a.w * a.h)
  let differing = 0, maskedPixels = 0
  for (let y = 0; y < a.h; y++) {
    for (let x = 0; x < a.w; x++) {
      if (masked(x, y)) { maskedPixels++; continue }
      const ia = (y * a.w + x) * a.ch, ib = (y * b.w + x) * b.ch
      const d = Math.max(
        Math.abs(a.data[ia] - b.data[ib]),
        Math.abs(a.data[ia + 1] - b.data[ib + 1]),
        Math.abs(a.data[ia + 2] - b.data[ib + 2]),
      )
      if (d > tolerance) { hit[y * a.w + x] = 1; differing++ }
    }
  }

  // Cluster differing pixels into rectangles, so the report can point at a
  // place on the page instead of handing back a count. Flood fill on a coarse
  // grid: a per-pixel fill is exact and slow, and the answer wanted here is
  // "the headline" not "these 9,412 pixels".
  const CELL = 8
  const gw = Math.ceil(a.w / CELL), gh = Math.ceil(a.h / CELL)
  const grid = new Uint8Array(gw * gh)
  for (let y = 0; y < a.h; y++)
    for (let x = 0; x < a.w; x++)
      if (hit[y * a.w + x]) grid[((y / CELL) | 0) * gw + ((x / CELL) | 0)] = 1
  const seen = new Uint8Array(gw * gh)
  const regions = []
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const start = gy * gw + gx
      if (!grid[start] || seen[start]) continue
      let x0 = gx, x1 = gx, y0 = gy, y1 = gy, count = 0
      const stack = [start]
      seen[start] = 1
      while (stack.length) {
        const i = stack.pop(), cx = i % gw, cy = (i / gw) | 0
        count++
        if (cx < x0) x0 = cx; if (cx > x1) x1 = cx
        if (cy < y0) y0 = cy; if (cy > y1) y1 = cy
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
          const nx = cx + dx, ny = cy + dy
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue
          const ni = ny * gw + nx
          if (grid[ni] && !seen[ni]) { seen[ni] = 1; stack.push(ni) }
        }
      }
      regions.push({
        x: x0 * CELL, y: y0 * CELL,
        w: (x1 - x0 + 1) * CELL, h: (y1 - y0 + 1) * CELL,
        cells: count,
      })
    }
  }
  regions.sort((p, q) => q.cells - p.cells)
  return {
    sizeMismatch: false, w: a.w, h: a.h,
    differing, maskedPixels,
    ratio: differing / (a.w * a.h - maskedPixels),
    regions,
  }
}
