/* fastpremier — search, filters, translations and rendering. No dependencies, works from file://. */
(() => {
  'use strict';

  const DATA = Array.isArray(window.PREMIERE_SHORTCUTS) ? window.PREMIERE_SHORTCUTS : [];
  const META = window.PREMIERE_SHORTCUTS_META || {};
  const TOTAL = DATA.length;

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  /* ------------------------------------------------------------ English base strings */
  const EN_UI = {
    title: 'Premiere Pro Shortcuts',
    skip: 'Skip to results',
    language: 'Language',
    eyebrow: 'Adobe Premiere (Pro) · default keyboard shortcuts',
    heroHtml: 'Every Premiere shortcut,<br>from <span class="grad">essential</span> to <span class="grad grad-2">obscure</span>.',
    lede: '<strong>{total}</strong> default shortcuts, sourced line by line from {pages} official Adobe help pages. Search by name, by what it does, or just press the keys.',
    searchLabel: 'Search shortcuts',
    placeholder: 'Try “ripple delete”, “ctrl k” or “⌘K”',
    placeholderShort: 'Search, or type “ctrl k”',
    searchHelp: 'Type a command name, a task or a key combination. Press slash to focus, Escape to clear.',
    pressBtn: 'Press to find',
    pressTitle: 'Press a key combination to see which Premiere commands use it',
    pressPlaceholder: 'Press a {os} shortcut…',
    pressNote: "Listening — press a shortcut (Esc to stop). Browser-reserved combos such as Ctrl/Cmd + W, T or N can't be captured.",
    platform: 'Keyboard platform',
    filtersLabel: 'Filters and view options',
    groupBy: 'Group results by',
    byTier: 'By tier',
    byCategory: 'By category',
    gem: 'Random hidden gem',
    tier: 'Tier',
    category: 'Category',
    panel: 'Panel',
    menus: 'Menus',
    panels: 'Panels',
    techniques: 'Techniques',
    menu1: 'Menu',
    panel1: 'Panel',
    technique1: 'Technique',
    myShortcuts: 'My shortcuts',
    clearFilters: 'Clear all filters',
    clearFiltersShort: 'Clear filters',
    countAll: '<strong>{total}</strong> shortcuts · {os} keys',
    countSome: '<strong>{n}</strong> of {total} shortcuts',
    bestMatches: 'Best matches',
    bestMatchesIntro: 'Ranked by closeness: exact name, then prefix, whole word, alias or description, then fuzzy matches.',
    pressResult: '{combo} in Premiere',
    pressResultIntro: 'Default {os} shortcuts that use exactly this combination.',
    emptyFavTitle: 'No saved shortcuts yet',
    emptyFavBody: 'Tap the star on any row to keep it in My shortcuts. They are saved in this browser.',
    emptyPressTitle: 'No default Premiere shortcut uses {combo}',
    emptyPressBody: "Nothing in Adobe's default {os} set matches that exact combination. Try another, or switch platform.",
    emptyQueryTitle: 'No shortcuts match “{q}”',
    emptyQueryBodyFilters: 'The active filters may be hiding results. Clear them, or try a different word.',
    emptyQueryBody: 'Try a simpler word, a task (“split”, “slow motion”), or type the keys (“ctrl k”, “⌘K”, “shift ;”).',
    emptyFilterTitle: 'Nothing matches these filters',
    emptyFilterBody: 'Loosen the tier, category or panel filters to see more.',
    suggestions: 'split|slow motion',
    copyHint: 'Click to copy the shortcut',
    copied: 'Copied {text} — {action}',
    noDefaultFor: 'No {os} default · ',
    copyFailed: "Couldn't copy. {action}: {text}",
    saved: 'Saved to My shortcuts',
    removed: 'Removed from My shortcuts',
    starSave: 'Save {action} to My shortcuts',
    starRemove: 'Remove {action} from My shortcuts',
    starSaveTitle: 'Save to My shortcuts',
    starRemoveTitle: 'Remove from My shortcuts',
    src: 'SRC ↗',
    srcTitle: 'Adobe source page',
    srcAria: 'Adobe source for {action} (opens in a new tab)',
    only: '{os} only',
    noneTitle: 'Adobe documents no default {os} shortcut',
    or: 'or',
    to: 'to',
    hiddenGems: 'Hidden gems',
    gemKicker: '✦ Hidden gem',
    gemSource: 'Adobe source ↗',
    another: 'Another gem',
    showInList: 'Show in list',
    close: 'Close',
    footer1Html: "<strong>Not affiliated with Adobe.</strong> Adobe and Premiere are trademarks of Adobe Inc. This page lists Premiere's <em>default</em> shortcuts on a <strong>US English keyboard layout</strong>; other layouts and custom keyboard sets may differ.",
    footer2Html: "“—” means Adobe documents no default for that platform. Click, Drag, Double-click and Scroll entries are mouse-plus-modifier techniques Adobe documents alongside the keys. Where Adobe's own pages disagree, the entry says so and follows the <a href=\"{url}\" target=\"_blank\" rel=\"noopener\">default keyboard shortcuts table</a>.",
    namesNote: '',
    sourcesSummary: 'Sources: {n} official Adobe help pages',
    buildInfo: "{total} shortcuts ({t1} essential, {t2} everyday, {t3} pro, {t4} hidden gems). Data built from Adobe's pages on {date}.",
    'key.ctrl': 'Control', 'key.alt': 'Alt', 'key.opt': 'Option', 'key.shift': 'Shift', 'key.cmd': 'Command',
    'key.up': 'Up Arrow', 'key.down': 'Down Arrow', 'key.left': 'Left Arrow', 'key.right': 'Right Arrow',
    'key.pgup': 'Page Up', 'key.pgdn': 'Page Down', 'key.fwddel': 'Forward Delete (⌦)', 'key.del': 'Delete',
    'key.delMac': 'Delete (⌫)', 'key.bksp': 'Backspace', 'key.enter': 'Enter', 'key.return': 'Return', 'key.tab': 'Tab',
    'key.space': 'Spacebar', 'key.esc': 'Escape', 'key.home': 'Home', 'key.end': 'End',
    'key.grave': 'Grave accent / backtick (the key left of 1)', 'key.comma': 'Comma', 'key.period': 'Period',
    'key.slash': 'Slash', 'key.backslash': 'Backslash', 'key.semicolon': 'Semicolon', 'key.apostrophe': 'Apostrophe',
    'key.lbracket': 'Left bracket', 'key.rbracket': 'Right bracket', 'key.equals': 'Equals', 'key.minus': 'Minus / hyphen',
    'key.n': '{k} key',
    'ptr.click': 'Click', 'ptr.dblclick': 'Double-click', 'ptr.drag': 'Drag', 'ptr.scroll': 'Scroll',
    'ptr.clickT': 'Mouse click', 'ptr.dblclickT': 'Mouse double-click', 'ptr.dragT': 'Mouse drag', 'ptr.scrollT': 'Mouse wheel scroll',
  };

  const EN_TIERS = { 1: 'Essential', 2: 'Everyday', 3: 'Pro', 4: 'Hidden gem' };
  const EN_TIER_INTROS = {
    1: 'The daily basics. If you learn nothing else, learn these.',
    2: 'Regular workflow moves that pay off on every edit.',
    3: 'Power-user moves for precise trimming, nudging and three-point editing.',
    4: 'Obscure, panel-specific and modifier tricks most editors never discover.',
  };
  Object.entries(META.tiers || {}).forEach(([n, v]) => { EN_TIERS[n] = v.name; EN_TIER_INTROS[n] = v.intro; });

  const LANGS = META.languages || { en: { name: 'English', dir: 'ltr' } };
  const OS_NAME = { win: 'Windows', mac: 'macOS' };
  const GROUPS = META.categoryGroups || { menus: [], panels: [], techniques: [...new Set(DATA.map((e) => e.category))] };
  const GROUP_OF = new Map(Object.entries(GROUPS).flatMap(([g, cats]) => cats.map((c) => [c, g])));
  const CAT_ORDER = [...Object.values(GROUPS).flat(), ...new Set(DATA.map((e) => e.category))]
    .filter((c, i, a) => a.indexOf(c) === i && DATA.some((e) => e.category === c));
  const CAT_RANK = new Map((META.categoryOrder || CAT_ORDER).map((c, i) => [c, i]));
  const CTX_ORDER = ['Global', 'Timeline', 'Source Monitor', 'Program Monitor', 'Project', 'Effect Controls',
    'Effects', 'Audio Track Mixer', 'Media Browser', 'History', 'Metadata', 'Color mode', 'Dialogs', 'App launch'];

  /* ------------------------------------------------------------ storage (never trusted to exist) */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } },
  };

  function detectOS() {
    const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '';
    return /mac|iphone|ipad|ipod/i.test(p) ? 'mac' : 'win';
  }
  function detectLang() {
    const prefs = navigator.languages || [navigator.language || 'en'];
    for (const p of prefs) {
      const code = String(p).toLowerCase().split('-')[0];
      if (LANGS[code]) return code;
    }
    return 'en';
  }

  const state = {
    q: '',
    tiers: new Set(),
    cats: new Set(),
    ctxs: new Set(),
    fav: false,
    group: 'tier',
    os: store.get('psc-os', null) || detectOS(),
    lang: 'en',
    favs: new Set(store.get('psc-favs', [])),
    press: null, // {text, kq} once press-to-find has captured a combo
    listening: false,
  };

  /* ------------------------------------------------------------ translation pack */
  let L = { ui: {}, tiers: {}, categories: {}, contexts: {}, keys: {}, entries: {} };

  function t(key, vars) {
    let s = L.ui[key];
    if (s === undefined || s === '') s = EN_UI[key];
    if (s === undefined) s = key;
    return vars ? s.replace(/\{(\w+)\}/g, (m, v) => (vars[v] !== undefined ? vars[v] : m)) : s;
  }
  const tierName = (n) => (L.tiers[n] && L.tiers[n][0]) || EN_TIERS[n];
  const tierIntro = (n) => (L.tiers[n] && L.tiers[n][1]) || EN_TIER_INTROS[n];
  const catShort = (c) => (L.categories[c] && L.categories[c][0]) || (META.categoryShort || {})[c] || c;
  const catIntro = (c) => (L.categories[c] && L.categories[c][1]) || (META.categoryIntros || {})[c] || '';
  const ctxName = (c) => L.contexts[c] || c;
  const loc = (e) => L.entries[e.id] || {};
  const nameOf = (e) => loc(e).a || e.action;
  const pathOf = (e) => loc(e).p || e.menuPath;
  const descOf = (e) => loc(e).d || e.description;
  const noteOf = (e) => (e.note ? loc(e).n || e.note : '');

  /* ------------------------------------------------------------ text folding & index */
  // Case-, accent- and script-variant-insensitive form used on both sides of every comparison.
  const fold = (s) => String(s || '').normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase()
    .replace(/ı/g, 'i').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ـ/g, '');
  const norm = (s) => fold(s).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const words = (s) => norm(s).split(' ').filter(Boolean);

  const MOD_CANON = { win: { Ctrl: 'ctrl', Alt: 'alt', Shift: 'shift' }, mac: { Ctrl: 'ctrl', Opt: 'alt', Shift: 'shift', Cmd: 'cmd' } };
  const MODS = new Set(['Ctrl', 'Alt', 'Shift', 'Opt', 'Cmd']);
  const POINTER = new Set(['Click', 'Double-click', 'Drag', 'Scroll']);

  // Query tokens a printed key label answers to, per platform.
  function keyTokens(label, platform) {
    switch (label) {
      case 'Up': case 'Down': case 'Left': case 'Right': case 'Space': case 'Tab': case 'Home': case 'End':
        return [label.toLowerCase()];
      case 'Esc': return ['esc'];
      case 'Enter': case 'Return': return ['enter'];
      case 'Page Up': return ['pageup'];
      case 'Page Down': return ['pagedown'];
      case 'Backspace': return ['backspace'];
      case 'Delete': return platform === 'mac' ? ['delete', 'backspace'] : ['delete', 'fwddel'];
      case 'Forward Delete': return ['fwddel', 'delete'];
      case 'Click': return ['click'];
      case 'Double-click': return ['dblclick'];
      case 'Drag': return ['drag'];
      case 'Scroll': return ['scroll'];
      default: return [label.toLowerCase()];
    }
  }

  function canonCombo(keys, platform) {
    const mods = new Set();
    const rest = [];
    keys.forEach((k) => {
      const m = MOD_CANON[platform][k];
      if (m) mods.add(m); else rest.push(keyTokens(k, platform));
    });
    return { mods, keys: rest };
  }

  const entries = DATA.map((e, i) => Object.assign({}, e, {
    _i: i,
    _combos: { win: (e.win || []).map((c) => canonCombo(c, 'win')), mac: (e.mac || []).map((c) => canonCombo(c, 'mac')) },
  }));
  const byId = new Map(entries.map((e) => [e.id, e]));
  let VOCAB = [];

  // Search always covers the current language and English, so English terms keep working everywhere.
  function buildIndex() {
    entries.forEach((e) => {
      const names = [...new Set([norm(nameOf(e)), norm(e.action)])];
      const meta = [...(e.aliases || []), pathOf(e) || '', e.menuPath || '', e.category, catShort(e.category),
        ...(e.sections || []), ...(e.contexts || []), ...(e.contexts || []).map(ctxName), EN_TIERS[e.tier], tierName(e.tier)];
      e._names = names;
      e._nameW = [...new Set(names.flatMap((n) => n.split(' ')).filter(Boolean))];
      e._alias = (e.aliases || []).map(norm);
      e._metaW = [...new Set(words(meta.join(' ')))];
      e._descW = [...new Set([...words(descOf(e)), ...words(e.description)])];
    });
    VOCAB = [...new Set(entries.flatMap((e) => [...e._nameW, ...e._metaW, ...e._descW]))].filter((w) => w.length >= 3);
    fuzzyCache.clear();
  }

  /* ------------------------------------------------------------ key-combo queries */
  const MOD_WORDS = { cmd: 'cmd', command: 'cmd', meta: 'cmd', ctrl: 'ctrl', control: 'ctrl', ctl: 'ctrl',
    alt: 'alt', opt: 'alt', option: 'alt', shift: 'shift',
    strg: 'ctrl', umschalt: 'shift', umschalttaste: 'shift', wahl: 'alt', befehl: 'cmd',
    mayus: 'shift', opc: 'alt', opcion: 'alt', maj: 'shift', commande: 'cmd' };
  const KEY_WORDS = { up: 'up', down: 'down', left: 'left', right: 'right', space: 'space', spacebar: 'space',
    enter: 'enter', return: 'enter', tab: 'tab', esc: 'esc', escape: 'esc', home: 'home', end: 'end',
    pageup: 'pageup', pgup: 'pageup', pagedown: 'pagedown', pgdn: 'pagedown', delete: 'delete', del: 'delete',
    backspace: 'backspace', bksp: 'backspace', fwddel: 'fwddel', backtick: '`', backquote: '`', grave: '`',
    accent: '`', tilde: '`', comma: ',', period: '.', dot: '.', slash: '/', backslash: '\\', semicolon: ';',
    apostrophe: "'", quote: "'", minus: '-', dash: '-', hyphen: '-', equals: '=', equal: '=', plus: '=',
    click: 'click', dblclick: 'dblclick', drag: 'drag', scroll: 'scroll', wheel: 'scroll',
    leertaste: 'space', espacio: 'space', espace: 'space', пробел: 'space', bosluk: 'space',
    entf: 'delete', supr: 'delete', suppr: 'delete', rucktaste: 'backspace', retroceso: 'backspace',
    eingabe: 'enter', intro: 'enter', entree: 'enter', ввод: 'enter', pos1: 'home', inicio: 'home',
    origine: 'home', ende: 'end', fin: 'end' };

  /** "ctrl k", "ctrl+k", "cmd-k", "⌘K", "strg+k", "shift ;" -> {mods:Set, keys:[token]}; null if not a combo. */
  function parseKeyQuery(raw) {
    const s = fold(raw)
      .replace(/⌘/g, ' cmd ').replace(/⌥/g, ' alt ').replace(/⇧/g, ' shift ').replace(/⌃/g, ' ctrl ')
      .replace(/↑/g, ' up ').replace(/↓/g, ' down ').replace(/←/g, ' left ').replace(/→/g, ' right ')
      .replace(/⌫/g, ' backspace ').replace(/⌦/g, ' fwddel ').replace(/[⏎↩]/g, ' enter ').replace(/⇥/g, ' tab ').replace(/⎋/g, ' esc ')
      .replace(/page\s*up/g, ' pageup ').replace(/page\s*down/g, ' pagedown ')
      .replace(/forward\s*delete|fwd\s*del(ete)?/g, ' fwddel ')
      .replace(/double[\s-]*click/g, ' dblclick ')
      .replace(/mouse\s*wheel/g, ' scroll ')
      .replace(/\b(up|down|left|right)\s*arrow\b|\barrow\s*(up|down|left|right)\b/g, (m, a, b) => ` ${a || b} `);
    const raw_ = s.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) || [];
    const toks = [];
    raw_.forEach((tk, i) => {
      const sep = (tk === '+' || tk === '-') && i > 0 && i < raw_.length - 1 && raw_[i - 1] !== '+' && raw_[i - 1] !== '-';
      if (!sep) toks.push(tk);
    });
    if (!toks.length || toks.length > 6) return null;
    const mods = new Set();
    const keys = [];
    for (const tk of toks) {
      if (MOD_WORDS[tk]) mods.add(MOD_WORDS[tk]);
      else if (KEY_WORDS[tk]) keys.push(KEY_WORDS[tk]);
      else if (tk.length === 1 && /[a-z0-9]|[^\p{L}\p{N}]/u.test(tk)) keys.push(tk === '+' ? '=' : tk === '~' ? '`' : tk);
      else if (/^f([1-9]|1[0-2])$/.test(tk)) keys.push(tk);
      else return null;
    }
    if (!mods.size && !keys.length) return null;
    if (!mods.size && keys.length > 2) return null;
    return { mods, keys };
  }

  function keyMatch(entry, kq, opts) {
    let best = 0;
    const hits = { win: new Set(), mac: new Set() };
    const platforms = opts.platform ? [opts.platform] : ['win', 'mac'];
    platforms.forEach((p) => {
      entry._combos[p].forEach((c, ci) => {
        const used = new Set();
        const keysOk = kq.keys.every((q) => {
          const idx = c.keys.findIndex((toks, j) => !used.has(j) && toks.includes(q));
          if (idx < 0) return false;
          used.add(idx);
          return true;
        });
        if (!keysOk) return;
        for (const m of kq.mods) if (!c.mods.has(m)) return;
        const exact = c.mods.size === kq.mods.size && c.keys.length === kq.keys.length;
        let sc;
        if (exact) sc = 1000;
        else if (opts.exactOnly) return;
        else if (!kq.keys.length) sc = 520 - 12 * (c.mods.size - kq.mods.size) - 4 * c.keys.length;
        else sc = 700 - 25 * ((c.mods.size - kq.mods.size) + (c.keys.length - kq.keys.length));
        if (p === state.os) sc += 40;
        hits[p].add(ci);
        if (sc > best) best = sc;
      });
    });
    return { score: best, hits };
  }

  /* ------------------------------------------------------------ fuzzy text matching */
  function osa(a, b, max) {
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > max) return max + 1;
    let prev2 = null, prev = Array.from({ length: lb + 1 }, (_, j) => j);
    for (let i = 1; i <= la; i++) {
      const cur = [i];
      let rowMin = i;
      for (let j = 1; j <= lb; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
        cur[j] = v;
        if (v < rowMin) rowMin = v;
      }
      if (rowMin > max) return max + 1;
      prev2 = prev; prev = cur;
    }
    return prev[lb];
  }
  const fuzzyLimit = (len) => (len < 4 ? 0 : len === 4 ? 1 : 2);
  const fuzzyCache = new Map();
  function fuzzySet(w) {
    if (fuzzyCache.has(w)) return fuzzyCache.get(w);
    const lim = fuzzyLimit(w.length);
    const out = new Set();
    if (lim) {
      for (const v of VOCAB) {
        if (v[0] !== w[0]) continue; // typos rarely hit the first letter; keeps "poster" away from "faster"
        if (osa(w, v, lim) <= lim) { out.add(v); continue; }
        if (v.length > w.length && osa(w, v.slice(0, w.length), 1) <= 1) out.add(v); // half-typed words
      }
    }
    if (fuzzyCache.size > 400) fuzzyCache.clear();
    fuzzyCache.set(w, out);
    return out;
  }

  /** exact name 1000 > name prefix 900 > alias phrase 780 > whole words ~600 > prefixes ~480 > meta ~360 > description ~240 > fuzzy ~120 */
  function textMatch(entry, qn, qw) {
    if (!qw.length) return { score: 0, terms: [] };
    if (entry._names.includes(qn)) return { score: 1000, terms: [qn] };
    if (entry._names.some((n) => n.startsWith(qn))) return { score: 900, terms: [qn] };
    if (entry._alias.includes(qn)) return { score: 780, terms: qw };
    let minL = 9, sum = 0;
    const terms = [];
    for (const w of qw) {
      let lvl = 0;
      if (entry._nameW.includes(w)) lvl = 5;
      else if (entry._nameW.some((x) => x.startsWith(w))) lvl = 4;
      else if (entry._metaW.some((x) => x.startsWith(w))) lvl = 3;
      else if (entry._descW.some((x) => x.startsWith(w)) || (w.length >= 3 && entry._names.some((n) => n.includes(w)))) lvl = 2;
      else {
        const fz = fuzzySet(w);
        const found = [...entry._nameW, ...entry._metaW, ...entry._descW].filter((x) => fz.has(x));
        if (found.length) { lvl = 1; terms.push(...found); }
      }
      if (!lvl) return { score: 0, terms: [] };
      if (lvl > 1) terms.push(w);
      minL = Math.min(minL, lvl);
      sum += lvl;
    }
    const inOrder = qw.length > 1 && entry._names.some((n) => n.includes(qw.join(' '))) ? 15 : 0;
    // Small tie-breaker: a category/alias hit that the description also mentions is the likelier match.
    const corroborated = minL < 5 && qw.every((w) => entry._descW.some((x) => x.startsWith(w))) ? 10 : 0;
    return { score: minL * 100 + Math.round((20 * sum) / qw.length) + inOrder + corroborated, terms };
  }

  /* ------------------------------------------------------------ filtering + ranking */
  function passes(e, skip) {
    if (skip !== 'tier' && state.tiers.size && !state.tiers.has(e.tier)) return false;
    if (skip !== 'cat' && state.cats.size && !state.cats.has(e.category)) return false;
    if (skip !== 'ctx' && state.ctxs.size && !e.contexts.some((c) => state.ctxs.has(c))) return false;
    if (state.fav && !state.favs.has(e.id)) return false;
    return true;
  }

  const baseOrder = (a, b) => a.tier - b.tier || (CAT_RANK.get(a.category) ?? 99) - (CAT_RANK.get(b.category) ?? 99) || a._i - b._i;

  /** Scores every entry against the query once, then derives the visible list and per-filter counts. */
  function compute() {
    const pressing = !!state.press;
    const q = state.listening ? (pressing ? state.press.text : '') : state.q.trim();
    let scored;
    let mode = 'browse';
    if (q) {
      mode = 'search';
      const kq = pressing ? state.press.kq : parseKeyQuery(q);
      const qn = norm(q);
      const qw = qn.split(' ').filter(Boolean);
      const single = q.replace(/\s/g, '').length === 1;
      // "⌘K" or "alt + -" is unambiguously a key combo: its leftover letters shouldn't also run as words.
      const comboOnly = pressing || (kq && kq.mods.size > 0 && kq.keys.length > 0);
      scored = [];
      for (const e of entries) {
        const km = kq ? keyMatch(e, kq, pressing ? { exactOnly: true, platform: state.os } : {}) : { score: 0, hits: null };
        let tm = comboOnly ? { score: 0, terms: [] } : textMatch(e, qn, qw);
        // A single character is almost always a key; keep only name-initial text matches, ranked below keys.
        if (single) tm = { score: tm.score >= 480 ? 300 : 0, terms: [] };
        const score = Math.max(km.score, tm.score);
        if (score > 0) scored.push({ e, score, terms: tm.score >= km.score ? tm.terms : [], hits: km.score ? km.hits : null });
      }
      scored.sort((a, b) => b.score - a.score || baseOrder(a.e, b.e));
    } else {
      scored = entries.slice().sort(baseOrder).map((e) => ({ e, score: 0, terms: [], hits: null }));
    }
    const counts = { tier: {}, cat: {} };
    scored.forEach(({ e }) => {
      if (passes(e, 'tier')) counts.tier[e.tier] = (counts.tier[e.tier] || 0) + 1;
      if (passes(e, 'cat')) counts.cat[e.category] = (counts.cat[e.category] || 0) + 1;
    });
    return { mode, q, results: scored.filter(({ e }) => passes(e)), counts };
  }

  /* ------------------------------------------------------------ rendering helpers */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function highlight(text, terms) {
    if (!terms || !terms.length || !text) return esc(text || '');
    // Fold char by char so match positions map back onto the original (accented / mixed-case) text.
    let folded = '';
    const map = [];
    for (let i = 0; i < text.length; i++) {
      for (const ch of fold(text[i])) { folded += ch; map.push(i); }
    }
    const ranges = [];
    [...new Set(terms)].filter((tm) => tm.length >= 2).forEach((tm) => {
      const pat = tm.split(' ').map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^\\p{L}\\p{N}]+');
      const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${pat})`, 'gu');
      let m;
      while ((m = re.exec(folded))) {
        const s = m.index + m[1].length;
        const e = s + m[2].length;
        ranges.push([map[s], map[e - 1] + 1]);
        if (re.lastIndex === m.index) re.lastIndex++;
      }
    });
    if (!ranges.length) return esc(text);
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [ranges[0]];
    ranges.slice(1).forEach((r) => {
      const last = merged[merged.length - 1];
      if (r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else merged.push(r);
    });
    let out = '', pos = 0;
    merged.forEach(([s, e]) => { out += esc(text.slice(pos, s)) + '<mark>' + esc(text.slice(s, e)) + '</mark>'; pos = e; });
    return out + esc(text.slice(pos));
  }

  const MAC_SYM = { Ctrl: '⌃', Opt: '⌥', Shift: '⇧', Cmd: '⌘' };
  const MOD_TITLE = { Ctrl: 'key.ctrl', Alt: 'key.alt', Opt: 'key.opt', Shift: 'key.shift', Cmd: 'key.cmd' };
  const KEY_INFO = {
    Up: ['↑', 'key.up'], Down: ['↓', 'key.down'], Left: ['←', 'key.left'], Right: ['→', 'key.right'],
    'Page Up': ['PgUp', 'key.pgup'], 'Page Down': ['PgDn', 'key.pgdn'], 'Forward Delete': ['Fwd Del', 'key.fwddel'],
    Backspace: ['Backspace', 'key.bksp'], Enter: ['Enter', 'key.enter'], Return: ['Return', 'key.return'], Tab: ['Tab', 'key.tab'],
    Space: ['Space', 'key.space'], Esc: ['Esc', 'key.esc'], Home: ['Home', 'key.home'], End: ['End', 'key.end'],
    '`': ['`', 'key.grave'], ',': [',', 'key.comma'], '.': ['.', 'key.period'], '/': ['/', 'key.slash'],
    '\\': ['\\', 'key.backslash'], ';': [';', 'key.semicolon'], "'": ["'", 'key.apostrophe'], '[': ['[', 'key.lbracket'],
    ']': [']', 'key.rbracket'], '=': ['=', 'key.equals'], '-': ['-', 'key.minus'],
  };
  const PTR_KEY = { Click: 'click', 'Double-click': 'dblclick', Drag: 'drag', Scroll: 'scroll' };
  const MOUSE_ICON = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3.5" y="1.5" width="9" height="13" rx="4.5"/><path d="M8 1.5v4.5M3.5 6h9"/></svg>';

  // Printed label for a key in the current language (German keyboards say "Strg", French "Maj", …).
  function keyText(k, os) {
    const over = (L.keys[os] || {})[k];
    if (over) return over;
    if (MODS.has(k)) return k;
    if (k === 'Delete') return 'Delete';
    return KEY_INFO[k] ? KEY_INFO[k][0] : k;
  }

  function keyLabel(k, os) {
    if (os === 'mac' && MAC_SYM[k]) return { label: MAC_SYM[k], title: t(MOD_TITLE[k]), mod: true, sym: true };
    if (MODS.has(k)) return { label: keyText(k, os), title: t(MOD_TITLE[k]), mod: true };
    if (k === 'Delete') return { label: keyText(k, os), title: t(os === 'mac' ? 'key.delMac' : 'key.del') };
    if (KEY_INFO[k]) {
      const label = keyText(k, os);
      return { label, title: t(KEY_INFO[k][1]), sym: /^[↑↓←→]$/.test(label) };
    }
    return { label: k, title: /^[A-Z0-9]$/.test(k) ? t('key.n', { k }) : k };
  }

  function keyHTML(k, os) {
    if (POINTER.has(k)) {
      const p = PTR_KEY[k];
      return `<span class="mouse" title="${esc(t(`ptr.${p}T`))}">${MOUSE_ICON}<span>${esc(t(`ptr.${p}`))}</span></span>`;
    }
    const { label, title, mod, sym } = keyLabel(k, os);
    return `<kbd class="key${mod ? ' mod' : ''}${sym ? ' sym' : ''}" title="${esc(title)}"><span aria-hidden="true">${esc(label)}</span><span class="vh">${esc(title)}</span></kbd>`;
  }

  function comboHTML(keys, os, hit) {
    let out = '';
    keys.forEach((k, i) => {
      if (i > 0) {
        const tight = os === 'mac' && MODS.has(keys[i - 1]) && !POINTER.has(k);
        if (!tight) out += '<span class="plus" aria-hidden="true">+</span>';
      }
      out += keyHTML(k, os);
    });
    return `<span class="combo${hit ? ' hit' : ''}">${out}</span>`;
  }

  const isDigitRun = (list) => list.length > 4 && list.every((c) => c.length === 1 && /^\d$/.test(c[0]));

  function combosHTML(entry, os, hits) {
    const list = entry[os] || [];
    if (!list.length) return `<span class="none" title="${esc(t('noneTitle', { os: OS_NAME[os] }))}">—</span>`;
    if (isDigitRun(list)) {
      const hit = hits && hits.size > 0;
      return comboHTML(list[0], os, hit) + `<span class="or">${esc(t('to'))}</span>` + comboHTML(list[list.length - 1], os, hit);
    }
    const sep = list.length > 2 ? '<span class="or">/</span>' : `<span class="or">${esc(t('or'))}</span>`;
    return list.map((c, i) => comboHTML(c, os, hits && hits.has(i))).join(sep);
  }

  const MAC_TEXT = { Ctrl: 'Ctrl', Opt: 'Opt', Shift: 'Shift', Cmd: 'Cmd' };
  const keyWord = (k, os) => (L.keys[os] || {})[k] || (os === 'mac' && MAC_TEXT[k]) || (POINTER.has(k) ? t(`ptr.${PTR_KEY[k]}`) : k);
  function comboText(entry, os) {
    const list = entry[os] || [];
    if (!list.length) return '';
    if (isDigitRun(list)) return `${list[0][0]}–${list[list.length - 1][0]}`;
    return list.map((c) => c.map((k) => keyWord(k, os)).join('+')).join(` ${t('or')} `);
  }

  /* ------------------------------------------------------------ category icons (24px stroke) */
  const ICONS = {
    'File menu': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    'Edit menu': '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    'Clip menu': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4"/>',
    'Sequence menu': '<rect x="3" y="4.5" width="10" height="4" rx="1.2"/><rect x="8" y="10" width="13" height="4" rx="1.2"/><rect x="3" y="15.5" width="8" height="4" rx="1.2"/>',
    'Markers menu': '<path d="M6 3.5h12v17l-6-4.2-6 4.2z"/>',
    'Graphics and Titles menu': '<path d="M5 7V4.5h14V7M12 4.5v15M9 19.5h6"/>',
    'Window menu': '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18"/><path d="M6.5 6.5h.01M9 6.5h.01"/>',
    'Timeline panel': '<path d="M3 7h6M13 7h8M3 12h10M17 12h4M3 17h4M11 17h10"/><path d="M11 3v18"/>',
    'Project panel': '<path d="M3 7.5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    'Program Monitor panel': '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16v4"/><path d="m10.5 7.8 3.6 2.2-3.6 2.2z"/>',
    'Effect Controls panel': '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    'Effects panel': '<path d="M11 3.5l1.7 4.3 4.3 1.7-4.3 1.7L11 15.5l-1.7-4.3L5 9.5l4.3-1.7z"/><path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"/>',
    'Audio Track Mixer panel': '<path d="M6 4v16M12 4v16M18 4v16"/><rect x="4" y="13" width="4" height="3" rx="1"/><rect x="10" y="7" width="4" height="3" rx="1"/><rect x="16" y="10.5" width="4" height="3" rx="1"/>',
    'History panel': '<path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3"/><path d="M3.5 4v4.5H8"/><path d="M12 8v4.2l3 1.8"/>',
    'Media Browser panel': '<path d="M3 7.5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1.5"/><path d="M3 7.5v10a2 2 0 0 0 2 2h6"/><circle cx="16.5" cy="15.5" r="3"/><path d="m21 20-2.2-2.2"/>',
    'Metadata panel': '<path d="M3.5 12V4.5h7.5l9.5 9.5-7.5 7.5z"/><circle cx="8" cy="9" r="1.5"/>',
    Playback: '<circle cx="12" cy="12" r="9"/><path d="m10 8.2 5.8 3.8-5.8 3.8z"/>',
    'Tools panel': '<path d="M5 3.5 19 10l-6 2-2.2 6.5z"/>',
    'Multi-Camera': '<rect x="3" y="4" width="8" height="7" rx="1.5"/><rect x="13" y="4" width="8" height="7" rx="1.5"/><rect x="3" y="13" width="8" height="7" rx="1.5"/><rect x="13" y="13" width="8" height="7" rx="1.5"/>',
    'Keyframes & effects': '<path d="M12 4.5 18 12l-6 7.5L6 12z"/><path d="M2.5 12H6M18 12h3.5"/>',
    Masks: '<circle cx="12" cy="12" r="8" stroke-dasharray="3 2.6"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4"/>',
    'Color mode': '<path d="M12 3.5s6 6.3 6 10.8a6 6 0 0 1-12 0C6 9.8 12 3.5 12 3.5z"/><path d="M9.5 15a2.6 2.6 0 0 0 2.5 2.4"/>',
    Captions: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10.5 10.3a2.2 2.2 0 1 0 0 3.4M17 10.3a2.2 2.2 0 1 0 0 3.4"/>',
    Workspace: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M10 4v16M10 11.5h11"/>',
    Startup: '<path d="M12 3.5v8"/><path d="M6.3 7.3a8 8 0 1 0 11.4 0"/>',
  };
  const iconSVG = (cat) => `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">${ICONS[cat] || '<circle cx="12" cy="12" r="8"/>'}</svg>`;

  const STAR_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"/></svg>';

  function rowHTML(e, i, match) {
    const terms = match ? match.terms : null;
    const hits = match && match.hits ? match.hits[state.os] : null;
    const other = state.os === 'win' ? 'mac' : 'win';
    const only = !(e[state.os] || []).length && (e[other] || []).length
      ? `<span class="badge only">${esc(t('only', { os: OS_NAME[other] }))}</span>` : '';
    const ctx = e.contexts.map((c) => `<span class="badge">${esc(ctxName(c))}</span>`).join('');
    const fav = state.favs.has(e.id);
    const name = nameOf(e);
    const path = pathOf(e);
    const note = noteOf(e);
    return `<li class="row" style="--i:${i}" data-id="${esc(e.id)}">
  <button type="button" class="row-main" data-copy="${esc(e.id)}" title="${esc(t('copyHint'))}">
    <span class="row-text">
      <span class="row-head"><span class="row-title" dir="auto">${highlight(name, terms)}</span>${path ? `<span class="row-path" dir="auto">${highlight(path, terms)}</span>` : ''}</span>
      <span class="row-desc">${highlight(descOf(e), terms)}</span>
      ${note ? `<span class="row-note">${esc(note)}</span>` : ''}
      <span class="row-meta">${ctx}<span class="badge tier-${e.tier}">${esc(tierName(e.tier))}</span>${only}</span>
    </span>
    <span class="row-keys">${combosHTML(e, state.os, hits)}</span>
  </button>
  <span class="row-side">
    <button type="button" class="star" data-star="${esc(e.id)}" aria-pressed="${fav}" aria-label="${esc(t(fav ? 'starRemove' : 'starSave', { action: name }))}" title="${esc(t(fav ? 'starRemoveTitle' : 'starSaveTitle'))}">${STAR_ICON}</button>
    <a class="src" href="${esc(e.source)}" target="_blank" rel="noopener" title="${esc(t('srcTitle'))}" aria-label="${esc(t('srcAria', { action: name }))}">${esc(t('src'))}</a>
  </span>
</li>`;
  }

  function groupHTML({ id, title, intro, lead, eyebrow, items, matchFor }) {
    return `<section class="group glass" aria-labelledby="${id}">
  <header class="group-head">
    ${lead || ''}
    <div class="group-titles">
      ${eyebrow ? `<span class="group-eyebrow">${esc(eyebrow)}</span>` : ''}
      <h2 id="${id}">${esc(title)}</h2>
    </div>
    <span class="group-count">${items.length}</span>
    ${intro ? `<p class="group-intro">${esc(intro)}</p>` : ''}
  </header>
  <ul class="rows">${items.map((e, i) => rowHTML(e, i, matchFor ? matchFor(e) : null)).join('')}</ul>
</section>`;
  }

  /* ------------------------------------------------------------ render */
  const els = {
    q: $('#q'), results: $('#results'), count: $('#count'), searchBox: $('#search-box'),
    press: $('#press-btn'), pressNote: $('#press-note'), clear: $('#clear-filters'),
    chipsTier: $('#chips-tier'), catGroups: $('#cat-groups'), chipsCtx: $('#chips-ctx'),
    toast: $('#toast'), dialog: $('#gem-dialog'), gemBody: $('#gem-body'), dock: $('#search-dock'), lang: $('#lang'),
  };

  const filtersActive = () => state.tiers.size || state.cats.size || state.ctxs.size || state.fav;
  const groupSingular = { menus: 'menu1', panels: 'panel1', techniques: 'technique1' };

  function render() {
    const r = compute();
    const list = r.results;
    let html = '';
    if (r.mode === 'browse') {
      if (state.group === 'category') {
        CAT_ORDER.forEach((cat, gi) => {
          const items = list.map((m) => m.e).filter((e) => e.category === cat).sort((a, b) => a.tier - b.tier || a._i - b._i);
          if (!items.length) return;
          const g = GROUP_OF.get(cat) || 'techniques';
          html += groupHTML({
            id: `g-c${gi}`, title: catShort(cat), intro: catIntro(cat), eyebrow: t(groupSingular[g]),
            lead: `<span class="group-icon grp-${g}" aria-hidden="true">${iconSVG(cat)}</span>`, items,
          });
        });
      } else {
        [1, 2, 3, 4].forEach((n) => {
          const items = list.map((m) => m.e).filter((e) => e.tier === n);
          if (items.length) {
            html += groupHTML({
              id: `g-t${n}`, title: n === 4 ? t('hiddenGems') : tierName(n), intro: tierIntro(n),
              lead: `<span class="tier-orb dot-${n}" aria-hidden="true"></span>`, items,
            });
          }
        });
      }
    } else if (list.length) {
      const matches = new Map(list.map((m) => [m.e, m]));
      html = groupHTML({
        id: 'g-results',
        title: state.press ? t('pressResult', { combo: state.press.text }) : t('bestMatches'),
        intro: state.press ? t('pressResultIntro', { os: OS_NAME[state.os] }) : t('bestMatchesIntro'),
        items: list.map((m) => m.e), matchFor: (e) => matches.get(e),
      });
    }
    if (!list.length) html = emptyHTML();
    els.results.innerHTML = html;
    updateCount(list.length, r.mode);
    updateFilterStates(r.counts);
    els.clear.hidden = !filtersActive();
    scheduleURL();
  }

  function emptyHTML() {
    const q = state.press ? state.press.text : state.q.trim();
    const filters = filtersActive();
    let title, body;
    if (state.fav && !state.favs.size) {
      title = esc(t('emptyFavTitle'));
      body = esc(t('emptyFavBody'));
    } else if (state.press) {
      title = esc(t('emptyPressTitle', { combo: q }));
      body = esc(t('emptyPressBody', { os: OS_NAME[state.os] }));
    } else if (q) {
      title = esc(t('emptyQueryTitle', { q }));
      body = esc(t(filters ? 'emptyQueryBodyFilters' : 'emptyQueryBody'));
    } else {
      title = esc(t('emptyFilterTitle'));
      body = esc(t('emptyFilterBody'));
    }
    const named = ['ripple-delete', 'match-frame'].map((id) => byId.get(id)).filter(Boolean).map(nameOf);
    const suggestions = [...named, 'ctrl k', '⌘K', ...t('suggestions').split('|')];
    return `<section class="empty glass">
  <h2>${title}</h2><p>${body}</p>
  <div class="suggest">
    ${filters ? `<button type="button" class="chip" data-action="clear-filters">${esc(t('clearFiltersShort'))}</button>` : ''}
    ${suggestions.map((s) => `<button type="button" class="chip" data-suggest="${esc(s)}">${esc(s)}</button>`).join('')}
  </div>
</section>`;
  }

  let countTimer = 0;
  function updateCount(shown, mode) {
    const filtered = mode === 'search' || filtersActive();
    const html = filtered
      ? t('countSome', { n: shown, total: TOTAL })
      : t('countAll', { total: TOTAL, os: OS_NAME[state.os] });
    // Debounce the live-region update so screen readers aren't flooded while typing.
    clearTimeout(countTimer);
    countTimer = setTimeout(() => { els.count.innerHTML = html; }, filtered ? 250 : 0);
  }

  /* ------------------------------------------------------------ filters: tiers, category tiles, panels */
  function renderFilters() {
    els.chipsTier.innerHTML = [1, 2, 3, 4].map((n) => `<button type="button" class="chip" data-kind="tier" data-value="${n}" aria-pressed="false">
        <span class="dot dot-${n}" aria-hidden="true"></span>${esc(tierName(n))} <span class="n" data-count="tier-${n}"></span></button>`).join('')
      + `<button type="button" class="chip fav" data-kind="fav" data-value="1" aria-pressed="false"><span aria-hidden="true">★</span> ${esc(t('myShortcuts'))} <span class="n" data-count="fav"></span></button>`;

    els.catGroups.innerHTML = Object.entries(GROUPS).map(([g, cats]) => {
      const present = cats.filter((c) => DATA.some((e) => e.category === c));
      if (!present.length) return '';
      return `<div class="cat-group grp-${g}">
  <h3 class="cat-group-label">${esc(t(g))}</h3>
  <div class="tiles">${present.map((c) => `<button type="button" class="tile" data-kind="cat" data-value="${esc(c)}" aria-pressed="false" title="${esc(catIntro(c))}">
      <span class="tile-icon" aria-hidden="true">${iconSVG(c)}</span><span class="tile-name">${esc(catShort(c))}</span><span class="tile-n" data-count="cat-${esc(c)}"></span></button>`).join('')}</div>
</div>`;
    }).join('');

    const ctxs = [...new Set(DATA.flatMap((e) => e.contexts))]
      .sort((a, b) => (CTX_ORDER.indexOf(a) + 1 || 99) - (CTX_ORDER.indexOf(b) + 1 || 99));
    els.chipsCtx.innerHTML = ctxs.map((c) => `<button type="button" class="chip chip-sm" data-kind="ctx" data-value="${esc(c)}" aria-pressed="false">${esc(ctxName(c))}</button>`).join('');
  }

  // Updates pressed states and live counts in place, so keyboard focus stays on the clicked tile.
  function updateFilterStates(counts) {
    $$('#filters [data-kind]').forEach((b) => {
      const { kind, value } = b.dataset;
      const on = kind === 'fav' ? state.fav
        : kind === 'tier' ? state.tiers.has(Number(value))
          : kind === 'cat' ? state.cats.has(value) : state.ctxs.has(value);
      b.setAttribute('aria-pressed', String(on));
    });
    $$('#filters [data-count]').forEach((span) => {
      const key = span.dataset.count;
      let n;
      if (key === 'fav') n = state.favs.size;
      else if (key.startsWith('tier-')) n = counts.tier[key.slice(5)] || 0;
      else n = counts.cat[key.slice(4)] || 0;
      span.textContent = n;
      const btn = span.closest('[data-kind]');
      if (key !== 'fav') btn.classList.toggle('is-empty', n === 0 && btn.getAttribute('aria-pressed') !== 'true');
    });
  }

  function toggleFilter(kind, value) {
    if (kind === 'fav') state.fav = !state.fav;
    else {
      const set = kind === 'tier' ? state.tiers : kind === 'cat' ? state.cats : state.ctxs;
      const v = kind === 'tier' ? Number(value) : value;
      if (set.has(v)) set.delete(v); else set.add(v);
    }
    render();
  }

  function clearFilters() {
    state.tiers.clear(); state.cats.clear(); state.ctxs.clear(); state.fav = false;
    render();
  }

  /* ------------------------------------------------------------ OS, grouping, language */
  function setOS(os) {
    state.os = os;
    store.set('psc-os', os);
    $$('.os-toggle button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.os === os)));
    if (state.listening) stopListening(false);
    render();
  }

  function setGroup(g) {
    state.group = g;
    $$('[data-group]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.group === g)));
    render();
  }

  function loadLangPack(code) {
    return new Promise((resolve) => {
      if (code === 'en') { resolve({}); return; }
      const packs = window.PREMIERE_I18N || {};
      if (packs[code]) { resolve(packs[code]); return; }
      const s = document.createElement('script');
      const v = (document.querySelector('meta[name="data-version"]') || {}).content || '';
      s.src = `data/i18n/${code}.js${v ? `?v=${v}` : ''}`;
      s.onload = () => resolve((window.PREMIERE_I18N || {})[code] || null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }

  async function setLang(code, opts = {}) {
    if (!LANGS[code]) code = 'en';
    let pack = await loadLangPack(code);
    if (!pack) { code = 'en'; pack = {}; }
    state.lang = code;
    L = { ui: {}, tiers: {}, categories: {}, contexts: {}, keys: {}, entries: {}, ...pack };
    document.documentElement.lang = code;
    document.documentElement.dir = (LANGS[code] && LANGS[code].dir) || 'ltr';
    els.lang.value = code;
    if (!opts.initial) store.set('psc-lang', code);
    applyStatic();
    renderLangList();
    buildIndex();
    renderFilters();
    render();
  }

  function applyStatic() {
    document.title = t('title');
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    $$('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':');
        el.setAttribute(attr, t(key));
      });
    });
    els.q.placeholder = state.listening ? t('pressPlaceholder', { os: OS_NAME[state.os] }) : defaultPlaceholder();
    renderFooter();
  }

  /* ------------------------------------------------------------ URL sync */
  let urlTimer = 0;
  function scheduleURL() { clearTimeout(urlTimer); urlTimer = setTimeout(writeURL, 300); }
  function writeURL() {
    const p = new URLSearchParams();
    if (state.q.trim()) p.set('q', state.q.trim());
    if (state.tiers.size) p.set('tier', [...state.tiers].sort().join(','));
    if (state.cats.size) p.set('cat', [...state.cats].join('|'));
    if (state.ctxs.size) p.set('ctx', [...state.ctxs].join('|'));
    if (state.fav) p.set('fav', '1');
    if (state.group !== 'tier') p.set('group', state.group);
    if (state.lang !== 'en') p.set('lang', state.lang);
    const qs = p.toString();
    const url = location.pathname + (qs ? `?${qs}` : '');
    try {
      if (location.search.slice(1) !== qs) history.replaceState(null, '', url);
    } catch {
      try { history.replaceState(null, '', qs ? `#${qs}` : ' '); } catch { /* give up quietly */ }
    }
  }
  function readURL() {
    const raw = location.search.length > 1 ? location.search.slice(1) : location.hash.slice(1);
    const p = new URLSearchParams(raw);
    state.q = p.get('q') || '';
    (p.get('tier') || '').split(',').map(Number).filter((n) => EN_TIERS[n]).forEach((n) => state.tiers.add(n));
    (p.get('cat') || '').split('|').filter((c) => CAT_RANK.has(c) || CAT_ORDER.includes(c)).forEach((c) => state.cats.add(c));
    (p.get('ctx') || '').split('|').filter(Boolean).forEach((c) => state.ctxs.add(c));
    state.fav = p.get('fav') === '1';
    if (p.get('group') === 'category') state.group = 'category';
    return p.get('lang');
  }

  /* ------------------------------------------------------------ copy + toast */
  let toastTimer = 0;
  function toast(html) {
    els.toast.innerHTML = html;
    els.toast.hidden = false;
    requestAnimationFrame(() => els.toast.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.classList.remove('show');
      setTimeout(() => { els.toast.hidden = true; }, 250);
    }, 1800);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch { /* fall through */ }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-100px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }

  async function copyEntry(id) {
    const e = byId.get(id);
    if (!e) return;
    let os = state.os;
    let text = comboText(e, os);
    let prefix = '';
    if (!text) {
      os = os === 'win' ? 'mac' : 'win';
      text = comboText(e, os);
      prefix = t('noDefaultFor', { os: OS_NAME[state.os] });
    }
    const ok = await copyText(text);
    const keys = `<bdi><strong>${esc(text)}</strong></bdi>`;
    toast(ok
      ? `<span class="tick" aria-hidden="true">✓</span> ${esc(prefix)}${t('copied', { text: keys, action: `<bdi>${esc(nameOf(e))}</bdi>` })}`
      : esc(t('copyFailed', { action: nameOf(e), text })));
  }

  function toggleFav(id) {
    if (state.favs.has(id)) state.favs.delete(id); else state.favs.add(id);
    store.set('psc-favs', [...state.favs]);
    const on = state.favs.has(id);
    const name = nameOf(byId.get(id));
    $$(`.star[data-star="${CSS.escape(id)}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', t(on ? 'starRemove' : 'starSave', { action: name }));
      b.title = t(on ? 'starRemoveTitle' : 'starSaveTitle');
    });
    if (state.fav) render(); else $$('#filters [data-count="fav"]').forEach((s) => { s.textContent = state.favs.size; });
    toast(on ? `<span aria-hidden="true">★</span> ${esc(t('saved'))}` : esc(t('removed')));
  }

  /* ------------------------------------------------------------ random hidden gem */
  const GEMS = entries.filter((e) => e.tier === 4);
  let lastGem = null;
  function showGem(reuse) {
    if (!GEMS.length) return;
    let g = reuse && lastGem;
    if (!g) {
      do { g = GEMS[Math.floor(Math.random() * GEMS.length)]; } while (GEMS.length > 1 && g === lastGem);
    }
    lastGem = g;
    const other = state.os === 'win' ? 'mac' : 'win';
    const otherText = comboText(g, other);
    const note = noteOf(g);
    const g2 = GROUP_OF.get(g.category) || 'techniques';
    els.gemBody.innerHTML = `
      <p class="gem-kicker"><span class="badge tier-4">${esc(t('gemKicker'))}</span>${g.contexts.map((c) => `<span class="badge">${esc(ctxName(c))}</span>`).join('')}</p>
      <div class="gem-title-row"><span class="group-icon grp-${g2}" aria-hidden="true">${iconSVG(g.category)}</span>
        <div><h2 id="gem-title" dir="auto">${esc(nameOf(g))}</h2><span class="row-path" dir="auto">${esc(pathOf(g) || catShort(g.category))}</span></div></div>
      <p class="gem-desc">${esc(descOf(g))}</p>
      <div class="gem-keys">${combosHTML(g, state.os, null)}</div>
      ${otherText ? `<p class="gem-other">${OS_NAME[other]}: <bdi>${esc(otherText)}</bdi></p>` : ''}
      ${note ? `<p class="gem-other row-note">${esc(note)}</p>` : ''}
      <p class="gem-src"><a href="${esc(g.source)}" target="_blank" rel="noopener">${esc(t('gemSource'))}</a></p>`;
    if (!els.dialog.open) {
      if (typeof els.dialog.showModal === 'function') els.dialog.showModal(); else els.dialog.setAttribute('open', '');
    }
  }
  function closeGem() {
    if (typeof els.dialog.close === 'function') els.dialog.close(); else els.dialog.removeAttribute('open');
  }

  function revealEntry(e) {
    state.q = nameOf(e);
    els.q.value = state.q;
    clearFilters();
    requestAnimationFrame(() => {
      const row = $(`.row[data-id="${CSS.escape(e.id)}"]`);
      if (!row) return;
      row.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      row.classList.add('flash');
      $('.row-main', row).focus({ preventScroll: true });
    });
  }

  /* ------------------------------------------------------------ press to find */
  const CODE_KEYS = {
    Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', IntlBackslash: '\\',
    Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Space: 'Space', Tab: 'Tab',
    Home: 'Home', End: 'End', PageUp: 'Page Up', PageDown: 'Page Down',
    ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
    NumpadAdd: '=', NumpadSubtract: '-', NumpadDecimal: '.', NumpadDivide: '/',
  };
  // Physical key (event.code), so a Russian or German layout still reports the US key Premiere lists.
  function labelFromEvent(ev) {
    const c = ev.code || '';
    if (/^Key[A-Z]$/.test(c)) return c.slice(3);
    if (/^(Digit|Numpad)\d$/.test(c)) return c.slice(-1);
    if (/^F\d{1,2}$/.test(c)) return c;
    if (c === 'Enter' || c === 'NumpadEnter') return state.os === 'mac' && c === 'Enter' ? 'Return' : 'Enter';
    if (c === 'Backspace') return state.os === 'mac' ? 'Delete' : 'Backspace';
    if (c === 'Delete') return state.os === 'mac' ? 'Forward Delete' : 'Delete';
    if (CODE_KEYS[c]) return CODE_KEYS[c];
    if (ev.key && ev.key.length === 1 && /[a-z0-9]/i.test(ev.key)) return ev.key.toUpperCase();
    return null;
  }
  function modsFromEvent(ev) {
    const mods = [];
    if (state.os === 'mac') {
      if (ev.ctrlKey) mods.push('Ctrl');
      if (ev.altKey) mods.push('Opt');
      if (ev.shiftKey) mods.push('Shift');
      if (ev.metaKey) mods.push('Cmd');
    } else {
      if (ev.ctrlKey) mods.push('Ctrl');
      if (ev.altKey) mods.push('Alt');
      if (ev.shiftKey) mods.push('Shift');
    }
    return mods;
  }
  const comboDisplay = (keys) => keys.map((k) => keyWord(k, state.os)).join(' + ');
  const defaultPlaceholder = () => t(matchMedia('(max-width: 420px)').matches ? 'placeholderShort' : 'placeholder');

  function startListening() {
    state.listening = true;
    state.press = null;
    els.press.setAttribute('aria-pressed', 'true');
    els.pressNote.hidden = false;
    els.searchBox.classList.add('listening');
    els.q.readOnly = true;
    els.q.value = '';
    els.q.placeholder = t('pressPlaceholder', { os: OS_NAME[state.os] });
    els.q.focus();
    render();
  }
  function stopListening(restore = true) {
    state.listening = false;
    els.press.setAttribute('aria-pressed', 'false');
    els.pressNote.hidden = true;
    els.searchBox.classList.remove('listening');
    els.q.readOnly = false;
    els.q.placeholder = defaultPlaceholder();
    if (restore) {
      // Keep the captured combo as an ordinary (editable) query.
      state.q = state.press ? state.press.text : state.q;
      els.q.value = state.q;
    }
    state.press = null;
    render();
  }

  function onPressKey(ev) {
    if (ev.key === 'Escape') { ev.preventDefault(); stopListening(true); return; }
    if (ev.target.closest && ev.target.closest('dialog')) return;
    ev.preventDefault();
    ev.stopPropagation();
    const mods = modsFromEvent(ev);
    const isModKey = ['Control', 'Alt', 'Shift', 'Meta', 'OS', 'AltGraph', 'CapsLock'].includes(ev.key);
    if (isModKey) {
      els.q.value = mods.length ? `${comboDisplay(mods)} + …` : '';
      return;
    }
    const key = labelFromEvent(ev);
    if (!key) return;
    const keys = [...mods, key];
    const canon = canonCombo(keys, state.os);
    // Use the most specific token so Backspace-type keys don't also match Forward Delete.
    const specific = { Delete: state.os === 'mac' ? 'backspace' : 'delete', 'Forward Delete': 'fwddel' };
    state.press = { text: comboDisplay(keys), kq: { mods: canon.mods, keys: [specific[key] || canon.keys[canon.keys.length - 1][0]] } };
    els.q.value = state.press.text;
    render();
  }

  /* ------------------------------------------------------------ events */
  let inputTimer = 0;
  els.q.addEventListener('input', () => {
    if (state.listening) return;
    state.q = els.q.value;
    clearTimeout(inputTimer);
    inputTimer = setTimeout(render, 40);
  });

  els.press.addEventListener('click', () => (state.listening ? stopListening(true) : startListening()));

  document.addEventListener('keydown', (ev) => {
    if (state.listening) { onPressKey(ev); return; }
    const tg = ev.target;
    const typing = tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable);
    if (ev.key === '/' && !typing && !ev.ctrlKey && !ev.metaKey && !ev.altKey && !els.dialog.open) {
      ev.preventDefault();
      els.q.focus();
      els.q.select();
    } else if (ev.key === 'Escape' && tg === els.q) {
      if (els.q.value) {
        ev.preventDefault();
        els.q.value = '';
        state.q = '';
        render();
      } else {
        els.q.blur();
      }
    }
  }, true);

  $$('.os-toggle button').forEach((b) => b.addEventListener('click', () => setOS(b.dataset.os)));
  $$('[data-group]').forEach((b) => b.addEventListener('click', () => setGroup(b.dataset.group)));
  $('#filters').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-kind]');
    if (btn) toggleFilter(btn.dataset.kind, btn.dataset.value);
  });
  els.clear.addEventListener('click', clearFilters);
  els.lang.addEventListener('change', () => setLang(els.lang.value));
  $('#lang-list').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-lang]');
    if (!b) return;
    setLang(b.dataset.lang);
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  // Keep the short/long placeholder in step with the viewport.
  matchMedia('(max-width: 420px)').addEventListener('change', () => {
    if (!state.listening) els.q.placeholder = defaultPlaceholder();
  });

  els.results.addEventListener('click', (ev) => {
    const star = ev.target.closest('[data-star]');
    if (star) { toggleFav(star.dataset.star); return; }
    const copy = ev.target.closest('[data-copy]');
    if (copy) { copyEntry(copy.dataset.copy); return; }
    const sug = ev.target.closest('[data-suggest]');
    if (sug) {
      if (state.listening) stopListening(false);
      els.q.value = sug.dataset.suggest;
      state.q = sug.dataset.suggest;
      render();
      els.q.focus();
      return;
    }
    if (ev.target.closest('[data-action="clear-filters"]')) clearFilters();
  });

  $('#gem-btn').addEventListener('click', () => showGem(false));
  $('#gem-another').addEventListener('click', () => showGem(false));
  $('#gem-close').addEventListener('click', closeGem);
  $('#gem-show').addEventListener('click', () => { closeGem(); if (state.listening) stopListening(false); if (lastGem) revealEntry(lastGem); });
  els.dialog.addEventListener('click', (ev) => { if (ev.target === els.dialog) closeGem(); });

  // Shadow + fade behind the sticky search bar once it detaches from the hero.
  if ('IntersectionObserver' in window) {
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    els.dock.before(sentinel);
    new IntersectionObserver(([en]) => els.dock.classList.toggle('stuck', !en.isIntersecting)).observe(sentinel);
  }

  /* ------------------------------------------------------------ footer + init */
  function renderFooter() {
    const sources = META.sources || [...new Set(DATA.map((e) => e.source))];
    $('#sources-summary').textContent = t('sourcesSummary', { n: sources.length + (L.officialSource ? 1 : 0) });
    $('#sources-list').innerHTML = [...sources, ...(L.officialSource ? [L.officialSource] : [])].map((u) => {
      const label = u.replace(/^https:\/\/helpx\.adobe\.com\/(\w+\/)?premiere\/desktop\//, (m, locale) => (locale ? `[${locale.slice(0, -1)}] ` : ''))
        .replace(/\.html$/, '').replace(/[-/]/g, (c) => (c === '/' ? ' › ' : ' '));
      return `<li><a href="${esc(u)}" target="_blank" rel="noopener" dir="ltr">${esc(label)}</a></li>`;
    }).join('');
    const tc = [1, 2, 3, 4].map((n) => DATA.filter((e) => e.tier === n).length);
    $('#build-info').textContent = t('buildInfo', { total: TOTAL, t1: tc[0], t2: tc[1], t3: tc[2], t4: tc[3], date: META.generated || '—' });
    $('#lede').innerHTML = t('lede', { total: TOTAL, pages: sources.length });
    $('#footer2').innerHTML = t('footer2Html', { url: esc(META.primarySource || '') });
    const nn = $('#names-note');
    nn.innerHTML = t('namesNote', { url: esc(L.officialSource || '') });
    nn.hidden = !nn.textContent.trim();
  }

  function renderLangList() {
    $('#lang-list').innerHTML = Object.entries(LANGS).map(([code, v]) =>
      `<button type="button" class="lang-link" data-lang="${code}" lang="${code}" aria-pressed="${code === state.lang}">${esc(v.name)}</button>`).join('');
  }

  async function init() {
    els.lang.innerHTML = Object.entries(LANGS).map(([code, v]) => `<option value="${code}" lang="${code}">${esc(v.name)}</option>`).join('');
    const urlLang = readURL();
    els.q.value = state.q;
    $$('.os-toggle button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.os === state.os)));
    $$('[data-group]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.group === state.group)));
    if (!TOTAL) {
      els.results.innerHTML = '<section class="empty glass"><h2>No data loaded</h2><p>data/shortcuts.js is missing. Run <code>python scripts/build_shortcuts.py</code>.</p></section>';
      return;
    }
    await setLang((urlLang && LANGS[urlLang] && urlLang) || store.get('psc-lang', null) || detectLang(), { initial: !urlLang });
    els.q.focus({ preventScroll: true });
  }

  init();
})();
