#!/usr/bin/env python3
"""
Convert 帛书老子注读.pdf to 82 markdown files.
Usage:  python3 scripts/pdf2md.py
Output: docs/帛书老子注读/{index.md, 德经/001_一.md..., 道经/045_四十五.md...}
"""
import re, os, sys, urllib.request

try:
    import fitz
except ImportError:
    import subprocess as sp
    sp.run([sys.executable, "-m", "pip", "install", "pymupdf", "-q"])
    import fitz

ROOT    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_URL = "https://cdn.enter.pro/resources/uid_100032143/2883.pdf"
PDF_TMP = "/tmp/laozi.pdf"
OUT     = os.path.join(ROOT, "docs", "\u5e1b\u4e66\u8001\u5b50\u6ce8\u8bfb")
DE      = os.path.join(OUT, "\u5fb7\u7ecf")
DAO     = os.path.join(OUT, "\u9053\u7ecf")

CN_NUMS = [
    "\u4e00","\u4e8c","\u4e09","\u56db","\u4e94","\u516d","\u4e03","\u516b","\u4e5d","\u5341",
    "\u5341\u4e00","\u5341\u4e8c","\u5341\u4e09","\u5341\u56db","\u5341\u4e94",
    "\u5341\u516d","\u5341\u4e03","\u5341\u516b","\u5341\u4e5d",
    "\u4e8c\u5341","\u4e8c\u5341\u4e00","\u4e8c\u5341\u4e8c","\u4e8c\u5341\u4e09",
    "\u4e8c\u5341\u56db","\u4e8c\u5341\u4e94","\u4e8c\u5341\u516d","\u4e8c\u5341\u4e03",
    "\u4e8c\u5341\u516b","\u4e8c\u5341\u4e5d",
    "\u4e09\u5341","\u4e09\u5341\u4e00","\u4e09\u5341\u4e8c","\u4e09\u5341\u4e09",
    "\u4e09\u5341\u56db","\u4e09\u5341\u4e94","\u4e09\u5341\u516d","\u4e09\u5341\u4e03",
    "\u4e09\u5341\u516b","\u4e09\u5341\u4e5d",
    "\u56db\u5341","\u56db\u5341\u4e00","\u56db\u5341\u4e8c","\u56db\u5341\u4e09","\u56db\u5341\u56db",
    "\u56db\u5341\u4e94","\u56db\u5341\u516d","\u56db\u5341\u4e03","\u56db\u5341\u516b","\u56db\u5341\u4e5d",
    "\u4e94\u5341","\u4e94\u5341\u4e00","\u4e94\u5341\u4e8c","\u4e94\u5341\u4e09","\u4e94\u5341\u56db",
    "\u4e94\u5341\u4e94","\u4e94\u5341\u516d","\u4e94\u5341\u4e03","\u4e94\u5341\u516b","\u4e94\u5341\u4e5d",
    "\u516d\u5341","\u516d\u5341\u4e00","\u516d\u5341\u4e8c","\u516d\u5341\u4e09","\u516d\u5341\u56db",
    "\u516d\u5341\u4e94","\u516d\u5341\u516d","\u516d\u5341\u4e03","\u516d\u5341\u516b","\u516d\u5341\u4e5d",
    "\u4e03\u5341","\u4e03\u5341\u4e00","\u4e03\u5341\u4e8c","\u4e03\u5341\u4e09","\u4e03\u5341\u56db",
    "\u4e03\u5341\u4e94","\u4e03\u5341\u516d","\u4e03\u5341\u4e03","\u4e03\u5341\u516b","\u4e03\u5341\u4e5d",
    "\u516b\u5341","\u516b\u5341\u4e00",
]

def download_pdf():
    if not os.path.exists(PDF_TMP):
        print("Downloading PDF...", flush=True)
        urllib.request.urlretrieve(PDF_URL, PDF_TMP)

def sec(c, s, *ends):
    i = c.find(s)
    if i < 0: return ""
    i += len(s); e = len(c)
    for end in ends:
        j = c.find(end, i)
        if j >= 0: e = min(e, j)
    return c[i:e].strip()

def fmt_chapter(n, cn, raw):
    raw = re.sub(r"\n\u7ae0\uff09", "\u7ae0\uff09", raw)
    nl = raw.find("\n")
    tl   = raw[:nl].strip() if nl > 0 else raw.strip()
    rest = raw[nl:].lstrip("\n") if nl > 0 else ""
    if rest.startswith("\u7ae0\uff09"):
        tl += "\u7ae0\uff09"; rest = rest[3:].lstrip("\n")
    td    = re.search(r"\u4eca(\d+)\u7ae0", tl)
    today = td.group(1) if td else "?"
    tm    = re.match(r"^[^\u3001]+\u3001(.+?)\uff08\u4eca\d+\u7ae0\uff09", tl)
    title = tm.group(1) if tm else tl
    c    = rest
    bos  = sec(c, "\u5e1b\u4e66\u7248\uff1a", "\u4f20\u4e16\u7248\uff1a")
    ccs  = sec(c, "\u4f20\u4e16\u7248\uff1a", "\u7248\u672c\u5dee\u5f02", "\u76f4\u8bd1")
    diff = sec(c, "\u7248\u672c\u5dee\u5f02", "\u76f4\u8bd1\uff1a").lstrip("\uff1a").strip()
    zh   = sec(c, "\u76f4\u8bd1\uff1a", "\u89e3\u8bfb\uff1a")
    jd   = sec(c, "\u89e3\u8bfb\uff1a")
    p = [f"# \u7b2c{n}\u7ae0\uff08{cn}\uff09{title}", "", f"> **\u5bf9\u5e94\u4eca\u672c**\uff1a\u7b2c {today} \u7ae0", "", "---", ""]
    if bos:  p += [f"## \u5e1b\u4e66\u7248\u539f\u6587\n\n{bos}\n"]
    if ccs:  p += [f"## \u4f20\u4e16\u7248\u539f\u6587\n\n{ccs}\n"]
    if diff: p += [f"## \u7248\u672c\u5dee\u5f02\n\n{diff}\n"]
    if zh:   p += [f"## \u76f4\u8bd1\n\n{zh}\n"]
    if jd:   p += [f"## \u89e3\u8bfb\n\n{jd}\n"]
    return "\n".join(p)

