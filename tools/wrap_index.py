"""Turn the artifact-style index.html (no doctype/head/body — the Claude artifact viewer adds those)
into a standalone standards-mode page for GitHub Pages or any web host."""
import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
if s.lstrip().lower().startswith('<!doctype'):
    open(dst, 'w', encoding='utf-8').write(s); sys.exit()
cut = s.index('<div class="cursor">')
head, body = s[:cut], s[cut:]
out = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n'
       '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
       + head.replace('<meta charset="UTF-8">\n', '') + '</head>\n<body>\n' + body + '\n</body>\n</html>\n')
open(dst, 'w', encoding='utf-8').write(out)
