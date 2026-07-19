/**
 * JSON parsing with fallback strategies for AI-generated responses.
 */

import { jsonrepair } from 'jsonrepair';
import { createLogger } from '@/lib/logger';
const log = createLogger('Generation');

export function parseJsonResponse<T>(response: string): T | null {
  // Strategy 1: Try to extract JSON from markdown code blocks (may have multiple)
  const codeBlockMatches = response.matchAll(/```(?:json)?\s*([\s\S]*?)```/g);
  for (const match of codeBlockMatches) {
    const extracted = match[1].trim();
    // Only try if it looks like JSON (starts with { or [)
    if (extracted.startsWith('{') || extracted.startsWith('[')) {
      const result = tryParseJson<T>(extracted);
      if (result !== null) {
        log.debug('Successfully parsed JSON from code block');
        return result;
      }
    }
  }

  // Strategy 2: Try to find JSON structure directly in response (no code block)
  // Look for array or object start
  const jsonStartArray = response.indexOf('[');
  const jsonStartObject = response.indexOf('{');

  if (jsonStartArray !== -1 || jsonStartObject !== -1) {
    // Prefer the structure that appears first
    const startIndex =
      jsonStartArray === -1
        ? jsonStartObject
        : jsonStartObject === -1
          ? jsonStartArray
          : Math.min(jsonStartArray, jsonStartObject);

    // Find the matching close bracket
    let depth = 0;
    let endIndex = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = startIndex; i < response.length; i++) {
      const char = response[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '[' || char === '{') depth++;
        else if (char === ']' || char === '}') {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }
    }

    if (endIndex !== -1) {
      const jsonStr = response.substring(startIndex, endIndex + 1);
      const result = tryParseJson<T>(jsonStr);
      if (result !== null) {
        log.debug('Successfully parsed JSON from response body');
        return result;
      }
    }
  }

  // Strategy 3: Last resort - try the whole response
  const result = tryParseJson<T>(response.trim());
  if (result !== null) {
    log.debug('Successfully parsed raw response as JSON');
    return result;
  }

  log.error('Failed to parse JSON from response');
  log.error('Raw response (first 500 chars):', response.substring(0, 500));

  return null;
}

/**
 * Try to parse JSON with various fixes for common AI response issues
 */
export function tryParseJson<T>(jsonStr: string): T | null {
  // Attempt 0: Try parsing as-is first (fast path for valid JSON)
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Continue to fix attempts
  }

  // Attempt 1: Fix truncated JSON FIRST (before any other transformations)
  // This must happen before LaTeX fixing, because truncation repair needs
  // accurate string boundary detection which gets mangled by escape doubling.
  try {
    let fixed = jsonStr.trim();

    // Detect if we're inside an unclosed string at the end of the JSON
    let inString = false;
    let escape = false;
    for (let i = 0; i < fixed.length; i++) {
      const ch = fixed[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
    }

    if (inString) {
      // We're inside an unclosed string — truncate back to last complete key-value pair
      // Find the last field start pattern: ,"key":
      // Walk backwards to find a clean field boundary
      let cutPoint = -1;
      // Look for the pattern ,"<key>": starting from the end
      for (let i = fixed.length - 1; i >= 0; i--) {
        if (fixed[i] === ',' && i + 1 < fixed.length && fixed[i + 1] === '"') {
          // Found a potential field start — verify it has a colon after the key
          const rest = fixed.substring(i + 2);
          const colonIdx = rest.indexOf('":');
          if (colonIdx > 0 && colonIdx < 200) { // key length sanity check
            cutPoint = i;
            break;
          }
        }
      }
      if (cutPoint > 0) {
        fixed = fixed.substring(0, cutPoint);
      } else {
        // No clean field boundary found — just remove the incomplete trailing string
        // Find the last " that closes a value (not part of a key)
        fixed = fixed.substring(0, fixed.lastIndexOf(',"'));
      }
    }

    // Close open structures
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;

    if (openBrackets > closeBrackets) {
      fixed += ']'.repeat(openBrackets - closeBrackets);
    }
    if (openBraces > closeBraces) {
      fixed += '}'.repeat(openBraces - closeBraces);
    }

    // Try parsing the repaired JSON
    try {
      return JSON.parse(fixed) as T;
    } catch {
      // If still failing, fall through to other fix strategies
      jsonStr = fixed;
    }
  } catch {
    // Truncation fix failed, fall through
  }

  // Attempt 2: Fix common JSON issues from AI responses (LaTeX escapes, etc.)
  try {
    let fixed = jsonStr;

    // Fix LaTeX-style escapes that break JSON (e.g., \frac, \left, \right, \times)
    // These are common in math content and need to be double-escaped
    // IMPORTANT: Only process if we haven't already fixed truncation above
    fixed = fixed.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (_match, content) => {
      const fixedContent = content.replace(/\\([a-zA-Z])/g, (_m: string, ch: string) => {
        if ('bfnrtu'.includes(ch)) return `\\${ch}`;
        return `\\\\${ch}`;
      });
      return `"${fixedContent}"`;
    });

    // Fix other invalid escape sequences
    fixed = fixed.replace(/\\([^"\\\/bfnrtu\n\r])/g, (match, char) => {
      if (/[a-zA-Z]/.test(char)) {
        return '\\\\' + char;
      }
      return match;
    });

    return JSON.parse(fixed) as T;
  } catch {
    // Continue to next attempt
  }

  // Attempt 3: Use jsonrepair library
  try {
    const repaired = jsonrepair(jsonStr);
    return JSON.parse(repaired) as T;
  } catch {
    // Continue to next attempt
  }

  // Attempt 4: Remove control characters
  try {
    let fixed = jsonStr;
    fixed = fixed.replace(/[\x00-\x1F\x7F]/g, (char) => {
      switch (char) {
        case '\n': return '\\n';
        case '\r': return '\\r';
        case '\t': return '\\t';
        default: return '';
      }
    });
    return JSON.parse(fixed) as T;
  } catch {
    return null;
  }
}