def clean(t):
    t = re.sub(r"[\u5fb7\u9053]\u7ecf\u6ce8\u8bfb\s*", "", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return "\n".join(l.rstrip() for l in t.split("\n")).strip()

def convert():
    download_pdf()
    doc = fitz.open(PDF_TMP)
    print(f"Pages: {len(doc)}", flush=True)
    full_text = "".join(doc[i].get_text() for i in range(11, len(doc)))

    chapter_starts = {}
    for i, cn in enumerate(CN_NUMS):
        positions = [m.start() for m in re.finditer(re.escape(cn + "\u3001"), full_text)]
        if not positions: continue
        real_pos = next(
            (p for p in positions if "\u5e1b\u4e66\u7248" in full_text[p:p+200] or "\u4eca" in full_text[p:p+50]),
            positions[0]
        )
        chapter_starts[i+1] = real_pos

    ordered = sorted(chapter_starts.items(), key=lambda x: x[1])
    assert len(ordered) == 81, f"Expected 81, got {len(ordered)}"
    print(f"Found {len(ordered)} chapters", flush=True)

    os.makedirs(DE, exist_ok=True)
    os.makedirs(DAO, exist_ok=True)

    for idx, (n, sp2) in enumerate(ordered):
        cn = CN_NUMS[n-1]
        ep = ordered[idx+1][1] if idx+1 < len(ordered) else len(full_text)
        md = clean(fmt_chapter(n, cn, full_text[sp2:ep]))
        d  = DE if n <= 44 else DAO
        with open(os.path.join(d, f"{n:03d}_{cn}.md"), "w", encoding="utf-8") as f:
            f.write(md)

    print(f"\u5fb7\u7ecf: {len(os.listdir(DE))}  \u9053\u7ecf: {len(os.listdir(DAO))}", flush=True)

    chapter_info = {}
    for sd in ["\u5fb7\u7ecf", "\u9053\u7ecf"]:
        for fn in sorted(os.listdir(os.path.join(OUT, sd))):
            if not fn.endswith(".md"): continue
            with open(os.path.join(OUT, sd, fn), encoding="utf-8") as f:
                lines = f.readlines()
            m = re.match(r"# \u7b2c(\d+)\u7ae0\uff08(.+?)\uff09(.+)", lines[0].strip())
            if m:
                nn, cn2, t = int(m.group(1)), m.group(2), m.group(3).strip()
                td2 = re.search(r"\u7b2c (\d+) \u7ae0", "".join(lines))
                chapter_info[nn] = {"cn": cn2, "title": t,
                                    "today": td2.group(1) if td2 else "?",
                                    "file": f"{sd}/{fn}"}

    ix = ["# \u5e1b\u4e66\u8001\u5b50\u6ce8\u8bfb \u2014 \u7ae0\u8282\u7d22\u5f15", "",
          "> \u79e6\u6ce2 \u8457 | \u9a6c\u738b\u5806\u5e1b\u4e66\u7532\u4e59\u672c\u6821\u8ba2\uff0c\u53c2\u7167\u4f20\u4e16\u7248\u9010\u7ae0\u5bf9\u6bd4\u6ce8\u8bfb", "",
          "---", "",
          "## \u5fb7\u7ecf\uff081\u201344\u7ae0\uff09", "",
          "| \u5e8f\u53f7 | \u4eca\u672c\u7ae0 | \u6807\u9898 | \u6587\u4ef6 |", "|:---:|:---:|:---|:---|"]
    for nn in range(1, 45):
        info = chapter_info.get(nn, {})
        ix.append(f"| {nn}\uff08{info.get('cn','')}\uff09 | \u7b2c{info.get('today','?')}\u7ae0 | {info.get('title','')} | [{info.get('file','')}]({info.get('file','')}) |")
    ix += ["", "## \u9053\u7ecf\uff0845\u201381\u7ae0\uff09", "",
           "| \u5e8f\u53f7 | \u4eca\u672c\u7ae0 | \u6807\u9898 | \u6587\u4ef6 |", "|:---:|:---:|:---|:---|"]
    for nn in range(45, 82):
        info = chapter_info.get(nn, {})
        ix.append(f"| {nn}\uff08{info.get('cn','')}\uff09 | \u7b2c{info.get('today','?')}\u7ae0 | {info.get('title','')} | [{info.get('file','')}]({info.get('file','')}) |")
    ix += ["", "---", "", "\u6bcf\u7ae0\u5305\u542b\uff1a**\u5e1b\u4e66\u7248\u539f\u6587** \u2192 **\u4f20\u4e16\u7248\u539f\u6587** \u2192 **\u7248\u672c\u5dee\u5f02** \u2192 **\u76f4\u8bd1** \u2192 **\u89e3\u8bfb**"]
    with open(os.path.join(OUT, "index.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(ix))

    total = 1 + len(os.listdir(DE)) + len(os.listdir(DAO))
    print(f"Total: {total} files", flush=True)

if __name__ == "__main__":
    convert()
