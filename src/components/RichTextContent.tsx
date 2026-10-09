import type { CSSProperties } from "react";
import { parseRichText, type RichTextRun } from "@/utils/rich-text";

function renderRun(run: RichTextRun, index: number) {
  const style: CSSProperties = {};
  if (run.color) style.color = run.color;
  if (run.size) style.fontSize = run.size + "px";
  if (run.font) style.fontFamily = run.font;
  const decorated = <span key={index} style={style}>{run.text}</span>;
  if (run.underline) return <u key={index}>{decorated}</u>;
  return decorated;
}

export default function RichTextContent({ content, className = "" }: { content: string; className?: string }) {
  const document = parseRichText(content);
  return <div className={"space-y-3 " + className}>{document.blocks.map((block, index) => <p key={index} style={{ textAlign: block.align }} className="whitespace-pre-wrap">{block.runs.map((run, runIndex) => {
    let node = renderRun(run, runIndex);
    if (run.bold) node = <strong key={runIndex}>{node}</strong>;
    if (run.italic) node = <em key={runIndex}>{node}</em>;
    return node;
  })}</p>)}</div>;
}
