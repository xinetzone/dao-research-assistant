import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
  }
  try {
    const el = document.createElement("textarea"); el.value = text;
    el.style.position = "fixed"; el.style.left = "-9999px"; el.style.opacity = "0";
    document.body.appendChild(el); el.focus(); el.select();
    const ok = document.execCommand("copy"); document.body.removeChild(el); return ok;
  } catch { return false; }
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
