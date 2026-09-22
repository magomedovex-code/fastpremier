"""Build data/shortcuts.js from Adobe's official Premiere help pages.

    python scripts/build_shortcuts.py             # download fresh pages with curl, then build
    python scripts/build_shortcuts.py --offline   # rebuild from the cached copies in scripts/raw/

Steps:
  1. Download each page in curation.PAGES into scripts/raw/<slug>.html.
  2. Parse every <h2> + <table> on the default-shortcuts page (stdlib HTMLParser, no summaries).
  3. Merge rows that share a command name and keys across several headings.
  4. Add curation.SUPPLEMENT entries, but only if their verbatim quote is still on the page.
  5. Merge premiere-shortcuts.txt (a paste from Premiere's Keyboard Shortcuts window) if present.
  6. Write data/shortcuts.js and scripts/build-report.txt.
"""

import argparse
import html
import json
import re
import shutil
import subprocess
import sys
import urllib.request
from datetime import date
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import curation as C  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "scripts" / "raw"
OUT = ROOT / "data" / "shortcuts.js"
REPORT = ROOT / "scripts" / "build-report.txt"
TXT_PASTE = ROOT / "premiere-shortcuts.txt"
TXT_SOURCE = "premiere-shortcuts.txt"

WIN_MODS = ["Ctrl", "Alt", "Shift"]
MAC_MODS = ["Ctrl", "Opt", "Shift", "Cmd"]
POINTER = {"Click", "Double-click", "Drag", "Scroll"}
NAMED_KEYS = {
    "up": "Up", "down": "Down", "left": "Left", "right": "Right",
    "page up": "Page Up", "page down": "Page Down", "home": "Home", "end": "End",
    "delete": "Delete", "forward delete": "Forward Delete", "backspace": "Backspace",
    "enter": "Enter", "return": "Return", "tab": "Tab", "space": "Space", "esc": "Esc", "escape": "Esc",
}
MOD_ALIASES = {
    "ctrl": "Ctrl", "control": "Ctrl", "alt": "Alt", "opt": "Opt", "option": "Opt",
    "cmd": "Cmd", "command": "Cmd", "shift": "Shift",
}

log_lines = []


def log(msg=""):
    print(msg)
    log_lines.append(msg)


# --------------------------------------------------------------------------- fetch
def fetch(slug):
    """Download one page with curl (Adobe's CDN rejects urllib's default client)."""
    dest = RAW / f"{slug}.html"
    url = C.url(slug)
    tmp = dest.with_suffix(".tmp")
    try:
        res = subprocess.run(
            ["curl", "-sS", "-L", "--max-time", "60", "-o", str(tmp), "-w", "%{http_code}", url],
            capture_output=True, text=True, timeout=90,
        )
        code = res.stdout.strip()
    except (OSError, subprocess.TimeoutExpired) as exc:
        code = f"curl failed: {exc}"
    if code == "200" and tmp.exists() and tmp.stat().st_size > 20000:
        shutil.move(tmp, dest)
        return "downloaded"
    if tmp.exists():
        tmp.unlink()
    if dest.exists():
        return f"FETCH FAILED ({code}); using cached copy"
    return f"FETCH FAILED ({code}); no cached copy"


