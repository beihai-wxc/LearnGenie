/**
 * Generate a thumbnail from slide data by rendering a simplified canvas preview.
 * Draws actual text, shape fills, and image placeholders at a readable resolution.
 */

import type { Slide, PPTElement } from '@/lib/types/slides';

const TW = 640;
const TH = 400; // 16:10

interface Bounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

function b(el: PPTElement): Bounds {
  return (el as unknown as Bounds);
}

/** Strip HTML tags from rich-text content */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

export function generateSlideThumbnail(slide: Slide): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = TW;
    canvas.height = TH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const vw = slide.viewportSize || 960;
    const sx = TW / vw;
    const sy = TH / (vw / (slide.viewportRatio || 1.6));

    // Background
    const bgColor = slide.theme?.backgroundColor || slide.background?.color || '#ffffff';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, TW, TH);

    // Render each element
    for (const el of slide.elements || []) {
      const { left, top, width, height } = b(el);
      const x = left * sx;
      const y = top * sy;
      const w = width * sx;
      const h = height * sy;
      if (w <= 3 || h <= 3) continue;

      ctx.save();

      // Handle rotation
      const rotate = (el as unknown as { rotate?: number }).rotate;
      if (rotate) {
        const cx = x + w / 2;
        const cy = y + h / 2;
        ctx.translate(cx, cy);
        ctx.rotate((rotate * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      if (el.type === 'text') {
        drawText(ctx, el, x, y, w, h, sx);
      } else if (el.type === 'image') {
        drawImageBlock(ctx, x, y, w, h);
      } else if (el.type === 'shape') {
        drawShape(ctx, el, x, y, w, h);
      } else {
        drawGenericBlock(ctx, x, y, w, h);
      }

      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

function drawText(
  ctx: CanvasRenderingContext2D,
  el: PPTElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number,
) {
  const textEl = el as unknown as {
    content: string;
    defaultFontName?: string;
    defaultColor?: string;
    fill?: string;
    textType?: string;
  };

  const content = stripHtml(textEl.content || '');
  if (!content.trim()) return;

  const fontColor = textEl.fill || textEl.defaultColor || '#0a0d12';
  const isTitle = textEl.textType === 'title';

  // Scale font size based on element height
  const rawFontSize = heightToFontSize(h, isTitle);
  const fontSize = Math.max(8, Math.round(rawFontSize));
  const fontFamily = textEl.defaultFontName || 'sans-serif';

  ctx.font = `${isTitle ? 'bold ' : ''}${fontSize}px ${fontFamily}, sans-serif`;
  ctx.fillStyle = fontColor;
  ctx.textBaseline = 'top';

  // Word wrap
  const maxWidth = w - 4;
  const lineHeight = fontSize * 1.3;
  const words = content.split('');
  let line = '';
  let currentY = y + 4;

  for (const char of words) {
    const testLine = line + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line.length > 0) {
      ctx.fillText(line, x + 4, currentY);
      currentY += lineHeight;
      line = char;
      if (currentY + lineHeight > y + h) break;
    } else {
      line = testLine;
    }
  }
  if (line && currentY + lineHeight <= y + h + 4) {
    ctx.fillText(line, x + 4, currentY);
  }
}

function heightToFontSize(h: number, isTitle: boolean): number {
  // Map element height to approximate font size at 960px viewport
  const ratio = 960 / 640;
  const actualH = h * ratio;
  return isTitle ? actualH * 0.5 : actualH * 0.4;
}

function drawImageBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  // Checkerboard-like placeholder — looks better than a colored blob
  ctx.fillStyle = '#f0f5fa';
  ctx.fillRect(x, y, w, h);
  // Mountain icon placeholder
  ctx.strokeStyle = '#c8d6e5';
  ctx.lineWidth = 1.5;
  // Simple icon: circle + triangle
  const cx = x + w / 2;
  const cy = y + h / 2;
  const s = Math.min(w, h) * 0.15;
  ctx.beginPath();
  ctx.arc(cx - s * 0.5, cy, s, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.3, cy + s * 0.4);
  ctx.lineTo(cx + s, cy - s * 0.5);
  ctx.lineTo(cx + s * 1.7, cy + s * 0.4);
  ctx.closePath();
  ctx.stroke();
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  el: PPTElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const shapeEl = el as unknown as { fill?: string; borderColor?: string };
  ctx.fillStyle = shapeEl.fill || '#e8eef4';
  ctx.fillRect(x, y, w, h);
  if (shapeEl.borderColor) {
    ctx.strokeStyle = shapeEl.borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }
}

function drawGenericBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = '#e8eef4';
  ctx.globalAlpha = 0.5;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
}
