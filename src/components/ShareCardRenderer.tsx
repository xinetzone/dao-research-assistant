import { useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface ShareCardRendererProps {
  userQuestion: string;
  assistantAnswer: string;
}

/**
 * Renders a hidden "xuan-paper style" card and provides methods
 * to export it as PNG or PDF.
 */
export function useShareCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  const captureCanvas = useCallback(async (node: HTMLElement) => {
    return html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#faf6f0",
      width: 540,
      height: 720,
      windowWidth: 540,
      windowHeight: 720,
    });
  }, []);

  const downloadImage = useCallback(async (node: HTMLElement, filename = "daoyan-share.png") => {
    const canvas = await captureCanvas(node);
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [captureCanvas]);

  const downloadPDF = useCallback(async (node: HTMLElement, filename = "daoyan-share.pdf") => {
    const canvas = await captureCanvas(node);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width / 2, canvas.height / 2],
    });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(filename);
  }, [captureCanvas]);

  return { cardRef, downloadImage, downloadPDF };
}

/** Truncate text for card rendering */
function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

/** Extract boshu quotes from the answer (lines starting with > or containing「帛书」) */
function extractQuotes(text: string): string[] {
  const lines = text.split("\n");
  const quotes: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      (trimmed.startsWith(">") && trimmed.length > 2) ||
      (trimmed.startsWith("「") && trimmed.includes("」"))
    ) {
      quotes.push(trimmed.replace(/^>\s*/, "").replace(/^\*\*|\*\*$/g, ""));
    }
  }
  return quotes.slice(0, 3);
}

/** Strip markdown formatting for plain card display */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^>\s*/gm, "")
    .replace(/^[-*+]\s/gm, "")
    .replace(/^\d+\.\s/gm, "")
    .trim();
}

export function ShareCard({ userQuestion, assistantAnswer }: ShareCardRendererProps & { ref?: React.Ref<HTMLDivElement> }) {
  const plainAnswer = stripMarkdown(assistantAnswer);
  const quotes = extractQuotes(assistantAnswer);

  return (
    <div className="dao-share-card" style={{
      position: "fixed",
      left: "-9999px",
      top: 0,
      zIndex: -1,
      pointerEvents: "none",
    }}>
      <div className="dao-share-card-inner">
        {/* Header */}
        <div className="dao-share-header">
          <span className="dao-share-title">道衍 · 帛书老子智慧向导</span>
          <div className="dao-share-divider" />
        </div>

        {/* User question */}
        <div className="dao-share-question">
          <span className="dao-share-label">问</span>
          <span>{truncate(userQuestion, 120)}</span>
        </div>

        {/* Assistant answer */}
        <div className="dao-share-answer">
          {truncate(plainAnswer, 600)}
        </div>

        {/* Boshu quotes */}
        {quotes.length > 0 && (
          <div className="dao-share-quotes">
            {quotes.map((q, i) => (
              <div key={i} className="dao-share-quote-item">
                {truncate(q, 100)}
              </div>
            ))}
          </div>
        )}

        {/* Footer watermark */}
        <div className="dao-share-footer">
          <div className="dao-share-divider" />
          <span>道衍 · 与老子对话</span>
          <span className="dao-share-url">dao-yan.enter.pro</span>
        </div>
      </div>
    </div>
  );
}