# --------------------------------------------------------------------------- parse
class TableParser(HTMLParser):
    """Collects <h2> headings and the rows of each table that follows one."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.sections = []  # [{"heading": str, "rows": [[cell, ...], ...]}]
        self._in_h2 = False
        self._h2 = ""
        self._row = None
        self._cell = None

    def handle_starttag(self, tag, attrs):
        if tag == "h2":
            self._in_h2, self._h2 = True, ""
        elif tag == "tr":
            self._row = []
        elif tag in ("td", "th"):
            self._cell = ""
        elif tag == "br" and self._cell is not None:
            self._cell += " "

    def handle_endtag(self, tag):
        if tag == "h2" and self._in_h2:
            self._in_h2 = False
            self.sections.append({"heading": clean(self._h2), "rows": []})
        elif tag in ("td", "th") and self._cell is not None and self._row is not None:
            self._row.append(clean(self._cell))
            self._cell = None
        elif tag == "tr" and self._row is not None:
            if self.sections:
                self.sections[-1]["rows"].append(self._row)
            self._row = None

    def handle_data(self, data):
        if self._in_h2:
            self._h2 += data
        if self._cell is not None:
            self._cell += data


def clean(s):
    return re.sub(r"\s+", " ", s.replace("\xa0", " ")).strip()


def clean_action(s):
    s = s.replace("...", "…")
    return re.sub(r"\s+…", "…", s).strip()


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower().replace("…", "")).strip("-")


def norm_key(tok, platform):
    t = tok.strip()
    low = t.lower()
    if low in MOD_ALIASES:
        k = MOD_ALIASES[low]
        if platform == "win" and k in ("Opt", "Cmd"):
            raise ValueError(f"macOS modifier {k!r} in a Windows combo")
        if platform == "mac" and k == "Alt":
            k = "Opt"
        return k
    if low in NAMED_KEYS:
        return NAMED_KEYS[low]
    if len(t) == 1:
        return t.upper()
    if re.fullmatch(r"f\d{1,2}", low):
        return t.upper()
    raise ValueError(f"unknown key {t!r}")


def order_combo(keys, platform):
    mods = WIN_MODS if platform == "win" else MAC_MODS
    head = [m for m in mods if m in keys]
    tail = [k for k in keys if k not in mods]
    return head + tail


def parse_combo(text, platform):
    """'Ctrl + Alt + N' -> ['Ctrl', 'Alt', 'N']. Returns [] for an empty cell."""
    text = clean(text)
    if not text:
        return []
    if text.endswith("+"):
        raise ValueError(f"combo {text!r} is missing its key")
    parts = [p for p in text.split(" + ")]
    keys = [norm_key(p, platform) for p in parts]
    return order_combo(keys, platform)


def parse_main(path):
    parser = TableParser()
    parser.feed(path.read_text(encoding="utf-8"))
    rows, problems, headings = [], [], []
    for sec in parser.sections:
        heading = sec["heading"]
        data_rows = [r for r in sec["rows"] if r]
        if not data_rows or [c.lower() for c in data_rows[0][:3]] != ["commands", "windows", "macos"]:
            continue  # not a shortcut table (e.g. page chrome)
        headings.append(heading)
        menu = heading[:-5] if heading.endswith(" menu") else None
        subgroup = None
        count = 0
        for r in data_rows[1:]:
            if len(r) == 1:
                subgroup = r[0] or None  # a sub-heading row ("Workspaces") or a blank separator
                continue
            if len(r) != 3:
                problems.append(f"[{heading}] unexpected row shape: {r}")
                continue
            action = clean_action(r[0])
            entry = {"action": action, "category": heading, "menu": menu, "subgroup": subgroup,
                     "rawWin": r[1], "rawMac": r[2]}
            try:
                entry["win"] = [parse_combo(r[1], "win")] if r[1] else []
                entry["mac"] = [parse_combo(r[2], "mac")] if r[2] else []
            except ValueError as exc:
                entry["win"], entry["mac"] = [], []
                entry["parseError"] = str(exc)
            rows.append(entry)
            count += 1
        log(f"  {heading:<28} {count:>3} rows")
    return rows, problems, headings


def base_id(row):
    if row["category"] == "Window menu" and row["subgroup"] == "Workspaces":
        return "workspace-" + slug(row["action"])
    if row["category"] == "Window menu" and row["subgroup"] is None and row["action"] != "Maximize Frame":
        return "panel-" + slug(row["action"])  # Window › <panel name> opens that panel
    return slug(row["action"])


def menu_path(row):
    if not row["menu"]:
        return None
    parts = [row["menu"]] + ([row["subgroup"]] if row["subgroup"] else []) + [row["action"]]
    return " › ".join(parts)


def context_of(category):
    return category[:-6] if category.endswith(" panel") else category


def merge_rows(rows):
    """One entry per (command name, keys); a command listed under several headings gains contexts."""
    merged, index = [], {}
    for row in rows:
        key = (row["action"].lower().rstrip("…"), json.dumps(row["win"]), json.dumps(row["mac"]))
        if key in index:
            target = index[key]
            target["sections"].append(row["category"])
            log(f"  merged '{row['action']}' from {row['category']} into {target['category']}")
            continue
        entry = dict(row, sections=[row["category"]])
        index[key] = entry
        merged.append(entry)
    seen = set()
    for entry in merged:
        eid = base_id(entry)
        if eid in seen:
            eid = f"{eid}-{slug(context_of(entry['category']))}"
        seen.add(eid)
        entry["id"] = eid
    return merged


# --------------------------------------------------------------------------- quotes
_page_text_cache = {}


def page_text(slug_):
    """Article text of a cached page, lowercased with all whitespace removed (for quote checks)."""
    if slug_ not in _page_text_cache:
        path = RAW / f"{slug_}.html"
        if not path.exists():
            _page_text_cache[slug_] = None
        else:
            d = path.read_text(encoding="utf-8", errors="replace")
            d = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", d, flags=re.S)
            d = html.unescape(re.sub(r"<[^>]+>", " ", d))
            _page_text_cache[slug_] = squash(d)
    return _page_text_cache[slug_]


def squash(s):
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').replace("–", "-")
    return re.sub(r"\s+", "", s).lower()


def quote_ok(slug_, quote):
    text = page_text(slug_)
    return text is not None and squash(quote) in text


# --------------------------------------------------------------------------- premiere-shortcuts.txt
def parse_txt_paste(path):
    """Best-effort reader for text copied from Premiere's Keyboard Shortcuts window.

    Expected shape: a heading line (no tab) followed by "Command<TAB>Shortcut" lines.
    Shortcuts like "Ctrl+Shift+K" or "Cmd+K"; several shortcuts may be separated by ", ".
    """
    entries, heading = [], "Premiere Keyboard Shortcuts"
    text = path.read_text(encoding="utf-8", errors="replace")
    platform = "mac" if re.search(r"\b(Cmd|Command|Opt|Option)\b|⌘", text) else "win"
    for line in text.splitlines():
        if not line.strip():
            continue
        if "\t" not in line:
            heading = line.strip()
            continue
        cols = [c.strip() for c in line.split("\t") if c.strip()]
        if len(cols) < 2:
            continue
        combos = []
        for raw in re.split(r",\s*", cols[1]):
            raw = raw.replace("⌘", "Cmd+").replace("⌥", "Opt+").replace("⇧", "Shift+").replace("⌃", "Ctrl+")
            toks = [t for t in re.split(r"\+", raw) if t.strip()]
            if raw.endswith("++"):
                toks.append("+")
            try:
                combos.append(order_combo([norm_key(t, platform) for t in toks], platform))
            except ValueError as exc:
                log(f"  txt: skipped '{cols[0]}': {exc}")
        if combos:
            entries.append({"action": clean_action(cols[0]), "category": heading, "combos": combos})
    return platform, entries


# --------------------------------------------------------------------------- build
def build(offline):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    RAW.mkdir(parents=True, exist_ok=True)
    log(f"Premiere shortcut build — {date.today().isoformat()}")
    log("")
    log("1. Pages" + (" (offline: cached copies)" if offline else ""))
    for s in C.PAGES:
        status = "cached" if offline else fetch(s)
        if not (RAW / f"{s}.html").exists():
            status = "MISSING"
        log(f"  {status:<12} {C.url(s)}")
    main_path = RAW / f"{C.MAIN}.html"
    if not main_path.exists():
        sys.exit("The main shortcuts page is missing. Save it as scripts/raw/default-keyboard-shortcuts.html")

    log("")
    log("2. Headings and rows on the default-shortcuts page")
    rows, problems, headings = parse_main(main_path)
    log(f"  {len(headings)} shortcut tables, {len(rows)} rows")
    for p in problems:
        log("  ! " + p)

    log("")
    log("3. Merging duplicates")
    entries = merge_rows(rows)

    warnings, output = [], []
    main_url = C.url(C.MAIN)
    for e in entries:
        eid = e["id"]
        note = None
        more = []
        if e.get("parseError"):
            fill = C.KEY_FILLS.get(eid)
            if fill and quote_ok(fill["slug"], fill["quote"]):
                e["win"], e["mac"] = fill["win"], fill["mac"]
                note = fill["note"]
                more.append(C.url(fill["slug"]))
            else:
                warnings.append(f"UNPARSED  [{e['category']}] {e['action']}: {e['parseError']} "
                                f"(Windows cell {e['rawWin']!r}, macOS cell {e['rawMac']!r}) — left out")
                continue
        info = C.ENRICH.get(eid)
        if info is None:
            warnings.append(f"NOT CURATED  {eid} ({e['category']}): tier 4 + generic description used")
            where = menu_path(e) or e["category"]
            info = C.E(4, [context_of(c) for c in e["sections"]], f"Runs {where}.")
        contexts = list(info["contexts"])
        extra = C.EXTRA.get(eid)
        if extra:
            if quote_ok(extra["slug"], extra["quote"]):
                more.append(C.url(extra["slug"]))
                note = extra.get("note") or note
                contexts += [c for c in extra.get("contexts", []) if c not in contexts]
            else:
                warnings.append(f"STALE EXTRA  {eid}: quote not found on {extra['slug']}")
        out = {
            "id": eid,
            "action": e["action"],
            "menuPath": menu_path(e),
            "description": info["description"],
            "category": e["category"],
            "sections": e["sections"],
            "contexts": contexts,
            "win": e["win"],
            "mac": e["mac"],
            "tier": info["tier"],
            "aliases": info["aliases"],
            "source": main_url,
        }
        if more:
            out["moreSources"] = sorted(set(more))
        if note:
            out["note"] = note
        output.append(out)

    unused = sorted(set(C.ENRICH) - {e["id"] for e in entries})
    for u in unused:
        warnings.append(f"UNUSED CURATION  {u} (row no longer on Adobe's page?)")

    log("")
    log("4. Supplementary entries from other official pages")
    ids = {o["id"] for o in output}
    added = 0
    for s in C.SUPPLEMENT:
        if s["id"] in ids:
            warnings.append(f"DUPLICATE ID  {s['id']} in SUPPLEMENT")
            continue
        if not quote_ok(s["slug"], s["quote"]):
            warnings.append(f"UNVERIFIED  {s['id']}: quote not found on {C.url(s['slug'])} — left out")
            continue
        out = {k: s[k] for k in ("id", "action", "description", "category", "contexts", "win", "mac", "tier", "aliases")}
        out["menuPath"] = None
        out["sections"] = [s["category"]]
        out["source"] = C.url(s["slug"])
        if s.get("note"):
            out["note"] = s["note"]
        output.append(out)
        ids.add(s["id"])
        added += 1
    log(f"  {added} of {len(C.SUPPLEMENT)} verified and added")

    log("")
    log("5. premiere-shortcuts.txt")
    if TXT_PASTE.exists():
        platform, pasted = parse_txt_paste(TXT_PASTE)
        by_name = {}
        for o in output:
            by_name.setdefault(o["action"].lower().rstrip("…"), []).append(o)
        updated = new = 0
        for p in pasted:
            matches = by_name.get(p["action"].lower().rstrip("…"), [])
            if matches:
                for m in matches:
                    if m[platform] != p["combos"]:
                        m[platform] = p["combos"]
                        m.setdefault("moreSources", []).append(TXT_SOURCE)
                        updated += 1
            else:
                eid = slug(p["action"])
                while eid in ids:
                    eid += "-txt"
                ids.add(eid)
                output.append({
                    "id": eid, "action": p["action"], "menuPath": None,
                    "description": f"{p['action']} ({p['category']}).",
                    "category": p["category"], "sections": [p["category"]], "contexts": [p["category"]],
                    "win": p["combos"] if platform == "win" else [],
                    "mac": p["combos"] if platform == "mac" else [],
                    "tier": 4, "aliases": [], "source": TXT_SOURCE,
                })
                new += 1
        log(f"  {platform} paste: {len(pasted)} commands, {updated} updated, {new} new")
    else:
        log("  not present — skipped")

    order = {c: i for i, c in enumerate(C.CATEGORY_ORDER)}
    output.sort(key=lambda o: (o["tier"], order.get(o["category"], 99)))

    meta = {
        "generated": date.today().isoformat(),
        "primarySource": main_url,
        "sources": sorted({o["source"] for o in output} | {u for o in output for u in o.get("moreSources", [])}),
        "tiers": {str(k): {"name": v, "intro": C.TIER_INTROS[k]} for k, v in C.TIER_NAMES.items()},
        "categoryOrder": [c for c in C.CATEGORY_ORDER if any(o["category"] == c for o in output)]
                         + sorted({o["category"] for o in output} - set(C.CATEGORY_ORDER)),
        "categoryIntros": C.CATEGORY_INTROS,
        "headingsParsed": headings,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    body = ",\n".join("  " + json.dumps(o, ensure_ascii=False) for o in output)
    OUT.write_text(
        "// Generated by scripts/build_shortcuts.py — do not edit by hand; edit scripts/curation.py and rebuild.\n"
        f"window.PREMIERE_SHORTCUTS_META = {json.dumps(meta, ensure_ascii=False, indent=2)};\n"
        f"window.PREMIERE_SHORTCUTS = [\n{body}\n];\n",
        encoding="utf-8",
    )

    log("")
    log("6. Result")
    log(f"  wrote {OUT.relative_to(ROOT)} with {len(output)} entries")
    log("")
    log(f"Warnings ({len(warnings)})")
    for w in warnings:
        log("  " + w)
    REPORT.write_text("\n".join(log_lines) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--offline", action="store_true", help="use cached pages in scripts/raw/ instead of downloading")
    sys.exit(build(ap.parse_args().offline))
