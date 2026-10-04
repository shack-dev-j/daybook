#!/usr/bin/env python3
"""Compile Daybook design tokens (tokens.json) into tokens.css.

Usage:  python3 tools/build_tokens.py [tokens.json] [tokens.css]
Defaults: design/tokens.json -> tokens.css (run from the project root).
Standard library only.
"""
import json, re, sys, pathlib

def alias(v):
    m = re.fullmatch(r'\{([A-Za-z0-9_.-]+)\}', v.strip())
    return 'var(--%s)' % m.group(1) if m else v

def themed(tokens, themes):
    """Return {theme_id: [(name, value)]} for colour-like token lists."""
    first = themes[0]
    out = {t: [] for t in themes}
    for tok in tokens:
        val = tok['value']
        for t in themes:
            if isinstance(val, str):
                v = val
            else:
                v = val.get(t, val.get(first))
            out[t].append((tok['name'], alias(v)))
    return out

def block(selector, pairs):
    width = max((len(n) for n, _ in pairs), default=0)
    lines = ['  --%s: %s;' % (n, v) for n, v in pairs]
    return '%s {\n%s\n}\n' % (selector, '\n'.join(lines))

def build(tokens, font_dir='fonts'):
    themes = [t['id'] for t in tokens['color']['themes']]
    colors = themed(tokens['color']['tokens'], themes)
    shadows = themed(tokens.get('shadow', {}).get('tokens', []), themes)
    out = ['/* Daybook tokens. Compiled from design/tokens.json by tools/build_tokens.py.\n'
           '   %s is the default theme; <html data-theme="%s"> switches every colour. */\n'
           % (themes[0].capitalize(), '|'.join(themes))]
    for i, t in enumerate(themes):
        sel = ':root, [data-theme="%s"]' % t if i == 0 else '[data-theme="%s"]' % t
        out.append('/* ---------- colour and shadow: %s ---------- */' % t)
        out.append(block(sel, colors[t] + shadows[t]))
    fixed = []
    for fam, body in tokens.items():
        if fam in ('name', 'version', 'color', 'type', 'shadow', 'meta') or not isinstance(body, dict):
            continue
        for tok in body.get('tokens', []):
            fixed.append((tok['name'], tok['value'] if isinstance(tok['value'], str) else str(tok['value'])))
    for key, stack in tokens['type'].get('families', {}).items():
        fixed.append(('font-' + key, stack))
    out.append('/* ---------- spacing, radius, size, font ---------- */')
    out.append(block(':root', fixed))
    out.append('/* ---------- type styles ---------- */')
    for g in tokens['type'].get('groups', []):
        fam = g.get('family')
        for s in g.get('styles', []):
            decl = ['font-family: var(--font-%s)' % s.get('family', fam),
                    'font-size: %s' % s['fontSize']]
            if 'lineHeight' in s: decl.append('line-height: %s' % s['lineHeight'])
            if 'fontWeight' in s: decl.append('font-weight: %s' % s['fontWeight'])
            if s.get('letterSpacing') not in (None, '0', 0): decl.append('letter-spacing: %s' % s['letterSpacing'])
            out.append('.%s { %s; }' % (s['name'], '; '.join(decl)))
    out.append('\n/* ---------- font files ---------- */')
    for f in tokens['type'].get('fonts', []):
        path = f['file'] if '/' in f['file'] else '%s/%s' % (font_dir, f['file'])
        ext = path.rsplit('.', 1)[-1].lower()
        fmt = {'woff2': 'woff2', 'woff': 'woff', 'ttf': 'truetype', 'otf': 'opentype'}.get(ext, ext)
        out.append('@font-face {\n  font-family: "%s";\n  src: url("%s") format("%s");\n  font-weight: %s;\n  font-style: %s;\n  font-display: swap;\n}'
                   % (f['family'], path, fmt, f.get('weight', '400'), f.get('style', 'normal')))
    return '\n'.join(out) + '\n'

if __name__ == '__main__':
    src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'design/tokens.json')
    dst = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else 'tokens.css')
    css = build(json.loads(src.read_text(encoding='utf-8')))
    dst.write_text(css, encoding='utf-8')
    print('Wrote %s (%d bytes)' % (dst, len(css)))
