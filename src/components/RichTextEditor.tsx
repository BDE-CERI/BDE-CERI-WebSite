"use client";

import { useId, useRef, useState } from "react";
import { parseRichText, serializeRichText, type RichTextBlock, type RichTextDocument, type RichTextFont, type RichTextRun } from "@/utils/rich-text";

const fontSizes = [12, 14, 16, 18, 24, 32, 48];
const sizeToLegacy: Record<string, number> = { "12": 1, "14": 2, "16": 3, "18": 4, "24": 5, "32": 6, "48": 7 };
const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function htmlForEditor(doc: RichTextDocument) {
  return doc.blocks.map(block => {
    const text = block.runs.map(run => {
      let html = escapeHtml(run.text).replace(/\n/g, "<br>");
      if (run.color || run.size || run.font) {
        const styles = [run.color ? "color:" + run.color : "", run.size ? "font-size:" + run.size + "px" : "", run.font ? "font-family:" + run.font : ""].filter(Boolean).join(";");
        html = "<span style=\"" + styles + "\">" + html + "</span>";
      }
      if (run.underline) html = "<u>" + html + "</u>";
      if (run.italic) html = "<em>" + html + "</em>";
      if (run.bold) html = "<strong>" + html + "</strong>";
      return html;
    }).join("");
    return "<p style=\"text-align:" + block.align + "\">" + (text || "<br>") + "</p>";
  }).join("") || "<p><br></p>";
}

