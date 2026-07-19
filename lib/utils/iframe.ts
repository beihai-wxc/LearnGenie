/**
 * Patch embedded HTML to display correctly inside an iframe.
 *
 * Injects CSS that ensures proper sizing and scrolling behavior
 * when HTML content is rendered via srcDoc in an iframe.
 * Also fixes AI-generated code issues (module scope, IIFE, const functions).
 */
export function patchHtmlForIframe(html: string): string {
  const iframeCss = `<style data-iframe-patch>
  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    overflow-y: auto;
  }
  body { min-height: 100vh; }
</style>`;

  // Insert CSS right after <head> or at the start
  let patched = html;
  const headIdx = patched.indexOf('<head>');
  if (headIdx !== -1) {
    patched = patched.substring(0, headIdx + 6) + '\n' + iframeCss + patched.substring(headIdx + 6);
  } else {
    const headWithAttrs = patched.indexOf('<head ');
    if (headWithAttrs !== -1) {
      const closeAngle = patched.indexOf('>', headWithAttrs);
      if (closeAngle !== -1) {
        patched = patched.substring(0, closeAngle + 1) + '\n' + iframeCss + patched.substring(closeAngle + 1);
      } else {
        patched = iframeCss + patched;
      }
    } else {
      patched = iframeCss + patched;
    }
  }

  // ── Transform scripts in a single pass ──
  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  patched = patched.replace(scriptRegex, (match, attrs: string, body: string) => {
    // Skip non-JS scripts
    if (/type\s*=\s*["'](?:importmap|application\/json|text\/template)["']/i.test(attrs)) return match;

    const isModule = /type\s*=\s*["']module["']/i.test(attrs);
    const hasImports = /^\s*import\s+/m.test(body);
    const hasExports = /^\s*export\s+/m.test(body);

    // Keep module scripts that have imports/exports (e.g. Three.js visualizations)
    if (isModule && (hasImports || hasExports)) return match;

    // Convert module → regular script (removes module scope)
    let newAttrs = attrs;
    if (isModule) {
      newAttrs = attrs.replace(/\s*type\s*=\s*["']module["']/i, '');
    }

    let transformed = body;

    // Unwrap IIFEs with proper brace matching
    transformed = unwrapIife(transformed);

    // Transform const/let function expressions to window assignments
    // const handleMainButton = () => { ... }  →  window.handleMainButton = () => { ... }
    transformed = transformed.replace(
      /\b(?:const|let)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:function\s*\([^)]*\)|\([^)]*\)\s*=>|\w+\s*=>)/g,
      (m, name) => {
        if (m.includes('function') || m.includes('=>')) {
          return `window.${name} = `;
        }
        return m;
      },
    );

    // Transform function declarations to window assignments
    // function handleMainButton() { ... }  →  window.handleMainButton = function handleMainButton() { ... }
    transformed = transformed.replace(
      /^\s*function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/gm,
      (_m, name) => `window.${name} = function ${name}(`,
    );

    return `<script${newAttrs}>${transformed}</script>`;
  });

  return patched;
}

/**
 * Unwrap IIFEs using proper brace matching.
 * Handles: (function(){...})(), (function(a,b){...})(args), (()=>{...})()
 */
function unwrapIife(code: string): string {
  // Match pattern: ( function(...) { ... }) (...)
  // The key is finding the matching } for the opening { of the function body
  const iifeRegex = /\(\s*(?:function\s*\([^)]*\)|\([^)]*\)\s*=>)\s*\{/g;

  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = iifeRegex.exec(code)) !== null) {
    const iifeStart = match.index;
    const braceStart = iifeStart + match[0].length; // position of opening {

    // Find matching closing brace
    let depth = 1;
    let pos = braceStart;
    let inString: string | null = null;
    let escaped = false;

    while (pos < code.length && depth > 0) {
      const ch = code[pos];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === inString) {
          inString = null;
        }
      } else {
        if (ch === '"' || ch === "'" || ch === '`') {
          inString = ch;
        } else if (ch === '{') {
          depth++;
        } else if (ch === '}') {
          depth--;
        }
      }
      pos++;
    }

    if (depth !== 0) break; // malformed, skip

    const bodyEnd = pos - 1; // position of closing }
    const afterBrace = pos;

    // Now find the closing ) of the outer (...), skipping whitespace
    let parenPos = afterBrace;
    while (parenPos < code.length && /\s/.test(code[parenPos])) parenPos++;

    if (code[parenPos] !== ')') continue; // not a valid IIFE pattern

    parenPos++; // skip )

    // Now check for invocation parens: (...)
    while (parenPos < code.length && /\s/.test(code[parenPos])) parenPos++;

    let invokeEnd = parenPos;
    if (code[invokeEnd] === '(') {
      // Find matching )
      let invDepth = 1;
      invokeEnd++;
      while (invokeEnd < code.length && invDepth > 0) {
        if (code[invokeEnd] === '(') invDepth++;
        else if (code[invokeEnd] === ')') invDepth--;
        invokeEnd++;
      }
      // Skip trailing semicolon
      while (invokeEnd < code.length && /\s/.test(code[invokeEnd])) invokeEnd++;
      if (code[invokeEnd] === ';') invokeEnd++;
    }

    // Extract the body between { and }
    const innerBody = code.substring(braceStart, bodyEnd);

    // Add everything before this IIFE, then the unwrapped body
    result += code.substring(lastIndex, iifeStart) + innerBody;
    lastIndex = invokeEnd;

    // Reset regex to continue from where we left off
    iifeRegex.lastIndex = invokeEnd;
  }

  result += code.substring(lastIndex);
  return result;
}
