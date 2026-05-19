function toPdfHex(input: string): string {
  const utf16 = Buffer.from(input, 'utf16le');
  let hex = 'FEFF';
  for (let i = 0; i < utf16.length; i += 2) {
    hex += utf16[i + 1].toString(16).padStart(2, '0').toUpperCase();
    hex += utf16[i].toString(16).padStart(2, '0').toUpperCase();
  }
  return hex;
}

function lineDisplayWidth(input: string): number {
  let width = 0;
  for (const ch of input) {
    width += /[\u4e00-\u9fff]/.test(ch) ? 2 : 1;
  }
  return width;
}

function splitLines(input: string, maxLength = 88): string[] {
  const compact = input.replace(/\r/g, '').trim();
  if (!compact) return [];
  const words = compact.split(/\s+/);
  const hasNaturalWordBreaks = words.length > 1;
  if (!hasNaturalWordBreaks) {
    const lines: string[] = [];
    let current = '';
    for (const ch of compact) {
      const next = current + ch;
      if (lineDisplayWidth(next) > maxLength) {
        if (current) lines.push(current);
        current = ch;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (lineDisplayWidth(next) > maxLength) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function buildSimplePdf(title: string, body: string): Buffer {
  const safeBody = body.replace(/\n{3,}/g, '\n\n').trim();
  const pages: string[][] = [[]];
  let pageIndex = 0;
  let titleY = 780;

  for (const line of splitLines(title, 32)) {
    pages[pageIndex]?.push(`BT /F1 20 Tf 50 ${titleY} Td <${toPdfHex(line)}> Tj ET`);
    titleY -= 24;
  }

  let y = Math.min(titleY - 8, 748);

  function ensurePage() {
    if (!pages[pageIndex]) {
      pages[pageIndex] = [];
    }
  }

  function moveToNextPage() {
    pageIndex += 1;
    y = 780;
    ensurePage();
  }

  for (const paragraph of safeBody.split('\n')) {
    if (y < 60) moveToNextPage();
    const lines = splitLines(paragraph, 92);
    if (lines.length === 0) {
      y -= 14;
      continue;
    }
    for (const line of lines) {
      if (y < 60) moveToNextPage();
      ensurePage();
      pages[pageIndex]?.push(`BT /F1 11 Tf 50 ${y} Td <${toPdfHex(line)}> Tj ET`);
      y -= 14;
    }
    y -= 8;
  }

  const renderedPages = pages.filter((page) => page.length > 0);
  const pageCount = Math.max(renderedPages.length, 1);
  const fontObjectId = 3 + pageCount * 2;
  const descendantFontObjectId = fontObjectId + 1;

  const objects = ['1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj'];
  const pageIds: number[] = [];

  for (let i = 0; i < pageCount; i += 1) {
    const pageObjectId = 3 + i * 2;
    const contentObjectId = pageObjectId + 1;
    pageIds.push(pageObjectId);
    const content = (renderedPages[i] ?? []).join('\n');
    objects.push(
      `${pageObjectId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >> endobj`,
    );
    objects.push(
      `${contentObjectId} 0 obj << /Length ${Buffer.byteLength(content, 'utf8')} >> stream\n${content}\nendstream endobj`,
    );
  }

  objects.splice(
    1,
    0,
    `2 0 obj << /Type /Pages /Count ${pageCount} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >> endobj`,
  );
  objects.push(
    `${fontObjectId} 0 obj << /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [${descendantFontObjectId} 0 R] >> endobj`,
  );
  objects.push(
    `${descendantFontObjectId} 0 obj << /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 4 >> /DW 1000 >> endobj`,
  );

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${object}\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}
