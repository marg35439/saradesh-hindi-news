import { parse, formatRgb } from 'culori';

export function unwrapSupportsColorMix(css: string): string {
  const target = '@supports (color:color-mix(in lab,red,red)){';
  if (!css.includes(target)) return css;

  const result: string[] = [];
  let i = 0;
  while (i < css.length) {
    if (css.startsWith(target, i)) {
      i += target.length;
      let depth = 1;
      const contentStart = i;
      while (i < css.length && depth > 0) {
        if (css[i] === '{') depth++;
        else if (css[i] === '}') depth--;
        i++;
      }
      result.push(css.substring(contentStart, i - 1));
    } else {
      result.push(css[i]);
      i++;
    }
  }
  return result.join('');
}

export function replaceAllColorMix(css: string, colorDict: Record<string, string>): string {
  let count = 0;
  while (count < 2000) {
    const start = css.lastIndexOf('color-mix(');
    if (start === -1) break;

    let depth = 1;
    let end = start + 'color-mix('.length;
    while (end < css.length && depth > 0) {
      if (css[end] === '(') depth++;
      else if (css[end] === ')') depth--;
      end++;
    }

    if (depth !== 0) break; // unmatched parentheses

    const fullCall = css.substring(start, end);
    const inner = fullCall.substring('color-mix('.length, fullCall.length - 1);

    const firstComma = inner.indexOf(',');
    const lastComma = inner.lastIndexOf(',');
    let replacement = 'transparent';

    if (firstComma !== -1 && lastComma !== -1 && lastComma > firstComma) {
      const colorAndPct = inner.substring(firstComma + 1, lastComma).trim();
      let col = colorAndPct;
      let pct = 100;

      const lastSpace = colorAndPct.lastIndexOf(' ');
      if (lastSpace !== -1) {
        const possiblePct = colorAndPct.substring(lastSpace + 1).trim();
        if (possiblePct.endsWith('%')) {
          pct = parseFloat(possiblePct);
          col = colorAndPct.substring(0, lastSpace).trim();
        } else if (possiblePct.startsWith('var(')) {
          const varNameMatch = possiblePct.match(/var\((--[a-zA-Z0-9_-]+)\)/);
          if (varNameMatch && colorDict[varNameMatch[1]]) {
            const val = colorDict[varNameMatch[1]];
            pct = val.endsWith('%') ? parseFloat(val) : 100;
            col = colorAndPct.substring(0, lastSpace).trim();
          } else {
            // Unresolved var (like var(--tw-shadow-alpha)) -> default pct = 100%
            pct = 100;
            col = colorAndPct.substring(0, lastSpace).trim();
          }
        }
      }

      if (col.startsWith('var(')) {
        const varNameMatch = col.match(/var\((--[a-zA-Z0-9_-]+)\)/);
        if (varNameMatch && colorDict[varNameMatch[1]]) {
          col = colorDict[varNameMatch[1]];
        }
      }

      if (col === 'currentcolor') {
        replacement = `rgba(0, 0, 0, ${pct / 100})`;
      } else {
        const parsed = parse(col);
        if (parsed) {
          const baseAlpha = parsed.alpha !== undefined ? parsed.alpha : 1;
          parsed.alpha = baseAlpha * (pct / 100);
          replacement = formatRgb(parsed) || 'transparent';
        }
      }
    }

    css = css.substring(0, start) + replacement + css.substring(end);
    count++;
  }
  return css;
}

export function transformCssForLegacyBrowsers(css: string): string {
  // 1. Remove @property declarations (unsupported in Chrome < 85)
  css = css.replace(/@property\s+--[a-zA-Z0-9_-]+\s*\{[^}]*\}/g, '');

  // 2. Unwrap @supports (color:color-mix(in lab,red,red)) wrapper blocks
  css = unwrapSupportsColorMix(css);

  // 3. Convert all oklch / oklab / lab / lch color functions to rgb / rgba
  css = css.replace(/(oklch|oklab|lab|lch)\(([^)]+)\)/g, (match) => {
    try {
      const parsed = parse(match);
      if (parsed) {
        return formatRgb(parsed) || match;
      }
    } catch {
      // fallback
    }
    return match;
  });

  // 4. Build a dictionary of CSS variable definitions
  const colorDict: Record<string, string> = {};
  const varRegex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;}]+)/g;
  let m;
  while ((m = varRegex.exec(css)) !== null) {
    colorDict[m[1]] = m[2].trim();
  }

  // 5. Replace all color-mix(...) calls
  css = replaceAllColorMix(css, colorDict);

  // 6. Provide physical property fallbacks for logical CSS properties
  css = css.replace(/padding-inline:\s*calc\(([^)]+)\)/g, 'padding-left:calc($1);padding-right:calc($1);padding-inline:calc($1)');
  css = css.replace(/padding-inline:\s*([^;}]+)/g, 'padding-left:$1;padding-right:$1;padding-inline:$1');
  css = css.replace(/padding-block:\s*calc\(([^)]+)\)/g, 'padding-top:calc($1);padding-bottom:calc($1);padding-block:calc($1)');
  css = css.replace(/padding-block:\s*([^;}]+)/g, 'padding-top:$1;padding-bottom:$1;padding-block:$1');

  css = css.replace(/margin-inline:\s*calc\(([^)]+)\)/g, 'margin-left:calc($1);margin-right:calc($1);margin-inline:calc($1)');
  css = css.replace(/margin-inline:\s*([^;}]+)/g, 'margin-left:$1;margin-right:$1;margin-inline:$1');
  css = css.replace(/margin-block:\s*calc\(([^)]+)\)/g, 'margin-top:calc($1);margin-bottom:calc($1);margin-block:calc($1)');
  css = css.replace(/margin-block:\s*([^;}]+)/g, 'margin-top:$1;margin-bottom:$1;margin-block:$1');

  css = css.replace(/inset-inline:\s*([^;}]+)/g, 'left:$1;right:$1;inset-inline:$1');
  css = css.replace(/inset-block:\s*([^;}]+)/g, 'top:$1;bottom:$1;inset-block:$1');

  // 7. Modern viewport unit fallbacks (dvh, svh, lvh) -> vh
  css = css.replace(/(\d+(?:\.\d+)?)(dvh|svh|lvh)/g, '$1vh');

  return css;
}

export function legacyCssCompatPlugin() {
  return {
    name: 'legacy-css-compat',
    enforce: 'post' as const,
    generateBundle(_options: any, bundle: any) {
      for (const fileName in bundle) {
        if (fileName.endsWith('.css')) {
          const chunk = bundle[fileName];
          if (chunk && chunk.type === 'asset' && typeof chunk.source === 'string') {
            chunk.source = transformCssForLegacyBrowsers(chunk.source);
          }
        }
      }
    },
  };
}
