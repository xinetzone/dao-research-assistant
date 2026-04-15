import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";
import { DAODEJING_CHAPTERS, type DaodejingChapter } from "@/data/daodejing-index";

// ── Footnote markers ────────────────────────────────────────────────────────
const MARKER_CHARS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮";
const MARKER_RE = new RegExp(`([${MARKER_CHARS}])`, "g");

type Footnotes = Record<string, string>;

/** Extract ① → explanation mapping from the 版本差异 section */
function parseFootnotes(versionDiff: string): Footnotes {
  const notes: Footnotes = {};
  const parts = versionDiff.split(new RegExp(`(?=^[${MARKER_CHARS}])`, "m"));
  for (const part of parts) {
    const m = part.match(new RegExp(`^([${MARKER_CHARS}])\\s*([\\s\\S]+)`));
    if (m) notes[m[1]] = m[2].trim();
  }
  return notes;
}

/** Render plain text with footnote markers as hoverable tooltips */
function AnnotatedText({ text, footnotes }: { text: string; footnotes: Footnotes }) {
  const hasNotes = Object.keys(footnotes).length > 0;

  // Normalize single newlines to spaces (Chinese paragraph flow)
  const normalized = text.replace(/\n(?!\n)/g, "");
  const paragraphs = normalized.split(/\n{2,}/);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3 leading-[1.9] text-foreground/90">
        {paragraphs.map((para, pi) => {
          if (!hasNotes || !MARKER_RE.test(para)) {
            return <p key={pi}>{para}</p>;
          }
          const segments = para.split(MARKER_RE);
          return (
            <p key={pi}>
              {segments.map((seg, si) =>
                footnotes[seg] ? (
                  <Tooltip key={si}>
                    <TooltipTrigger asChild>
                      <sup
                        className={cn(
                          "inline-flex cursor-help select-none mx-px",
                          "text-[0.65em] font-bold text-primary align-super",
                          "rounded-full px-0.5",
                          "hover:bg-primary/15 transition-colors"
                        )}
                      >
                        {seg}
                      </sup>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-xs sm:max-w-sm p-3 leading-relaxed"
                    >
                      <p className="text-xs">{footnotes[seg]}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <span key={si}>{seg}</span>
                )
              )}
            </p>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

// ── Section parser ──────────────────────────────────────────────────────────
interface ChapterSections {
  intro: string;
  boshu: string;
  chuanshi: string;
  versionDiff: string;    // 版本差异 (raw, for footnote parsing)
  rest: string;           // 版本差异 + 直译 + 解读 (for rendering)
}

function parseChapterSections(raw: string): ChapterSections {
  const parts = raw.split(/^(?=## )/m);
  let intro = "";
  let boshu = "";
  let chuanshi = "";
  let versionDiff = "";
  const restParts: string[] = [];

  for (const part of parts) {
    if (!part.startsWith("## ")) {
      intro = part;
    } else if (part.startsWith("## 帛书版原文")) {
      boshu = part.replace(/^## 帛书版原文\s*\n/, "").trimEnd();
    } else if (part.startsWith("## 传世版原文")) {
      chuanshi = part.replace(/^## 传世版原文\s*\n/, "").trimEnd();
    } else {
      if (part.startsWith("## 版本差异")) {
        versionDiff = part.replace(/^## 版本差异\s*\n/, "").trimEnd();
      }
      restParts.push(part);
    }
  }

  return { intro, boshu, chuanshi, versionDiff, rest: restParts.join("") };
}

const DE_CHAPTERS = DAODEJING_CHAPTERS.filter(c => c.section === "德经");
const DAO_CHAPTERS = DAODEJING_CHAPTERS.filter(c => c.section === "道经");

function ChapterList({
  chapters,
  selected,
  onSelect,
}: {
  chapters: DaodejingChapter[];
  selected: DaodejingChapter | null;
  onSelect: (c: DaodejingChapter) => void;
}) {
  return (
    <div className="space-y-0.5">
      {chapters.map(ch => (
        <button
          key={ch.num}
          onClick={() => onSelect(ch)}
          className={cn(
            "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
            "flex items-start gap-2 group",
            selected?.num === ch.num
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-muted/60 text-foreground/70 hover:text-foreground"
          )}
        >
          <span className={cn(
            "shrink-0 text-xs font-mono mt-0.5 w-7",
            selected?.num === ch.num ? "text-primary/70" : "text-muted-foreground"
          )}>
            {String(ch.num).padStart(2, "0")}
          </span>
          <span className="leading-snug">{ch.title}</span>
        </button>
      ))}
    </div>
  );
}

function TOCPanel({
  selected,
  onSelect,
}: {
  selected: DaodejingChapter | null;
  onSelect: (c: DaodejingChapter) => void;
}) {
  const selectedInDe = selected ? selected.section === "德经" : true;
  const [deOpen, setDeOpen] = useState(true);
  const [daoOpen, setDaoOpen] = useState(!selectedInDe);

  // Auto-expand the section containing the selected chapter
  useEffect(() => {
    if (selected?.section === "德经") setDeOpen(true);
    if (selected?.section === "道经") setDaoOpen(true);
  }, [selected]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">帛书老子注读</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">秦波 著 · 81章</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* 德经 */}
          <Collapsible open={deOpen} onOpenChange={setDeOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left group">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10">德经</span>
                  <span className="text-xs text-muted-foreground">第 1–44 章</span>
                </div>
                {deOpen
                  ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-1 mt-0.5 pb-1">
                <ChapterList chapters={DE_CHAPTERS} selected={selected} onSelect={onSelect} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 道经 */}
          <Collapsible open={daoOpen} onOpenChange={setDaoOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left group">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-accent-foreground px-1.5 py-0.5 rounded bg-accent">道经</span>
                  <span className="text-xs text-muted-foreground">第 45–81 章</span>
                </div>
                {daoOpen
                  ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-1 mt-0.5 pb-1">
                <ChapterList chapters={DAO_CHAPTERS} selected={selected} onSelect={onSelect} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
}

export default function DaodejingPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<DaodejingChapter | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  const sections = useMemo(() => parseChapterSections(content), [content]);
  const footnotes = useMemo(() => parseFootnotes(sections.versionDiff), [sections.versionDiff]);

  const loadChapter = useCallback(async (ch: DaodejingChapter) => {
    setSelected(ch);
    setLoading(true);
    setContent("");
    try {
      const res = await fetch(`/docs/帛书老子注读/${ch.file}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setContent(text);
    } catch {
      setContent(`# 加载失败\n\n无法加载章节内容，请稍后重试。`);
    } finally {
      setLoading(false);
    }
    setTocOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const currentIndex = selected ? DAODEJING_CHAPTERS.findIndex(c => c.num === selected.num) : -1;
  const prevChapter = currentIndex > 0 ? DAODEJING_CHAPTERS[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < DAODEJING_CHAPTERS.length - 1
    ? DAODEJING_CHAPTERS[currentIndex + 1]
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop TOC sidebar */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-border bg-sidebar-background">
        <TOCPanel selected={selected} onSelect={loadChapter} />
      </aside>

      {/* Mobile TOC sheet */}
      <Sheet open={tocOpen} onOpenChange={setTocOpen}>
        <SheetContent side="left" className="w-80 p-0 flex flex-col gap-0" aria-describedby={undefined}>
          <SheetHeader className="sr-only">
            <SheetTitle>章节目录</SheetTitle>
          </SheetHeader>
          <TOCPanel selected={selected} onSelect={loadChapter} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b-2 border-dashed border-foreground/15 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">返回</span>
            </Button>

            <div className="h-4 w-px bg-border mx-1" />

            {/* Mobile TOC button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setTocOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-semibold truncate">
                {selected
                  ? `第${selected.num}章（${selected.cn}）`
                  : "帛书老子注读"}
              </span>
              {selected?.todayChapter && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  今本第{selected.todayChapter}章
                </Badge>
              )}
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            // Welcome / intro
            <div className="flex items-center justify-center h-full p-8">
              <div className="max-w-md text-center space-y-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent border border-border">
                  <BookOpen className="h-8 w-8 text-accent-foreground" />
                </div>
                <h2 className="text-2xl font-bold">帛书老子注读</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  秦波 著。基于马王堆帛书甲乙本校订，与传世王弼本逐章对比注读。
                  共 81 章，分德经（38–81章今本）与道经（1–37章今本）两部分。
                </p>
                <p className="text-xs text-muted-foreground">
                  从左侧目录选择章节开始阅读
                </p>
                <Button
                  className="lg:hidden mt-2"
                  onClick={() => setTocOpen(true)}
                >
                  <Menu className="h-4 w-4 mr-2" />
                  打开章节目录
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
              {/* Title + intro (# heading, quote, hr) */}
              <MarkdownRenderer content={sections.intro} />

              {/* Two-column comparison */}
              {(sections.boshu || sections.chuanshi) && (
                <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-0 rounded-xl border border-border overflow-hidden">
                  {/* 帛书版 */}
                  <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-border bg-primary/5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                        帛书版原文
                      </span>
                    </div>
                    <AnnotatedText text={sections.boshu} footnotes={footnotes} />
                  </div>
                  {/* 传世版 */}
                  <div className="p-4 md:p-5 bg-accent/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground border border-border">
                        传世版原文
                      </span>
                    </div>
                    <MarkdownRenderer content={sections.chuanshi} />
                  </div>
                </div>
              )}

              {/* 版本差异 + 直译 + 解读 */}
              {sections.rest && <MarkdownRenderer content={sections.rest} />}

              {/* Prev / Next navigation */}
              <div className="mt-10 pt-6 border-t border-border flex justify-between gap-4">
                <div className="flex-1">
                  {prevChapter && (
                    <button
                      onClick={() => loadChapter(prevChapter)}
                      className="group text-left space-y-1 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/40 transition-all w-full"
                    >
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        上一章
                      </div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                        第{prevChapter.num}章 · {prevChapter.title}
                      </p>
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  {nextChapter && (
                    <button
                      onClick={() => loadChapter(nextChapter)}
                      className="group text-right space-y-1 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/40 transition-all w-full"
                    >
                      <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                        下一章
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                        第{nextChapter.num}章 · {nextChapter.title}
                      </p>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
