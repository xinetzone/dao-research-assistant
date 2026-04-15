#!/usr/bin/env python3
"""Convert 帛书老子注读.pdf to 82 Markdown files (81 chapters + index).
Usage: python3 scripts/pdf2md.py
Requires: pip install pymupdf
"""
import re, os, urllib.request
try: import fitz
except ImportError:
    import subprocess, sys
    subprocess.run([sys.executable,"-m","pip","install","pymupdf","-q"])
    import fitz

PDF_URL = "https://cdn.enter.pro/resources/uid_100032143/2883.pdf"
PDF_PATH = "/tmp/帛书老子注读.pdf"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "帛书老子注读")

CN_NUMS = ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','二十一','二十二','二十三','二十四','二十五','二十六','二十七','二十八','二十九','三十','三十一','三十二','三十三','三十四','三十五','三十六','三十七','三十八','三十九','四十','四十一','四十二','四十三','四十四','四十五','四十六','四十七','四十八','四十九','五十','五十一','五十二','五十三','五十四','五十五','五十六','五十七','五十八','五十九','六十','六十一','六十二','六十三','六十四','六十五','六十六','六十七','六十八','六十九','七十','七十一','七十二','七十三','七十四','七十五','七十六','七十七','七十八','七十九','八十','八十一']

def download():
    if not os.path.exists(PDF_PATH):
        print(f"Downloading PDF..."); urllib.request.urlretrieve(PDF_URL, PDF_PATH)
    return PDF_PATH

def extract_text(pdf_path):
    doc = fitz.open(pdf_path)
    return "".join(doc[i].get_text() for i in range(11, len(doc)))

def find_chapters(text):
    starts = {}
    for i, cn in enumerate(CN_NUMS):
        positions = [m.start() for m in re.finditer(re.escape(cn+'、'), text)]
        if not positions: continue
        real = next((p for p in positions if '帛书版' in text[p:p+200] or '今' in text[p:p+50]), positions[0])
        starts[i+1] = real
    ordered = sorted(starts.items(), key=lambda x: x[1])
    assert len(ordered) == 81, f"Expected 81 chapters, got {len(ordered)}"
    # Find content end (before appendix)
    end = next((text.find(m) for m in ['\n附录\n','附录\n帛书','附录'] if text.find(m) > 0), len(text))
    return ordered, end

def sec(c, s, *ends):
    i = c.find(s)
    if i < 0: return ""
    i += len(s); e = len(c)
    for end in ends:
        j = c.find(end, i)
        if j >= 0: e = min(e, j)
    return c[i:e].strip()

def fmt_chapter(n, cn, raw):
    raw = re.sub(r'\n章）', '章）', raw)
    nl = raw.find('\n'); tl = raw[:nl].strip() if nl > 0 else raw.strip()
    rest = raw[nl:].lstrip('\n') if nl > 0 else ""
    if rest.startswith('章）'): tl += '章）'; rest = rest[3:].lstrip('\n')
    td = re.search(r'今(\d+)章', tl); today = td.group(1) if td else '?'
    tm = re.match(r'^[^、]+、(.+?)（今\d+章）', tl); title = tm.group(1) if tm else tl
    bos = sec(rest,'帛书版：','传世版：'); ccs = sec(rest,'传世版：','版本差异','直译')
    diff = sec(rest,'版本差异','直译：').lstrip('：').strip()
    zh = sec(rest,'直译：','解读：'); jd = sec(rest,'解读：')
    p = [f"# 第{n}章（{cn}）{title}", "", f"> **对应今本**：第 {today} 章", "", "---", ""]
    if bos: p += [f"## 帛书版原文\n\n{bos}\n"]
    if ccs: p += [f"## 传世版原文\n\n{ccs}\n"]
    if diff: p += [f"## 版本差异\n\n{diff}\n"]
    if zh: p += [f"## 直译\n\n{zh}\n"]
    if jd: p += [f"## 解读\n\n{jd}\n"]
    return '\n'.join(p)

def clean(t):
    t = re.sub(r'[德道]经注读\s*', '', t); t = re.sub(r'\n{3,}', '\n\n', t)
    return '\n'.join(l.rstrip() for l in t.split('\n')).strip()

def main():
    os.makedirs(f"{OUT}/德经", exist_ok=True)
    os.makedirs(f"{OUT}/道经", exist_ok=True)
    text = extract_text(download())
    ordered, content_end = find_chapters(text)
    chapter_info = {}
    for idx,(n,sp) in enumerate(ordered):
        cn = CN_NUMS[n-1]
        ep = ordered[idx+1][1] if idx+1 < len(ordered) else content_end
        d = "德经" if n<=44 else "道经"
        content = clean(fmt_chapter(n, cn, text[sp:ep]))
        path = f"{OUT}/{d}/{n:03d}_{cn}.md"
        with open(path, "w", encoding="utf-8") as f: f.write(content)
        # parse for index
        lines = content.split('\n')
        m = re.match(r'# 第(\d+)章（(.+?)）(.+)', lines[0])
        if m:
            td2 = re.search(r'第 (\d+) 章', content)
            chapter_info[n] = {"cn":m.group(2),"title":m.group(3),"today":td2.group(1) if td2 else "?","file":f"{d}/{n:03d}_{cn}.md"}
    # Write index
    ix = ["# 帛书老子注读 — 章节索引", "", "> 秦波 著 | 马王堆帛书甲乙本校订，参照传世版逐章对比注读", "", "---", "",
          "## 德经（1–44章）", "", "| 序号 | 今本章 | 标题 | 文件 |", "|:---:|:---:|:---|:---|"]
    for n in range(1,45):
        i=chapter_info.get(n,{}); ix.append(f"| {n}（{i.get('cn','')}） | 第{i.get('today','?')}章 | {i.get('title','')} | [{i.get('file','')}]({i.get('file','')}) |")
    ix += ["", "## 道经（45–81章）", "", "| 序号 | 今本章 | 标题 | 文件 |", "|:---:|:---:|:---|:---|"]
    for n in range(45,82):
        i=chapter_info.get(n,{}); ix.append(f"| {n}（{i.get('cn','')}） | 第{i.get('today','?')}章 | {i.get('title','')} | [{i.get('file','')}]({i.get('file','')}) |")
    ix += ["", "---", "", "每章包含：**帛书版原文** → **传世版原文** → **版本差异** → **直译** → **解读**"]
    with open(f"{OUT}/index.md", "w", encoding="utf-8") as f: f.write('\n'.join(ix))
    print(f"Done: 82 files in {OUT}")

if __name__ == "__main__":
    main()
