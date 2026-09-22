"""Validate data/shortcuts.js.

    python scripts/validate.py

Checks: unique ids; every entry has action, category, tier (1-4), source and at least one
combo; no empty descriptions; every key is a known key name; contexts present; sources are
official Adobe URLs (or premiere-shortcuts.txt). Prints totals per tier, category and context.
Exit code 1 if anything fails.
"""

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "shortcuts.js"

MODS = {"Ctrl", "Alt", "Shift", "Opt", "Cmd"}
NAMED = {"Up", "Down", "Left", "Right", "Page Up", "Page Down", "Home", "End", "Delete",
         "Forward Delete", "Backspace", "Enter", "Return", "Tab", "Space", "Esc"}
POINTER = {"Click", "Double-click", "Drag", "Scroll"}
TIER_NAMES = {1: "Essential", 2: "Everyday", 3: "Pro", 4: "Hidden gem"}


def load():
    text = DATA.read_text(encoding="utf-8")
    m = re.search(r"window\.PREMIERE_SHORTCUTS\s*=\s*(\[.*\]);\s*$", text, re.S)
    if not m:
        sys.exit("Could not find `window.PREMIERE_SHORTCUTS = [...]` in data/shortcuts.js")
    return json.loads(m.group(1))


def valid_key(k):
    return k in MODS or k in NAMED or k in POINTER or len(k) == 1 or re.fullmatch(r"F\d{1,2}", k)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    entries = load()
    errors = []

    ids = Counter(e.get("id") for e in entries)
    errors += [f"duplicate id: {i} (x{n})" for i, n in ids.items() if n > 1]

    for e in entries:
        tag = e.get("id") or "<no id>"
        for field in ("id", "action", "category", "source"):
            if not str(e.get(field) or "").strip():
                errors.append(f"{tag}: missing {field}")
        if e.get("tier") not in TIER_NAMES:
            errors.append(f"{tag}: tier must be 1-4, got {e.get('tier')!r}")
        if not str(e.get("description") or "").strip():
            errors.append(f"{tag}: empty description")
        if not e.get("contexts"):
            errors.append(f"{tag}: no contexts")
        src = e.get("source", "")
        if not (src.startswith("https://helpx.adobe.com/") or src == "premiere-shortcuts.txt"):
            errors.append(f"{tag}: source is not an official Adobe page: {src}")
        combos = (e.get("win") or []) + (e.get("mac") or [])
        if not combos:
            errors.append(f"{tag}: no key combo on either platform")
        for platform in ("win", "mac"):
            for combo in e.get(platform) or []:
                if not combo or not all(isinstance(k, str) and k for k in combo):
                    errors.append(f"{tag}: empty key in {platform} combo {combo}")
                    continue
                bad = [k for k in combo if not valid_key(k)]
                if bad:
                    errors.append(f"{tag}: unknown key(s) {bad} in {platform} combo {combo}")
                if platform == "win" and {"Opt", "Cmd"} & set(combo):
                    errors.append(f"{tag}: macOS modifier in Windows combo {combo}")
                if platform == "mac" and "Alt" in combo:
                    errors.append(f"{tag}: 'Alt' in macOS combo {combo} (use Opt)")

    print(f"Total entries: {len(entries)}")
    print()
    print("Per tier:")
    tiers = Counter(e["tier"] for e in entries)
    for t in sorted(tiers):
        print(f"  {t} {TIER_NAMES.get(t, '?'):<11} {tiers[t]:>4}")
    print()
    print("Per category:")
    for c, n in Counter(e["category"] for e in entries).most_common():
        print(f"  {c:<28} {n:>4}")
    print()
    print("Per context (entries can have several):")
    for c, n in Counter(c for e in entries for c in e.get("contexts", [])).most_common():
        print(f"  {c:<28} {n:>4}")
    print()
    win_only = [e["id"] for e in entries if e.get("win") and not e.get("mac")]
    mac_only = [e["id"] for e in entries if e.get("mac") and not e.get("win")]
    print(f"Windows-only entries: {len(win_only)}  {', '.join(win_only)}")
    print(f"macOS-only entries:   {len(mac_only)}  {', '.join(mac_only)}")
    notes = [e for e in entries if e.get("note")]
    print(f"Entries carrying a source note: {len(notes)}")
    for e in notes:
        print(f"  {e['id']}: {e['note']}")
    print()
    if errors:
        print(f"FAILED — {len(errors)} problem(s):")
        for err in errors:
            print("  " + err)
        return 1
    print("All checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
