import { diffWordsWithSpace, diffLines } from 'diff';
import type { DiffSegment } from '../types';

export function computeDiff(
  before: string,
  after: string,
  mode: 'words' | 'lines' = 'words'
): DiffSegment[] {
  const parts = mode === 'lines'
    ? diffLines(before, after)
    : diffWordsWithSpace(before, after);

  return parts.map((p) => {
    const op: 0 | 1 | -1 = p.added ? 1 : p.removed ? -1 : 0;
    return { op, text: p.value };
  });
}

export function renderDiffToHtml(segments: DiffSegment[]): string {
  const out: string[] = [];
  for (const seg of segments) {
    const safe = seg.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (seg.op === 0) {
      out.push(`<div class="whitespace-pre-wrap px-2 py-0.5 rounded opacity-60"><span class="inline-block w-4 text-text-muted"> </span>${safe}</div>`);
    } else if (seg.op === 1) {
      out.push(`<div class="whitespace-pre-wrap px-2 py-0.5 rounded bg-success/15"><span class="inline-block w-4 text-success font-bold">+</span>${safe}</div>`);
    } else {
      out.push(`<div class="whitespace-pre-wrap px-2 py-0.5 rounded bg-danger/15 line-through opacity-70"><span class="inline-block w-4 text-danger font-bold">−</span>${safe}</div>`);
    }
  }
  return out.join('');
}