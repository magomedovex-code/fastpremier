"""Stamp content hashes onto the asset URLs in index.html so browsers never mix old and new files.

    python scripts/stamp_versions.py

GitHub Pages lets browsers cache files for 10 minutes. Without versioned URLs, a returning visitor
can get a fresh index.html with a stale styles.css or app.js, which breaks the layout. Run this after
editing app.js or styles.css (build_shortcuts.py runs it automatically).
"""

import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
ASSETS = ["styles.css", "app.js", "data/shortcuts.js"]


def digest(paths):
    h = hashlib.sha1()
    for p in paths:
        h.update(p.read_bytes())
    return h.hexdigest()[:10]


def stamp():
    html = INDEX.read_text(encoding="utf-8")
    for asset in ASSETS:
        v = digest([ROOT / asset])
        html, n = re.subn(rf'((?:href|src)="{re.escape(asset)})(?:\?v=[\w]+)?"', rf'\1?v={v}"', html)
        if n != 1:
            sys.exit(f"stamp_versions: expected one reference to {asset} in index.html, found {n}")
    packs = sorted((ROOT / "data" / "i18n").glob("*.js"))
    v = digest(packs) if packs else "0"
    html, n = re.subn(r'(<meta name="data-version" content=")[\w]*(")', rf"\g<1>{v}\2", html)
    if n != 1:
        sys.exit('stamp_versions: expected one <meta name="data-version"> in index.html')
    INDEX.write_text(html, encoding="utf-8")
    return v


if __name__ == "__main__":
    stamp()
    print("index.html asset versions updated")
