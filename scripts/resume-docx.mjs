// A .docx writer, hand-rolled, no dependency.
//
// ── WHY NOT THE `docx` PACKAGE ────────────────────────────────────────────
//
// A .docx is a ZIP of six small XML parts. The library that writes one for you
// brings a zip implementation and a dozen transitive packages, and this repo's
// dependency list is nine runtime packages and seven dev ones, every one of
// them load-bearing.
//
// The deciding reason is not size, though. It is DETERMINISM. The output of
// this script is committed and gated: scripts/check-docs.mjs asserts that the
// hash stamped inside each generated file matches lib/sources/resume.txt, so
// running `npm run build:resume` without editing the source must produce
// BYTE-IDENTICAL files. A document library stamps a creation timestamp, and
// every regeneration would then show up as a diff — which trains you to
// `git checkout` the generated files without looking, which is how a real
// change gets discarded. Every timestamp here is fixed (see DOS_STAMP), so
// identical input gives identical bytes and a diff means something changed.
//
// ── WHAT IT WRITES ────────────────────────────────────────────────────────
//
// The minimum valid WordprocessingML package: content types, package
// relationships, the document, its style definitions, and three property
// parts. The hash lives in docProps/custom.xml as a custom document property,
// which is where a reader is supposed to put its own metadata and which Word
// preserves across an edit-and-save.
//
// ── THE FONT IS CALIBRI, AND THAT IS DELIBERATE ───────────────────────────
//
// The PDF carries the site's typography — Archivo, the real faces, embedded.
// This file is the format someone else OPENS AND EDITS, on their machine, in
// their Word. Naming a face they do not have does not degrade politely: Word
// substitutes, often to a serif, and the document arrives looking like a
// mistake. A face every Word has is the right call for the format whose whole
// purpose is being editable elsewhere.
import { deflateRawSync } from "zlib"

// ── ZIP ───────────────────────────────────────────────────────────────────

/** CRC-32, table built once. The ZIP header requires it; nothing else does. */
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

// A FIXED MODIFICATION TIME, in DOS format: 1980-01-01 00:00:00, the epoch of
// the field itself. See the determinism note at the top — a real clock here
// would make every regeneration a diff.
const DOS_STAMP = { time: 0, date: (1 << 5) | 1 }

/**
 * A ZIP archive from [name, Buffer] pairs, deflated.
 *
 * Deliberately minimal: no ZIP64, no data descriptors, no directory entries.
 * A .docx is six parts of a few kilobytes and none of those features can come
 * into play. If a part ever exceeds 4GB this will be the least of it.
 */
