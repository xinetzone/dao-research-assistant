#!/usr/bin/env bash
# restore.sh — Re-applies all patches lost after workspace rollback.
# Run: bash scripts/restore.sh [commit-message]
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=== [1/4] Install Python deps ==="
pip install pymupdf requests -q

echo "=== [2/4] Apply clipboard fix ==="
python3 - << 'EOF'
import re, os

ROOT = os.getcwd()

# --- utils.ts ---
utils_path = os.path.join(ROOT, "src/lib/utils.ts")
with open(utils_path, encoding="utf-8") as f:
    content = f.read()

if "copyToClipboard" not in content:
    patch = '''
/**
 * iframe-safe clipboard copy.
 * Tries navigator.clipboard first; falls back to position:fixed textarea
 * + execCommand for environments where Clipboard API is blocked.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.left = "-9999px";
    el.style.top = "-9999px";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus(); el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch { return false; }
}
'''
    with open(utils_path, "a", encoding="utf-8") as f:
        f.write(patch)
    print("  utils.ts: copyToClipboard added")
else:
    print("  utils.ts: already patched")

# --- MarkdownRenderer.tsx ---
mr_path = os.path.join(ROOT, "src/components/MarkdownRenderer.tsx")
with open(mr_path, encoding="utf-8") as f:
    content = f.read()

if "copyToClipboard" not in content:
    content = content.replace(
        'import { cn } from "@/lib/utils";',
        'import { cn, copyToClipboard } from "@/lib/utils";'
    )
    content = content.replace(
        "navigator.clipboard.writeText(code).then(",
        "copyToClipboard(code).then("
    )
    with open(mr_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("  MarkdownRenderer.tsx: patched")
else:
    print("  MarkdownRenderer.tsx: already patched")
EOF

echo "=== [3/4] Generate 帛书老子注读 markdown ==="
if [ ! -d "docs/帛书老子注读/德经" ]; then
    python3 scripts/pdf2md.py
else
    echo "  docs already exist, skipping"
fi

echo "=== [4/4] Git commit + GitHub push ==="
git add -A
MSG="${1:-restore: re-apply clipboard fix + 帛书老子注读 82md after workspace rollback}"
git commit -m "$MSG" || echo "  nothing to commit"
python3 scripts/github-push.py "$MSG"

echo "=== Done ==="
