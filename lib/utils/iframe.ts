/**
 * Patch embedded HTML to display correctly inside an iframe.
 *
 * Injects CSS that ensures proper sizing and scrolling behavior
 * when HTML content is rendered via srcDoc in an iframe.
 *
 * Also fixes AI-generated code issues so inline event handlers (onclick,
 * oninput, ...) actually fire. Two complementary mechanisms are used:
 *
 * 1. Static transform of <script> bodies:
 *    - module scripts without imports/exports are converted to regular scripts
 *    - IIFEs are unwrapped so their inner declarations leak to script top level
 *    - top-level `function`, `async function`, `function*`, `const|let = <fn>`
 *      declarations are rewritten as `window.NAME = ...` assignments so inline
 *      handlers (which can only resolve names on the global object) can find them
 *
 * 2. Runtime safety net injected at the end of every script:
 *    - converts any remaining `onclick/oninput/onchange/...` attributes into
 *      `addEventListener` bindings, with the handler code re-evaluated through
 *      a closure that can still see the script's top-level lexical environment
 *    - this catches cases the static transform misses (class instances, object
 *      methods, nested closures, async/generator patterns we failed to rewrite)
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

    // Keep module scripts that have imports/exports (e.g. Three.js visualizations).
    // These typically use addEventListener instead of inline handlers, so the
    // runtime safety net is not needed and module scope must be preserved.
    if (isModule && (hasImports || hasExports)) {
      return match;
    }

    // Convert module → regular script (removes module scope)
    let newAttrs = attrs;
    if (isModule) {
      newAttrs = attrs.replace(/\s*type\s*=\s*["']module["']/i, '');
    }

    let transformed = body;

    // Unwrap IIFEs with proper brace matching.
    // Note: async IIFEs are intentionally NOT unwrapped, because their body may
    // contain `await` which would break at top level of a regular script.
    transformed = unwrapIife(transformed);

    // Transform const/let function expressions to window assignments.
    // Covers: () => {}, async () => {}, (a) => {}, (a,b) => {}, a => {},
    //         function () {}, function* () {}, async function () {}
    transformed = transformed.replace(
      /\b(?:const|let)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?(?:function\s*\*?\s*\([^)]*\)|(?:async\s+)?\([^)]*\)\s*=>|[\w$]+\s*=>)/g,
      (_m, name) => `window.${name} = `,
    );

    // Transform function declarations to window assignments.
    // Covers: function foo() {}, async function foo() {}, function* foo() {},
    //         async function* foo() {}  (the generator * is preserved)
    transformed = transformed.replace(
      /^\s*((?:async\s+)?function\s*\*?)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/gm,
      (_m, fnKeyword, name) => `window.${name} = ${fnKeyword} ${name}(`,
    );

    // Inject runtime safety net: convert any remaining inline handlers to
    // addEventListener bindings. Uses `eval` (NOT `new Function`) so the
    // created handler runs in this script's lexical scope and can see
    // top-level `const`/`let` declarations from the AI-generated code.
    // `with(this)` and `with(document)` emulate the inline-handler scope
    // chain so bare property accesses (e.g. `value`, `getElementById`) work.
    const safetyNet = `\nif (!window.__iframeHandlersBound) {
  window.__iframeHandlersBound = true;
  const __iframeCreateHandler = function(code) {
    try {
      return eval('(function(event){with(this){with(document){' + code + '}}})');
    } catch(err) {
      console.error('[iframe handler] failed to compile "' + code + '":', err);
      return null;
    }
  };
  const __iframeBindHandlers = function(root) {
    var events = ['click','input','change','keydown','keyup','keypress','submit','reset','load','error','mousedown','mouseup','mousemove','touchstart','touchend','touchmove','wheel','dblclick','focus','blur'];
    events.forEach(function(evt){
      var attr = 'on' + evt;
      var els = root.querySelectorAll('[' + attr + ']');
      els.forEach(function(el){
        var code = el.getAttribute(attr);
        if (!code) return;
        el.removeAttribute(attr);
        var fn = __iframeCreateHandler(code);
        if (fn) {
          el.addEventListener(evt, function(e){ try { fn.call(el, e); } catch(err){ console.error('[iframe handler] ' + evt + ' failed:', err); } });
        }
      });
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ __iframeBindHandlers(document); });
  } else {
    __iframeBindHandlers(document);
  }
  try {
    var observer = new MutationObserver(function(mutations){
      mutations.forEach(function(m){
        m.addedNodes.forEach(function(node){
          if (node.nodeType === 1) {
            if (node.hasAttribute && (node.hasAttribute('onclick') || node.hasAttribute('oninput') || node.hasAttribute('onchange'))) {
              __iframeBindHandlers(node.parentElement || document);
            } else if (node.querySelectorAll) {
              __iframeBindHandlers(node);
            }
          }
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  } catch(err) {
    console.error('[iframe] MutationObserver setup failed:', err);
  }
}`;

    return `<script${newAttrs}>${transformed}${safetyNet}</script>`;
  });

  return patched;
}

/**
 * Unwrap IIFEs using proper brace matching.
 * Handles: (function(){...})(), (function(a,b){...})(args), (()=>{...})()
 * Does NOT unwrap async IIFEs (their body may use await).
 */
function unwrapIife(code: string): string {
  // Match pattern: ( function(...) { ... }) (...)
  // The key is finding the matching } for the opening { of the function body
  const iifeRegex = /\(\s*(?:function\s*\*?\s*\([^)]*\)|\([^)]*\)\s*=>)\s*\{/g;

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