export function zip(entries) {
  const locals = []
  const central = []
  let offset = 0

  for (const [name, data] of entries) {
    const nameBuf = Buffer.from(name, "utf8")
    const body = deflateRawSync(data, { level: 9 })
    const crc = crc32(data)

    const local = Buffer.alloc(30 + nameBuf.length)
    local.writeUInt32LE(0x04034b50, 0) // local file header
    local.writeUInt16LE(20, 4) // version needed
    local.writeUInt16LE(0, 6) // flags
    local.writeUInt16LE(8, 8) // deflate
    local.writeUInt16LE(DOS_STAMP.time, 10)
    local.writeUInt16LE(DOS_STAMP.date, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(body.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28) // extra field length
    nameBuf.copy(local, 30)

    const dir = Buffer.alloc(46 + nameBuf.length)
    dir.writeUInt32LE(0x02014b50, 0) // central directory header
    dir.writeUInt16LE(20, 4) // version made by
    dir.writeUInt16LE(20, 6) // version needed
    dir.writeUInt16LE(0, 8)
    dir.writeUInt16LE(8, 10)
    dir.writeUInt16LE(DOS_STAMP.time, 12)
    dir.writeUInt16LE(DOS_STAMP.date, 14)
    dir.writeUInt32LE(crc, 16)
    dir.writeUInt32LE(body.length, 20)
    dir.writeUInt32LE(data.length, 24)
    dir.writeUInt16LE(nameBuf.length, 28)
    dir.writeUInt16LE(0, 30) // extra
    dir.writeUInt16LE(0, 32) // comment
    dir.writeUInt16LE(0, 34) // disk number
    dir.writeUInt16LE(0, 36) // internal attrs
    dir.writeUInt32LE(0, 38) // external attrs
    dir.writeUInt32LE(offset, 42)
    nameBuf.copy(dir, 46)

    locals.push(local, body)
    central.push(dir)
    offset += local.length + body.length
  }

  const dirBuf = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(dirBuf.length, 12)
  end.writeUInt32LE(offset, 16)

  return Buffer.concat([...locals, dirBuf, end])
}

// ── WordprocessingML ──────────────────────────────────────────────────────

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'

/** One run. `t` may be empty; xml:space="preserve" keeps leading spaces. */
const run = (text, { b = false, i = false, caps = false, size, color, spacing } = {}) =>
  `<w:r><w:rPr>` +
  (b ? "<w:b/>" : "") +
  (i ? "<w:i/>" : "") +
  (caps ? "<w:caps/>" : "") +
  (spacing ? `<w:spacing w:val="${spacing}"/>` : "") +
  (color ? `<w:color w:val="${color}"/>` : "") +
  (size ? `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>` : "") +
  `</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`

/** One paragraph. `after` is spacing below, in twentieths of a point. */
const para = (runs, { after = 0, before = 0, bullet = false, rule = false, tabRight } = {}) =>
  `<w:p><w:pPr>` +
  (bullet ? `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>` : "") +
  (tabRight
    ? `<w:tabs><w:tab w:val="right" w:pos="${tabRight}"/></w:tabs>`
    : "") +
  `<w:spacing w:before="${before}" w:after="${after}" w:line="240" w:lineRule="auto"/>` +
  (rule
    ? `<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="2" w:color="C8C8C8"/></w:pBdr>`
    : "") +
  `</w:pPr>${runs.join("")}</w:p>`

const TAB = `<w:r><w:tab/></w:r>`

// Letter, 0.6in margins. Twips: 1in = 1440.
const SECTION =
  `<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>` +
  `<w:pgMar w:top="864" w:right="864" w:bottom="864" w:left="864" ` +
  `w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>`

const RIGHT_TAB = 12240 - 864 * 2 // the right margin, in twips

const STYLES =
  XML +
  `<w:styles ${W}>` +
  `<w:docDefaults><w:rPrDefault><w:rPr>` +
  `<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>` +
  `<w:sz w:val="19"/><w:szCs w:val="19"/>` +
  `<w:color w:val="1A1A1A"/>` +
  `</w:rPr></w:rPrDefault>` +
  `<w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault>` +
  `</w:docDefaults>` +
  `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>` +
  `</w:styles>`

// One list definition, so `bullet: true` paragraphs render as bullets rather
// than as paragraphs that happen to start with a character.
const NUMBERING =
  XML +
  `<w:numbering ${W}>` +
  `<w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0">` +
  `<w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="—"/>` +
  `<w:lvlJc w:val="left"/>` +
  `<w:pPr><w:ind w:left="288" w:hanging="288"/></w:pPr>` +
  `<w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr>` +
  `</w:lvl></w:abstractNum>` +
  `<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>` +
  `</w:numbering>`

/**
 * The whole package, as a Buffer.
 *
 * @param resume  the parsed lib/resume.ts shape
 * @param hash    the resume.txt stamp, written to docProps/custom.xml
 */
export function buildDocx(resume, hash) {
  const body = []

  // ── head: name, contact, summary ───────────────────────────────────────
  body.push(para([run(resume.name, { b: true, size: 40, spacing: -8 })], { after: 60 }))
  body.push(
    para([run(resume.contact.join("   ·   "), { size: 17, color: "5A5A5A" })], { after: 140, rule: true })
  )
  body.push(para([run(resume.summary)], { after: 260 }))

  const heading = (text) =>
    para([run(text, { b: true, caps: true, size: 17, spacing: 30, color: "5A5A5A" })], {
      after: 100,
      before: 60,
      rule: true,
    })

  // ── experience ─────────────────────────────────────────────────────────
  body.push(heading("Experience"))
  for (const role of resume.roles) {
    body.push(
      para(
        [
          run(role.employer, { b: true, size: 21 }),
          run(`  ${role.location}`, { size: 17, color: "5A5A5A" }),
          TAB,
          run(role.dates, { size: 17, color: "5A5A5A" }),
        ],
        { after: 20, before: 140, tabRight: RIGHT_TAB }
      )
    )
    body.push(para([run(role.title, { i: true, color: "3C3C3C" })], { after: 80 }))
    for (const group of role.groups) {
      if (group.label) body.push(para([run(group.label, { b: true })], { after: 40, before: 60 }))
      for (const b of group.bullets) body.push(para([run(b)], { after: 40, bullet: true }))
    }
  }

  // ── skills ─────────────────────────────────────────────────────────────
  body.push(heading("Skills & Methodologies"))
  for (const band of resume.skills) {
    body.push(
      para([run(`${band.label}: `, { b: true }), run(band.items.join(", "))], { after: 60 })
    )
  }

  // ── education ──────────────────────────────────────────────────────────
  body.push(heading("Education"))
  for (const e of resume.education) {
    body.push(
      para(
        [run(e.qualification, { b: true }), TAB, run(e.institution, { size: 17, color: "5A5A5A" })],
        { after: 40, tabRight: RIGHT_TAB }
      )
    )
  }

  const document = XML + `<w:document ${W}><w:body>${body.join("")}${SECTION}</w:body></w:document>`

  const contentTypes =
    XML +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
    `<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>` +
    `<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>` +
    `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
    `<Override PartName="/docProps/custom.xml" ContentType="application/vnd.openxmlformats-officedocument.custom-properties+xml"/>` +
    `</Types>`

  const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  const rels =
    XML +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/>` +
    `<Relationship Id="rId2" Type="${R}/metadata/core-properties" Target="docProps/core.xml"/>` +
    `<Relationship Id="rId3" Type="${R}/custom-properties" Target="docProps/custom.xml"/>` +
    `</Relationships>`

  const docRels =
    XML +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="${R}/styles" Target="styles.xml"/>` +
    `<Relationship Id="rId2" Type="${R}/numbering" Target="numbering.xml"/>` +
    `</Relationships>`

  // No dcterms:created / dcterms:modified — see the determinism note.
  const core =
    XML +
    `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ` +
    `xmlns:dc="http://purl.org/dc/elements/1.1/">` +
    `<dc:title>${esc(resume.name)} — Resume</dc:title>` +
    `<dc:creator>${esc(resume.name)}</dc:creator>` +
    `</cp:coreProperties>`

  const custom =
    XML +
    `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" ` +
    `xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">` +
    `<property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="2" name="ResumeSourceHash">` +
    `<vt:lpwstr>${esc(hash)}</vt:lpwstr></property>` +
    `</Properties>`

  const B = (s) => Buffer.from(s, "utf8")
  return zip([
    ["[Content_Types].xml", B(contentTypes)],
    ["_rels/.rels", B(rels)],
    ["word/document.xml", B(document)],
    ["word/styles.xml", B(STYLES)],
    ["word/numbering.xml", B(NUMBERING)],
    ["word/_rels/document.xml.rels", B(docRels)],
    ["docProps/core.xml", B(core)],
    ["docProps/custom.xml", B(custom)],
  ])
}
