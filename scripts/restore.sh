#!/usr/bin/env bash
# One-command restore after workspace rollback.
# Usage: bash scripts/restore.sh [commit-message]
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; cd "$ROOT"
echo "=== [1/5] Install deps ==="; pip install pymupdf requests -q
echo "=== [2/5] Apply clipboard fix ==="; python3 - << 'PYEOF'
import os
ROOT = os.getcwd()
for path, old, new in [
    ("src/lib/utils.ts",
     'export function cn',
     '''export async function copyToClipboard(text: string): Promise<boolean> {
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
export function cn'''),
    ("src/components/MarkdownRenderer.tsx",
     'import { cn } from "@/lib/utils";',
     'import { cn, copyToClipboard } from "@/lib/utils";'),
]:
    fp = os.path.join(ROOT, path)
    with open(fp, encoding="utf-8") as f: content = f.read()
    key = "copyToClipboard" if "utils" in path else "copyToClipboard"
    if key not in content:
        content = content.replace(old, new)
        with open(fp, "w", encoding="utf-8") as f: f.write(content)
        print(f"  patched: {path}")
    else:
        print(f"  skip (already patched): {path}")
PYEOF
echo "=== [3/5] Generate markdown docs ==="; [ -d "docs/帛书老子注读/德经" ] && echo "  skip" || python3 scripts/pdf2md.py
echo "=== [4/5] Git commit ==="; git add -A
MSG="${1:-restore: re-apply all patches after workspace rollback}"
git commit -m "$MSG" || echo "  nothing to commit"
echo "=== [5/5] Push to GitHub ==="; python3 scripts/github-push.py "$MSG"
echo "=== Done ==="
