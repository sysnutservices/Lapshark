import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Trim a meta description to a length Google will actually render, cutting on a
 * word boundary so it never ends mid-word. Shared by product and blog metadata.
 */
export function clampMeta(s: string, max = 155) {
  const text = (s || "").replace(/\s+/g, " ").trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  return cut.slice(0, cut.lastIndexOf(" ")).trimEnd() + "…"
}
