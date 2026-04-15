import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronRight, Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  t,
}: {
  selected: DaodejingChapter | null;
  onSelect: (c: DaodejingChapter) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const selectedInDe = selected ? selected.section === "德经" : true;
  const [deOpen, setDeOpen] = useState(true);
  const [daoOpen, setDaoOpen] = useState(!selectedInDe);
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-expand the section containing the selected chapter
  useEffect(() => {
    if (selected?.section === "德经") setDeOpen(true);
    if (selected?.section === "道经") setDaoOpen(true);
  }, [selected]);

  // When searching, expand both sections
  useEffect(() => {
    if (searchQuery.trim()) {
      setDeOpen(true);
      setDaoOpen(true);
    }
  }, [searchQuery]);

  // Filter chapters by search query
  const filteredDeChapters = useMemo(() => {
    if (!searchQuery.trim()) return DE_CHAPTERS;
    const query = searchQuery.toLowerCase();
    return DE_CHAPTERS.filter(ch =>
      String(ch.num).includes(query) ||
      ch.cn.includes(query) ||
      ch.title.toLowerCase().includes(query) ||
      ch.todayChapter.includes(query)
    );
  }, [searchQuery]);

  const filteredDaoChapters = useMemo(() => {
    if (!searchQuery.trim()) return DAO_CHAPTERS;
    const query = searchQuery.toLowerCase();
    return DAO_CHAPTERS.filter(ch =>
      String(ch.num).includes(query) ||
      ch.cn.includes(query) ||
      ch.title.toLowerCase().includes(query) ||
      ch.todayChapter.includes(query)
    );
  }, [searchQuery]);

  const hasResults = filteredDeChapters.length > 0 || filteredDaoChapters.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{t("daodejing.title")}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{t("daodejing.author")}</p>
      </div>

      {/* Search box */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("daodejing.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-8 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {!hasResults && searchQuery ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t("daodejing.noResults")}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {/* 德经 */}
            {filteredDeChapters.length > 0 && (
              <Collapsible open={deOpen} onOpenChange={setDeOpen}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left group">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">{t("daodejing.dejing")}</span>
                      {searchQuery && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{filteredDeChapters.length}</Badge>}
                    </div>
                    {deOpen
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-1 mt-0.5 pb-1">
                    <ChapterList chapters={filteredDeChapters} selected={selected} onSelect={onSelect} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* 道经 */}
            {filteredDaoChapters.length > 0 && (
              <Collapsible open={daoOpen} onOpenChange={setDaoOpen}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left group">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-accent-foreground">{t("daodejing.daojing")}</span>
                      {searchQuery && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{filteredDaoChapters.length}</Badge>}
                    </div>
                    {daoOpen
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-1 mt-0.5 pb-1">
                    <ChapterList chapters={filteredDaoChapters} selected={selected} onSelect={onSelect} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

const STORAGE_KEY = "daodejing-last-chapter";

export default function DaodejingPage() {
  const navigate = useNavigate();
  const { chapter: chapterParam } = useParams<{ chapter?: string }>();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<DaodejingChapter | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  const sections = useMemo(() => parseChapterSections(content), [content]);
  const footnotes = useMemo(() => parseFootnotes(sections.versionDiff), [sections.versionDiff]);

  const loadChapter = useCallback(async (ch: DaodejingChapter, updateUrl = true) => {
    setSelected(ch);
    setLoading(true);
    setContent("");
    
    // Update URL without triggering navigation
    if (updateUrl) {
      navigate(`/daodejing/${ch.num}`, { replace: false });
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, String(ch.num));
    } catch { /* private browsing */ }
    try {
      const res = await fetch(`/docs/帛书老子注读/${ch.file}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setContent(text);
    } catch {
      setContent(`# ${t("daodejing.loadFailed")}\n\n...`);
    } finally {
      setLoading(false);
    }
    setTocOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [t, navigate]);

  // Restore last-read chapter from localStorage
  const lastReadChapter = useMemo(() => {
    try {
      const num = Number(localStorage.getItem(STORAGE_KEY));
      return DAODEJING_CHAPTERS.find(c => c.num === num) ?? null;
    } catch { return null; }
  }, []);

  // Load chapter from URL param or restore last-read chapter
  useEffect(() => {
    if (chapterParam) {
      const num = Number(chapterParam);
      const chapter = DAODEJING_CHAPTERS.find(c => c.num === num);
      if (chapter && chapter.num !== selected?.num) {
        loadChapter(chapter, false); // Don't update URL (we're already at this URL)
      }
    } else if (!selected && lastReadChapter) {
      // No URL param and no selected chapter -> restore last-read
      loadChapter(lastReadChapter, true); // Update URL to reflect restored chapter
    }
  }, [chapterParam, selected, lastReadChapter, loadChapter]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          if (prevChapter) {
            e.preventDefault();
            loadChapter(prevChapter);
          }
          break;
        case "ArrowRight":
          if (nextChapter) {
            e.preventDefault();
            loadChapter(nextChapter);
          }
          break;
        case "Escape":
          e.preventDefault();
          // On desktop, navigate home; on mobile, open TOC
          if (window.innerWidth >= 1024) {
            navigate("/");
          } else {
            setTocOpen(true);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevChapter, nextChapter, loadChapter, navigate, setTocOpen]);

  const currentIndex = selected ? DAODEJING_CHAPTERS.findIndex(c => c.num === selected.num) : -1;
  const prevChapter = currentIndex > 0 ? DAODEJING_CHAPTERS[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < DAODEJING_CHAPTERS.length - 1
    ? DAODEJING_CHAPTERS[currentIndex + 1]
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop TOC sidebar */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-border bg-sidebar-background">
        <TOCPanel selected={selected} onSelect={loadChapter} t={t} />
      </aside>

      {/* Mobile TOC sheet */}
      <Sheet open={tocOpen} onOpenChange={setTocOpen}>
        <SheetContent side="left" className="w-80 p-0 flex flex-col gap-0" aria-describedby={undefined}>
          <SheetHeader className="sr-only">
            <SheetTitle>{t("daodejing.toc")}</SheetTitle>
          </SheetHeader>
          <TOCPanel selected={selected} onSelect={loadChapter} t={t} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b-2 border-dashed border-foreground/15 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">{t("daodejing.back")}</span>
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
                  ? t("daodejing.chapter", { num: selected.num, cn: selected.cn })
                  : t("daodejing.title")}
              </span>
              {selected?.todayChapter && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {`#${selected.todayChapter}`}
                </Badge>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {selected && (
            <div className="px-4 pb-2">
              <div className="flex items-center gap-3">
                <Progress 
                  value={(currentIndex + 1) / DAODEJING_CHAPTERS.length * 100} 
                  className="h-1.5 flex-1"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                  {t("daodejing.progress", { current: currentIndex + 1, total: DAODEJING_CHAPTERS.length })}
                </span>
              </div>
            </div>
          )}
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
                <h2 className="text-2xl font-bold">{t("daodejing.title")}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("daodejing.welcomeSub")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("daodejing.welcome")}
                </p>
                {lastReadChapter && (
                  <Button
                    onClick={() => loadChapter(lastReadChapter)}
                    className="mt-2 gap-2"
                  >
                    <ArrowRight className="h-4 w-4" />
                    {t("daodejing.continueReading")} · {t("daodejing.chapter", { num: lastReadChapter.num, cn: lastReadChapter.cn })}
                  </Button>
                )}
                <Button
                  className="lg:hidden mt-2"
                  onClick={() => setTocOpen(true)}
                >
                  <Menu className="h-4 w-4 mr-2" />
                  {t("daodejing.toc")}
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
                        {t("daodejing.boshu")}
                      </span>
                    </div>
                    <AnnotatedText text={sections.boshu} footnotes={footnotes} />
                  </div>
                  {/* 传世版 */}
                  <div className="p-4 md:p-5 bg-accent/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground border border-border">
                        {t("daodejing.chuanshi")}
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
                        {t("daodejing.prev")}
                      </div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                        {t("daodejing.chapter", { num: prevChapter.num, cn: prevChapter.cn })} · {prevChapter.title}
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
                        {t("daodejing.next")}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                        {t("daodejing.chapter", { num: nextChapter.num, cn: nextChapter.cn })} · {nextChapter.title}
                      </p>
                    </button>
                  )}
                </div>
              </div>

              {/* Keyboard hint */}
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  {t("daodejing.keyboardHint")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
