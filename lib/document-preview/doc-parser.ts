import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

export interface DocParagraph {
  text: string;
  style?: string;
  bold?: boolean;
  italic?: boolean;
  heading?: 'h1' | 'h2' | 'h3' | 'p';
}

export interface DocParseResult {
  paragraphs: DocParagraph[];
  title?: string;
}

function xmlNodeText(node: Node | null): string {
  if (!node) return '';
  let text = '';
  if (node.nodeType === 3) {
    text += node.nodeValue || '';
  }
  const children = (node as unknown as { childNodes?: NodeList }).childNodes;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      text += xmlNodeText(children[i]);
    }
  }
  return text;
}

export async function parseDoc(arrayBuffer: ArrayBuffer): Promise<DocParseResult | null> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const xmlEntry = zip.file('word/document.xml');
    if (!xmlEntry) {
      return null;
    }

    const xmlText = await xmlEntry.async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');

    const paragraphs: DocParagraph[] = [];
    const pNodes = doc.getElementsByTagName('w:p');

    for (let i = 0; i < pNodes.length; i++) {
      const p = pNodes[i];
      let text = '';
      let bold = false;
      let italic = false;
      let heading: DocParagraph['heading'] = 'p';

      const rNodes = (p as unknown as { getElementsByTagName?: (tag: string) => NodeList }).getElementsByTagName?.('w:r');
      if (rNodes) {
        for (let j = 0; j < rNodes.length; j++) {
          const r = rNodes[j];
          const t = (r as unknown as { getElementsByTagName?: (tag: string) => NodeList }).getElementsByTagName?.('w:t');
          if (t && t.length > 0) {
            text += xmlNodeText(t[0]);
          }
          const rPr = (r as unknown as { getElementsByTagName?: (tag: string) => NodeList }).getElementsByTagName?.('w:rPr');
          if (rPr && rPr.length > 0) {
            const b = (rPr[0] as unknown as { getElementsByTagName?: (tag: string) => NodeList }).getElementsByTagName?.('w:b');
            if (b && b.length > 0) bold = true;
            const it = (rPr[0] as unknown as { getElementsByTagName?: (tag: string) => NodeList }).getElementsByTagName?.('w:i');
            if (it && it.length > 0) italic = true;
          }
        }
      }

      const pPr = (p as unknown as { getElementsByTagName?: (tag: string) => NodeList }).getElementsByTagName?.('w:pPr');
      if (pPr && pPr.length > 0) {
        const pStyle = (pPr[0] as unknown as { getElementsByTagName?: (tag: string) => NodeList }).getElementsByTagName?.('w:pStyle');
        if (pStyle && pStyle.length > 0) {
          const val = (pStyle[0] as unknown as { getAttribute?: (name: string) => string }).getAttribute?.('w:val');
          if (val?.startsWith('Heading1')) heading = 'h1';
          else if (val?.startsWith('Heading2')) heading = 'h2';
          else if (val?.startsWith('Heading3')) heading = 'h3';
        }
      }

      if (text.trim()) {
        paragraphs.push({ text, bold, italic, heading });
      }
    }

    return { paragraphs };
  } catch {
    return null;
  }
}
