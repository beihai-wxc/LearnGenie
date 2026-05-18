import { parse } from 'pptxtojson';
import type { Element, Slide } from 'pptxtojson';

export interface PptxSlide {
  id: number;
  elements: Array<{
    type: 'text' | 'image' | 'shape' | 'table' | 'chart';
    x: number;
    y: number;
    width: number;
    height: number;
    content?: string;
    src?: string;
    style?: Record<string, unknown>;
  }>;
}

export interface PptxParseResult {
  slides: PptxSlide[];
  title?: string;
  width: number;
  height: number;
}

function convertElement(el: Element): PptxSlide['elements'][number] | null {
  if (el.type === 'text') {
    return {
      type: 'text',
      x: el.left,
      y: el.top,
      width: el.width,
      height: el.height,
      content: (el as { content?: string }).content,
    };
  }
  if (el.type === 'image') {
    return {
      type: 'image',
      x: el.left,
      y: el.top,
      width: el.width,
      height: el.height,
      src: el.src,
    };
  }
  if (el.type === 'shape') {
    return {
      type: 'shape',
      x: el.left,
      y: el.top,
      width: el.width,
      height: el.height,
      style: el.fill ? { backgroundColor: el.fill } : undefined,
    };
  }
  if (el.type === 'table') {
    return {
      type: 'table',
      x: el.left,
      y: el.top,
      width: el.width,
      height: el.height,
      content: el.data?.map((row: { text?: string }[]) => row.map((cell) => cell.text || '').join(' | ')).join('\n'),
    };
  }
  if (el.type === 'chart') {
    return {
      type: 'chart',
      x: el.left,
      y: el.top,
      width: el.width,
      height: el.height,
      content: el.chartType,
    };
  }
  return null;
}

export async function parsePptx(arrayBuffer: ArrayBuffer): Promise<PptxParseResult> {
  const json = await parse(arrayBuffer);

  const slides: PptxSlide[] = (json.slides || []).map((slide: Slide, index: number) => {
    const elements: PptxSlide['elements'] = [];
    for (const el of slide.elements || []) {
      const converted = convertElement(el);
      if (converted) elements.push(converted);
    }
    return {
      id: index + 1,
      elements,
    };
  });

  return {
    slides,
    width: json.size?.width || 1280,
    height: json.size?.height || 720,
  };
}
