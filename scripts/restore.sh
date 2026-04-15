#!/usr/bin/env bash
# One-command restore after workspace rollback.
# Usage: bash scripts/restore.sh [commit-message]
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; cd "$ROOT"
echo "=== [1/4] Install deps ==="
pip install pymupdf requests -q

echo "=== [2/4] Apply clipboard fix ==="
python3 - << 'EOF'
import os
ROOT = os.getcwd()
for path, old, new in [
    ("src/lib/utils.ts", "export function cn",
     'export async function copyToClipboard(text: string): Promise<boolean> {\n'
     '  if (navigator.clipboard?.writeText) {\n'
     '    try { await navigator.clipboard.writeText(text); return true; } catch {}\n'
     '  }\n'
     '  try {\n'
     '    const el = document.createElement("textarea"); el.value = text;\n'
     '    el.style.position = "fixed"; el.style.left = "-9999px"; el.style.opacity = "0";\n'
     '    document.body.appendChild(el); el.focus(); el.select();\n'
     '    const ok = document.execCommand("copy"); document.body.removeChild(el); return ok;\n'
     '  } catch { return false; }\n'
     '}\nexport function cn'),
    ("src/components/MarkdownRenderer.tsx",
     'import { cn } from "@/lib/utils";',
     'import { cn, copyToClipboard } from "@/lib/utils";'),
]:
    fp = os.path.join(ROOT, path)
    with open(fp, encoding="utf-8") as f: content = f.read()
    if "copyToClipboard" not in content:
        content = content.replace(old, new)
        with open(fp, "w", encoding="utf-8") as f: f.write(content)
        print(f"  patched: {path}")
    else:
        print(f"  skip (already patched): {path}")
# Fix MarkdownRenderer call
fp = os.path.join(ROOT, "src/components/MarkdownRenderer.tsx")
with open(fp, encoding="utf-8") as f: c = f.read()
if "navigator.clipboard.writeText(code)" in c:
    with open(fp, "w", encoding="utf-8") as f:
        f.write(c.replace("navigator.clipboard.writeText(code).then(", "copyToClipboard(code).then("))
    print("  patched: MarkdownRenderer clipboard call")
EOF

echo "=== [3/4] Generate markdown docs ==="
if [ -d "docs/帛书老子注读/德经" ] && [ "$(ls docs/帛书老子注读/德经 | wc -l)" -ge 44 ]; then
    echo "  skip (already exists)"
else
    python3 scripts/pdf2md.py
fi

echo "=== [4/4] Push to GitHub ==="
python3 scripts/github-push.py "${1:-restore: re-apply all patches after workspace rollback}"
echo "=== Done ==="
