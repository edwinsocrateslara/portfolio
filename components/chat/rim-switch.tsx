"use client"

import { useEffect } from "react"

/* TEMPORARY, and it is one attribute. `?rim=fine|hair|wire` puts that value on
 * <html>; app/globals.css keys three --shimmer-inset/--shimmer-blur pairs off
 * it. With no parameter the default pair applies and this component does
 * nothing at all.
 *
 * Delete this file, its mount in app-shell, and the three html[data-rim] rules
 * once a value is chosen — then fold the winner into :root. It exists so the
 * comparison can be made on the running site rather than from a still frame,
 * the same way the dot-field alpha was chosen. */
const VALUES = ["fine", "hair", "wire"]

export function RimSwitch() {
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("rim")
    if (v && VALUES.includes(v)) document.documentElement.dataset.rim = v
    else delete document.documentElement.dataset.rim
  }, [])
  return null
}
