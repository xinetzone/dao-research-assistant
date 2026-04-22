import { useState, useRef, useCallback } from "react";
import { Share2, Link, Image, FileText, Download, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { ShareCard, useShareCard } from "./ShareCardRenderer";

interface ShareMenuProps {
  userQuestion: string;
  assistantAnswer: string;
  isZh: boolean;
}

export function ShareMenu({ userQuestion, assistantAnswer, isZh }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const cardNodeRef = useRef<HTMLDivElement>(null);
  const { downloadImage, downloadPDF } = useShareCard();
  const { toast } = useToast();

  const close = useCallback(() => setOpen(false), []);

  /** Build share text */
  const shareText = useCallback(() => {
    const q = userQuestion.trim();
    const a = assistantAnswer
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .trim();
    return `${isZh ? "问" : "Q"}：${q}\n\n${isZh ? "答" : "A"}：${a}\n\n—— 道衍 · 帛书老子智慧向导\nhttps://dao-yan.enter.pro`;
  }, [userQuestion, assistantAnswer, isZh]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText());
      toast({ description: isZh ? "对话已复制" : "Copied to clipboard" });
    } catch {
      toast({ description: isZh ? "复制失败" : "Copy failed", variant: "destructive" });
    }
    close();
  }, [shareText, toast, isZh, close]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ description: isZh ? "链接已复制" : "Link copied" });
    } catch {
      toast({ description: isZh ? "复制失败" : "Copy failed", variant: "destructive" });
    }
    close();
  }, [toast, isZh, close]);

  const handleDownloadImage = useCallback(async () => {
    const node = cardNodeRef.current;
    if (!node) return;
    setGenerating(true);
    try {
      const inner = node.querySelector(".dao-share-card-inner") as HTMLElement;
      if (inner) await downloadImage(inner);
      toast({ description: isZh ? "图片已保存" : "Image saved" });
    } catch {
      toast({ description: isZh ? "图片生成失败" : "Image generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
      close();
    }
  }, [downloadImage, toast, isZh, close]);

  const handleDownloadPDF = useCallback(async () => {
    const node = cardNodeRef.current;
    if (!node) return;
    setGenerating(true);
    try {
      const inner = node.querySelector(".dao-share-card-inner") as HTMLElement;
      if (inner) await downloadPDF(inner);
      toast({ description: isZh ? "PDF 已保存" : "PDF saved" });
    } catch {
      toast({ description: isZh ? "PDF 生成失败" : "PDF generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
      close();
    }
  }, [downloadPDF, toast, isZh, close]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "道衍 · 帛书老子智慧向导",
          text: shareText(),
          url: window.location.href,
        });
      } catch {
        // user cancelled or API error — ignore
      }
    } else {
      // Fallback: open Twitter/Weibo share
      const text = encodeURIComponent(shareText().slice(0, 280));
      const url = encodeURIComponent(window.location.href);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
    }
    close();
  }, [shareText, close]);

  const menuItems = [
    { icon: FileText, label: isZh ? "复制文本" : "Copy text", action: handleCopyText },
    { icon: Link, label: isZh ? "复制链接" : "Copy link", action: handleCopyLink },
    { icon: Image, label: isZh ? "生成图片" : "Save as image", action: handleDownloadImage },
    { icon: Download, label: isZh ? "下载 PDF" : "Download PDF", action: handleDownloadPDF },
    { icon: Share2, label: isZh ? "分享到社交" : "Share", action: handleNativeShare },
  ];

  return (
    <>
      {/* Hidden share card for screenshot */}
      <div ref={cardNodeRef}>
        <ShareCard userQuestion={userQuestion} assistantAnswer={assistantAnswer} />
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent hover:border-border/50 transition-all"
            title={isZh ? "分享此刻智慧" : "Share this wisdom"}
          >
            {generating ? (
              <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
            <span>{isZh ? "分享" : "Share"}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-44 p-1.5 bg-popover border border-border rounded-lg shadow-lg"
        >
          {menuItems.map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              disabled={generating}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded text-xs text-foreground/80 hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </>
  );
}
