# fastpremier

A fast, searchable reference of every default Adobe Premiere (Pro) keyboard shortcut, ordered from the everyday essentials to the hidden gems almost nobody knows.

**Live site:** https://magomedovex-code.github.io/fastpremier/

- 252 shortcuts, each linked to the official Adobe help page it comes from
- Instant, typo-tolerant search across names, menu paths, descriptions and key combos (`ctrl k`, `cmd-k` and `⌘K` all work)
- **Press to find:** press a key combination to see which Premiere command uses it
- Windows / macOS toggle, tier, category and panel filters, shareable URLs, starred favorites, and a random hidden gem

## Use it offline

Plain HTML, CSS and JavaScript with no build step and no dependencies. Download the repo and double-click `index.html`.

## Data

`data/shortcuts.js` is generated from Adobe's official pages. The main source is the [default keyboard shortcuts table](https://helpx.adobe.com/premiere/desktop/get-started/keyboard-shortcuts/default-keyboard-shortcuts.html), plus shortcuts Adobe documents on other official help pages. Every extra entry carries a verbatim quote that the build re-checks against the live page. Where Adobe's own pages disagree, the entry says so and follows the main table.

To rebuild after Adobe updates its pages (requires Python 3 and curl):

```bash
python scripts/build_shortcuts.py   # download pages, parse, write data/shortcuts.js
python scripts/validate.py          # sanity checks + counts per tier and category
```

Tiers, descriptions and search aliases live in `scripts/curation.py`. To merge your own list, paste the output of Premiere's Keyboard Shortcuts › Copy To Clipboard into `premiere-shortcuts.txt` in the repo root before building.

## Disclaimer

Not affiliated with Adobe. Adobe and Premiere are trademarks of Adobe Inc. Shows default shortcuts on a US English keyboard layout; other layouts and custom keyboard sets may differ.