function normalizeColor(value: string): string | undefined {
  const hex = value.trim().match(/^#[0-9a-f]{6}$/i);
  if (hex) return hex[0].toUpperCase();
  const rgb = value.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (!rgb) return undefined;
  const values = rgb.slice(1).map(part => Number(part));
  if (values.some(number => number < 0 || number > 255)) return undefined;
  return "#" + values.map(number => number.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function readBlocks(root: HTMLElement): RichTextBlock[] {
  const result: RichTextBlock[] = [];
  type RunStyle = Omit<RichTextRun, "text">;
  const inlineRuns = (node: Node, context: RunStyle, runs: RichTextRun[]) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (text) runs.push({ ...context, text });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === "BR") { runs.push({ ...context, text: "\n" }); return; }
    const next = { ...context };
    if (node.tagName === "STRONG" || node.tagName === "B") next.bold = true;
    if (node.tagName === "EM" || node.tagName === "I") next.italic = true;
    if (node.tagName === "U") next.underline = true;
    const color = normalizeColor(node.style.color || node.getAttribute("color") || "");
    if (color) next.color = color;
    const size = Number.parseInt(node.style.fontSize || "", 10);
    if (Number.isFinite(size)) next.size = Math.min(48, Math.max(12, size));
    else if (node.tagName === "FONT") {
      const legacySize = Number.parseInt(node.getAttribute("size") || "", 10);
      if (legacySize >= 1 && legacySize <= 7) next.size = fontSizes[legacySize - 1];
    }
    const family = (node.style.fontFamily || node.getAttribute("face") || "").toLowerCase();
    if (family.includes("mono")) next.font = "monospace";
    else if (family.includes("serif") && !family.includes("sans")) next.font = "serif";
    else if (family) next.font = "sans-serif";
    node.childNodes.forEach(child => inlineRuns(child, next, runs));
  };
  const addBlock = (nodes: Node[], align: RichTextBlock["align"]) => {
    const runs: RichTextRun[] = [];
    nodes.forEach(node => inlineRuns(node, {}, runs));
    // Merge adjacent identical styles, which keeps the saved document compact.
    const merged: RichTextRun[] = [];
    for (const run of runs) {
      const last = merged[merged.length - 1];
      if (last && last.bold === run.bold && last.italic === run.italic && last.underline === run.underline && last.color === run.color && last.size === run.size && last.font === run.font) last.text += run.text;
      else merged.push({ ...run });
    }
    result.push({ align, runs: merged });
  };
  const children = Array.from(root.childNodes);
  let inline: Node[] = [];
  for (const child of children) {
    if (child instanceof HTMLElement && (child.tagName === "P" || child.tagName === "DIV")) {
      if (inline.length) { addBlock(inline, "left"); inline = []; }
      const alignValue = child.style.textAlign;
      const align: RichTextBlock["align"] = alignValue === "center" || alignValue === "right" || alignValue === "justify" ? alignValue : "left";
      addBlock(Array.from(child.childNodes), align);
    } else inline.push(child);
  }
  if (inline.length || result.length === 0) addBlock(inline, "left");
  let remaining = 100000;
  return result.map(block => ({ ...block, runs: block.runs.map(run => { const text = run.text.slice(0, remaining); remaining -= text.length; return { ...run, text }; }).filter(run => run.text) })).slice(0, 1000);
}

const fonts: { value: RichTextFont; label: string }[] = [
  { value: "sans-serif", label: "Sans serif" }, { value: "serif", label: "Serif" }, { value: "monospace", label: "Monospace" },
];

export default function RichTextEditor({ name, label, initialValue = "", english = false }: { name: string; label: string; initialValue?: string; english?: boolean }) {
  const uid = useId();
  const editorRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<Range | null>(null);
  const [value, setValue] = useState(() => serializeRichText(parseRichText(initialValue)));
  const [open, setOpen] = useState(false);
  const l = (fr: string, en: string) => english ? en : fr;
  const saveRange = () => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current || !selection.rangeCount || !editorRef.current.contains(selection.anchorNode)) return;
    rangeRef.current = selection.getRangeAt(0).cloneRange();
  };
  const restoreRange = () => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;
    editorRef.current.focus();
    if (rangeRef.current) { selection.removeAllRanges(); selection.addRange(rangeRef.current); }
  };
  const command = (name: string, value?: string) => {
    restoreRange();
    document.execCommand(name, false, value);
    saveRange();
    if (editorRef.current) setValue(serializeRichText({ version: 1, blocks: readBlocks(editorRef.current) }));
  };
  const update = () => {
    if (!editorRef.current) return;
    const next = { version: 1 as const, blocks: readBlocks(editorRef.current) };
    setValue(serializeRichText(next));
    saveRange();
  };

  return <div className="min-w-0">
    <label id={uid + "-label"} className="mb-2 block text-xs font-semibold text-on-surface-variant">{label}</label>
    <input type="hidden" name={name} value={value} />
    <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-labelledby={uid + "-label"} aria-multiline="true" onInput={update} onKeyUp={saveRange} onMouseUp={saveRange} onBlur={saveRange} dangerouslySetInnerHTML={{ __html: htmlForEditor(parseRichText(initialValue)) }} className="min-h-48 w-full overflow-y-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm leading-7 text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 [&_p]:mb-3 [&_p:last-child]:mb-0" />
    <p className="mt-2 text-xs leading-5 text-on-surface-variant">{l("Saisissez votre texte; Entrée crée un paragraphe, Maj+Entrée une nouvelle ligne.", "Type your text; Enter starts a paragraph, Shift+Enter adds a line break.")}</p>
    <aside aria-label={l("Outils de mise en forme", "Formatting tools")} className={"fixed right-0 top-1/3 z-40 flex items-start transition-transform duration-300 motion-reduce:transition-none " + (open ? "translate-x-0" : "translate-x-[calc(100%-2.5rem)]")}>
      <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => setOpen(current => !current)} aria-expanded={open} aria-label={open ? l("Replier les outils de texte", "Collapse text tools") : l("Ouvrir les outils de texte", "Open text tools")} className="flex h-12 w-10 shrink-0 items-center justify-center rounded-l-xl border border-r-0 border-secondary/30 bg-secondary text-lg font-black text-on-secondary shadow-lg">{open ? ">" : "<"}</button>
      <div className="max-h-[70vh] w-64 space-y-3 overflow-y-auto rounded-bl-2xl border border-secondary/25 bg-surface-container-lowest p-3 shadow-2xl sm:w-72">
        <p className="text-xs font-bold uppercase tracking-widest text-secondary">{l("Mise en forme", "Formatting")}</p>
        <div className="grid grid-cols-4 gap-1.5">
          {[["bold", "B", l("Gras", "Bold")], ["italic", "I", l("Italique", "Italic")], ["underline", "U", l("Souligné", "Underline")]] .map(([cmd, labelText, title]) => <button key={cmd} type="button" title={title} aria-label={title} onMouseDown={event => event.preventDefault()} onClick={() => command(cmd)} className="min-h-10 rounded-lg border border-outline-variant/25 bg-surface-container-low text-sm font-bold hover:bg-secondary/10">{labelText}</button>)}
          {[["justifyLeft", "format_align_left"], ["justifyCenter", "format_align_center"], ["justifyRight", "format_align_right"]].map(([cmd, icon]) => <button key={cmd} type="button" onMouseDown={event => event.preventDefault()} onClick={() => command(cmd)} aria-label={l("Aligner le texte", "Align text")} title={l("Aligner le texte", "Align text")} className="min-h-10 rounded-lg border border-outline-variant/25 bg-surface-container-low hover:bg-secondary/10"><span aria-hidden="true" className="material-symbols-outlined text-lg">{icon}</span></button>)}
        </div>
        <label className="block text-xs font-semibold">{l("Couleur du texte", "Text colour")}<input type="color" defaultValue="#1D2633" onMouseDown={saveRange} onChange={event => command("foreColor", event.target.value)} className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-outline-variant/25 bg-surface-container-low p-1" /></label>
        <label className="block text-xs font-semibold">{l("Taille de police", "Font size")}<select defaultValue="16" onMouseDown={saveRange} onChange={event => command("fontSize", String(sizeToLegacy[event.target.value] || 3))} className="mt-1 min-h-10 w-full rounded-lg border border-outline-variant/25 bg-surface-container-low px-2 text-sm">{fontSizes.map(size => <option key={size} value={size}>{size} px</option>)}</select></label>
        <label className="block text-xs font-semibold">{l("Police", "Font family")}<select defaultValue="sans-serif" onMouseDown={saveRange} onChange={event => command("fontName", event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-outline-variant/25 bg-surface-container-low px-2 text-sm">{fonts.map(font => <option key={font.value} value={font.value}>{font.label}</option>)}</select></label>
        <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => command("removeFormat")} className="min-h-10 w-full rounded-lg border border-outline-variant/25 px-3 text-xs font-semibold hover:bg-surface-container-high">{l("Effacer la mise en forme", "Clear formatting")}</button>
        <p className="text-[11px] leading-4 text-on-surface-variant">{l("Sélectionnez d’abord le texte à modifier. Le panneau reste au bord droit de l’écran.", "Select text before changing it. The panel stays attached to the right edge.")}</p>
      </div>
    </aside>
  </div>;
}
