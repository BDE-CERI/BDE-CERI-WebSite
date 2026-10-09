export type RichTextFont = "sans-serif" | "serif" | "monospace";
export type RichTextRun = { text: string; bold?: boolean; italic?: boolean; underline?: boolean; color?: string; size?: number; font?: RichTextFont };
export type RichTextBlock = { align: "left" | "center" | "right" | "justify"; runs: RichTextRun[] };
export type RichTextDocument = { version: 1; blocks: RichTextBlock[] };

const validColor = (value: unknown): value is string => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
const validFont = (value: unknown): value is RichTextFont => value === "sans-serif" || value === "serif" || value === "monospace";
const parseBlock = (value: unknown): RichTextBlock | null => {
  if (!value || typeof value !== "object") return null;
  const block = value as Record<string, unknown>;
  if (!(block.align === "left" || block.align === "center" || block.align === "right" || block.align === "justify") || !Array.isArray(block.runs)) return null;
  const runs: RichTextRun[] = [];
  for (const item of block.runs.slice(0, 5000)) {
    if (!item || typeof item !== "object" || typeof (item as Record<string, unknown>).text !== "string") continue;
    const run = item as Record<string, unknown>;
    const text = (run.text as string).slice(0, 100000);
    if (!text) continue;
    runs.push({ text, bold: run.bold === true, italic: run.italic === true, underline: run.underline === true,
      ...(validColor(run.color) ? { color: run.color.toUpperCase() } : {}),
      ...(typeof run.size === "number" && Number.isFinite(run.size) ? { size: Math.min(48, Math.max(12, Math.round(run.size))) } : {}),
      ...(validFont(run.font) ? { font: run.font } : {}),
    });
  }
  return { align: block.align, runs };
};

export function parseRichText(value: unknown): RichTextDocument {
  if (typeof value !== "string") return { version: 1, blocks: [{ align: "left", runs: [] }] };
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (parsed && parsed.version === 1 && Array.isArray(parsed.blocks)) {
      return { version: 1, blocks: parsed.blocks.slice(0, 1000).map(parseBlock).filter((block): block is RichTextBlock => block !== null) };
    }
  } catch { /* Legacy event content is plain text. */ }
  return { version: 1, blocks: value.replace(/\r\n?/g, "\n").split("\n").slice(0, 1000).map(text => ({ align: "left" as const, runs: text ? [{ text: text.slice(0, 100000) }] : [] })) };
}

export function safeRichTextDocument(value: unknown): RichTextDocument {
  const parsed = parseRichText(value);
  let remaining = 100000;
  const blocks = parsed.blocks.map(block => ({
    align: block.align,
    runs: block.runs.map(run => {
      const text = run.text.slice(0, remaining);
      remaining -= text.length;
      return { ...run, text };
    }).filter(run => run.text.length > 0),
  }));
  return { version: 1, blocks };
}

export function serializeRichText(value: RichTextDocument): string {
  return JSON.stringify(safeRichTextDocument(value));
}
