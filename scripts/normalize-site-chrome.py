from pathlib import Path
import re

ROOT = Path(".")
VERSION = "20261006d"

head_inserts = [
    '<link rel="manifest" href="/site.webmanifest">',
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">',
    '<link rel="icon" type="image/png" href="/assets/brand/5th-edge-logo.png">',
    '<link rel="apple-touch-icon" href="/assets/brand/5th-edge-logo.png">',
]

changed = []
for path in sorted(ROOT.rglob("*.html")):
    if ".git" in path.parts:
        continue
    text = path.read_text(encoding="utf-8")
    original = text

    # Ensure the shared nav stylesheet exists and is cache-busted.
    if re.search(r'<link[^>]+href="/assets/css/nav\.css[^"]*"[^>]*>', text):
        text = re.sub(
            r'<link([^>]+)href="/assets/css/nav\.css[^"]*"([^>]*)>',
            rf'<link\1href="/assets/css/nav.css?v={VERSION}"\2>',
            text,
            count=1,
        )
    elif "</head>" in text:
        text = text.replace("</head>", f'<link rel="stylesheet" href="/assets/css/nav.css?v={VERSION}"></head>', 1)

    # Ensure global icon/manifest links are present in every document head.
    missing = []
    if 'rel="manifest"' not in text:
        missing.append(head_inserts[0])
    if 'rel="icon"' not in text:
        missing.extend(head_inserts[1:3])
    if 'rel="apple-touch-icon"' not in text:
        missing.append(head_inserts[3])
    if missing and "</head>" in text:
        text = text.replace("</head>", "".join(missing) + "</head>", 1)

    # Every page must execute the same shared navigation/footer normalizer.
    if re.search(r'<script[^>]+src="/assets/js/site-nav\.js[^"]*"[^>]*></script>', text):
        text = re.sub(
            r'<script([^>]+)src="/assets/js/site-nav\.js[^"]*"([^>]*)></script>',
            rf'<script\1src="/assets/js/site-nav.js?v={VERSION}"\2></script>',
            text,
            count=1,
        )
    elif "</body>" in text:
        text = text.replace("</body>", f'<script src="/assets/js/site-nav.js?v={VERSION}"></script></body>', 1)

    if text != original:
        path.write_text(text, encoding="utf-8")
        changed.append(str(path))

print(f"Normalized {len(changed)} HTML files")
for item in changed:
    print(item)
