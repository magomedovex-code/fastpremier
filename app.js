/* Premiere Pro Shortcuts — search, filters and rendering. No dependencies, works from file://. */
(() => {
  'use strict';

  const DATA = Array.isArray(window.PREMIERE_SHORTCUTS) ? window.PREMIERE_SHORTCUTS : [];
  const META = window.PREMIERE_SHORTCUTS_META || {};
  const TOTAL = DATA.length;

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const TIERS = { 1: 'Essential', 2: 'Everyday', 3: 'Pro', 4: 'Hidden gem' };
  const TIER_INTROS = {
    1: 'The daily basics. If you learn nothing else, learn these.',
    2: 'Regular workflow moves that pay off on every edit.',
    3: 'Power-user moves for precise trimming, nudging and three-point editing.',
    4: 'Obscure, panel-specific and modifier tricks most editors never discover.',
  };
  Object.entries(META.tiers || {}).forEach(([t, v]) => { TIERS[t] = v.name; TIER_INTROS[t] = v.intro; });
  const OS_NAME = { win: 'Windows', mac: 'macOS' };

  const CAT_ORDER = META.categoryOrder || [...new Set(DATA.map((e) => e.category))];
  const CAT_RANK = new Map(CAT_ORDER.map((c, i) => [c, i]));
  const CAT_INTROS = META.categoryIntros || {};
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

  const state = {
    q: '',
    tiers: new Set(),
    cats: new Set(),
    ctxs: new Set(),
    fav: false,
    group: 'tier',
    os: store.get('psc-os', null) || detectOS(),
    favs: new Set(store.get('psc-favs', [])),
    press: null, // {text, kq} while press-to-find has captured a combo
    listening: false,
  };

  /* ------------------------------------------------------------ text normalisation & index */
  const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
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

  const entries = DATA.map((e, i) => {
    const meta = [...(e.aliases || []), e.menuPath || '', e.category, ...(e.sections || []), ...(e.contexts || []), TIERS[e.tier]];
    return Object.assign({}, e, {
      _i: i,
      _name: norm(e.action),
      _nameW: words(e.action),
      _alias: (e.aliases || []).map(norm),
      _metaW: [...new Set(words(meta.join(' ')))],
      _descW: words(e.description),
      _combos: { win: (e.win || []).map((c) => canonCombo(c, 'win')), mac: (e.mac || []).map((c) => canonCombo(c, 'mac')) },
    });
  });
  const byId = new Map(entries.map((e) => [e.id, e]));
  const VOCAB = [...new Set(entries.flatMap((e) => [...e._nameW, ...e._metaW, ...e._descW]))].filter((w) => w.length >= 3);

  /* ------------------------------------------------------------ key-combo queries */
  const MOD_WORDS = { cmd: 'cmd', command: 'cmd', meta: 'cmd', ctrl: 'ctrl', control: 'ctrl', ctl: 'ctrl',
    alt: 'alt', opt: 'alt', option: 'alt', shift: 'shift' };
  const KEY_WORDS = { up: 'up', down: 'down', left: 'left', right: 'right', space: 'space', spacebar: 'space',
    enter: 'enter', return: 'enter', tab: 'tab', esc: 'esc', escape: 'esc', home: 'home', end: 'end',
    pageup: 'pageup', pgup: 'pageup', pagedown: 'pagedown', pgdn: 'pagedown', delete: 'delete', del: 'delete',
    backspace: 'backspace', bksp: 'backspace', fwddel: 'fwddel', backtick: '`', backquote: '`', grave: '`',
    accent: '`', tilde: '`', comma: ',', period: '.', dot: '.', slash: '/', backslash: '\\', semicolon: ';',
    apostrophe: "'", quote: "'", minus: '-', dash: '-', hyphen: '-', equals: '=', equal: '=', plus: '=',
    click: 'click', dblclick: 'dblclick', drag: 'drag', scroll: 'scroll', wheel: 'scroll' };

  /** "ctrl k", "ctrl+k", "cmd-k", "⌘K", "shift ;" -> {mods:Set, keys:[token]}; null if not a combo. */
  function parseKeyQuery(raw) {
    const s = String(raw).toLowerCase()
      .replace(/⌘/g, ' cmd ').replace(/⌥/g, ' alt ').replace(/⇧/g, ' shift ').replace(/⌃/g, ' ctrl ')
      .replace(/↑/g, ' up ').replace(/↓/g, ' down ').replace(/←/g, ' left ').replace(/→/g, ' right ')
      .replace(/⌫/g, ' backspace ').replace(/⌦/g, ' fwddel ').replace(/[⏎↩]/g, ' enter ').replace(/⇥/g, ' tab ').replace(/⎋/g, ' esc ')
      .replace(/page\s*up/g, ' pageup ').replace(/page\s*down/g, ' pagedown ')
      .replace(/forward\s*delete|fwd\s*del(ete)?/g, ' fwddel ')
      .replace(/double[\s-]*click/g, ' dblclick ')
      .replace(/mouse\s*wheel/g, ' scroll ')
      .replace(/\b(up|down|left|right)\s*arrow\b|\barrow\s*(up|down|left|right)\b/g, (m, a, b) => ` ${a || b} `);
    const raw_ = s.match(/[a-z0-9]+|[^\sa-z0-9]/g) || [];
    const toks = [];
    raw_.forEach((t, i) => {
      const sep = (t === '+' || t === '-') && i > 0 && i < raw_.length - 1 && raw_[i - 1] !== '+' && raw_[i - 1] !== '-';
      if (!sep) toks.push(t);
    });
    if (!toks.length || toks.length > 6) return null;
    const mods = new Set();
    const keys = [];
    for (const t of toks) {
      if (MOD_WORDS[t]) mods.add(MOD_WORDS[t]);
      else if (KEY_WORDS[t]) keys.push(KEY_WORDS[t]);
      else if (t.length === 1) keys.push(t === '+' ? '=' : t === '~' ? '`' : t);
      else if (/^f([1-9]|1[0-2])$/.test(t)) keys.push(t);
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
      const prefLim = 1; // for half-typed words: "ripp" ~ "rippl(e)"
      for (const v of VOCAB) {
        if (v[0] !== w[0]) continue; // typos rarely hit the first letter; keeps "poster" away from "faster"
        if (osa(w, v, lim) <= lim) { out.add(v); continue; }
        if (v.length > w.length && osa(w, v.slice(0, w.length), prefLim) <= prefLim) out.add(v);
      }
    }
    if (fuzzyCache.size > 400) fuzzyCache.clear();
    fuzzyCache.set(w, out);
    return out;
  }

  /** exact name 1000 > name prefix 900 > alias phrase 780 > whole words ~600 > prefixes ~480 > meta ~360 > description ~240 > fuzzy ~120 */
  function textMatch(entry, qn, qw) {
    if (!qw.length) return { score: 0, terms: [] };
    if (entry._name === qn) return { score: 1000, terms: [qn] };
    if (entry._name.startsWith(qn)) return { score: 900, terms: [qn] };
    if (entry._alias.includes(qn)) return { score: 780, terms: qw };
    let minL = 9, sum = 0;
    const terms = [];
    for (const w of qw) {
      let L = 0;
      if (entry._nameW.includes(w)) L = 5;
      else if (entry._nameW.some((x) => x.startsWith(w))) L = 4;
      else if (entry._metaW.some((x) => x.startsWith(w))) L = 3;
      else if (entry._descW.some((x) => x.startsWith(w)) || (w.length >= 3 && entry._name.includes(w))) L = 2;
      else {
        const fz = fuzzySet(w);
        const found = [...entry._nameW, ...entry._metaW, ...entry._descW].filter((x) => fz.has(x));
        if (found.length) { L = 1; terms.push(...found); }
      }
      if (!L) return { score: 0, terms: [] };
      if (L > 1) terms.push(w);
      minL = Math.min(minL, L);
      sum += L;
    }
    const inOrder = qw.length > 1 && entry._name.includes(qw.join(' ')) ? 15 : 0;
    return { score: minL * 100 + Math.round((20 * sum) / qw.length) + inOrder, terms };
  }

  /* ------------------------------------------------------------ filtering + ranking */
  function passesFilters(e) {
    if (state.tiers.size && !state.tiers.has(e.tier)) return false;
    if (state.cats.size && !state.cats.has(e.category)) return false;
    if (state.ctxs.size && !e.contexts.some((c) => state.ctxs.has(c))) return false;
    if (state.fav && !state.favs.has(e.id)) return false;
    return true;
  }

  const baseOrder = (a, b) => a.tier - b.tier || (CAT_RANK.get(a.category) ?? 99) - (CAT_RANK.get(b.category) ?? 99) || a._i - b._i;

  function compute() {
    const pool = entries.filter(passesFilters);
    const pressing = !!state.press;
    const q = state.listening ? (pressing ? state.press.text : '') : state.q.trim();
    if (!q) return { mode: 'browse', list: pool.slice().sort(baseOrder), pool };

    const kq = pressing ? state.press.kq : parseKeyQuery(q);
    const qn = norm(q);
    const qw = qn.split(' ').filter(Boolean);
    const single = q.replace(/\s/g, '').length === 1;
    // "⌘K" or "alt + -" is unambiguously a key combo: its leftover letters shouldn't also run as words.
    const comboOnly = pressing || (kq && kq.mods.size > 0 && kq.keys.length > 0);
    const results = [];
    for (const e of pool) {
      const km = kq ? keyMatch(e, kq, pressing ? { exactOnly: true, platform: state.os } : {}) : { score: 0, hits: null };
      let tm = comboOnly ? { score: 0, terms: [] } : textMatch(e, qn, qw);
      // A single character is almost always a key; keep only name-initial text matches, ranked below keys.
      if (single) tm = { score: tm.score >= 480 ? 300 : 0, terms: [] };
      const score = Math.max(km.score, tm.score);
      if (score > 0) results.push({ e, score, terms: tm.score >= km.score ? tm.terms : [], hits: km.score ? km.hits : null });
    }
    results.sort((a, b) => b.score - a.score || baseOrder(a.e, b.e) || a.e.action.localeCompare(b.e.action));
    return { mode: 'search', results, pool, q, kq };
  }

  /* ------------------------------------------------------------ rendering helpers */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function highlight(text, terms) {
    if (!terms || !terms.length || !text) return esc(text || '');
    const lower = text.toLowerCase();
    const ranges = [];
    [...new Set(terms)].filter((t) => t.length >= 2).forEach((t) => {
      const parts = t.split(' ');
      const re = new RegExp('(^|[^a-z0-9])(' + parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^a-z0-9]+') + ')', 'g');
      let m;
      while ((m = re.exec(lower))) {
        const start = m.index + m[1].length;
        ranges.push([start, start + m[2].length]);
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

  const MAC_MOD = { Ctrl: ['⌃', 'Control'], Opt: ['⌥', 'Option'], Shift: ['⇧', 'Shift'], Cmd: ['⌘', 'Command'] };
  const WIN_MOD = { Ctrl: ['Ctrl', 'Control'], Alt: ['Alt', 'Alt'], Shift: ['Shift', 'Shift'] };
  const KEY_NAMES = {
    Up: ['↑', 'Up Arrow'], Down: ['↓', 'Down Arrow'], Left: ['←', 'Left Arrow'], Right: ['→', 'Right Arrow'],
    'Page Up': ['PgUp', 'Page Up'], 'Page Down': ['PgDn', 'Page Down'], 'Forward Delete': ['Fwd Del', 'Forward Delete (⌦)'],
    Backspace: ['Backspace', 'Backspace'], Enter: ['Enter', 'Enter'], Return: ['Return', 'Return'], Tab: ['Tab', 'Tab'],
    Space: ['Space', 'Spacebar'], Esc: ['Esc', 'Escape'], Home: ['Home', 'Home'], End: ['End', 'End'],
    '`': ['`', 'Grave accent / backtick (the key left of 1)'], ',': [',', 'Comma'], '.': ['.', 'Period'], '/': ['/', 'Slash'],
    '\\': ['\\', 'Backslash'], ';': [';', 'Semicolon'], "'": ["'", 'Apostrophe'], '[': ['[', 'Left bracket'],
    ']': [']', 'Right bracket'], '=': ['=', 'Equals'], '-': ['-', 'Minus / hyphen'],
  };
  const MOUSE_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="1.5" width="9" height="13" rx="4.5"/><path d="M8 1.5v4.5M3.5 6h9"/></svg>';
  const POINTER_TITLE = { Click: 'Mouse click', 'Double-click': 'Mouse double-click', Drag: 'Mouse drag', Scroll: 'Mouse wheel scroll' };

  function keyLabel(k, os) {
    if (os === 'mac' && MAC_MOD[k]) return { label: MAC_MOD[k][0], title: MAC_MOD[k][1], mod: true, sym: true };
    if (os === 'win' && WIN_MOD[k]) return { label: WIN_MOD[k][0], title: WIN_MOD[k][1], mod: true };
    if (k === 'Delete') return { label: 'Delete', title: os === 'mac' ? 'Delete (⌫)' : 'Delete' };
    if (KEY_NAMES[k]) {
      const [label, title] = KEY_NAMES[k];
      return { label, title, sym: /^[↑↓←→]$/.test(label) };
    }
    return { label: k, title: /^[A-Z0-9]$/.test(k) ? `${k} key` : k };
  }

  function keyHTML(k, os) {
    if (POINTER.has(k)) {
      return `<span class="mouse" title="${POINTER_TITLE[k]}">${MOUSE_ICON}<span>${esc(k)}</span></span>`;
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
    if (!list.length) {
      return `<span class="none" title="Adobe documents no default ${OS_NAME[os]} shortcut">—</span>`;
    }
    if (isDigitRun(list)) {
      const hit = hits && hits.size > 0;
      return comboHTML(list[0], os, hit) + '<span class="or">to</span>' + comboHTML(list[list.length - 1], os, hit);
    }
    const sep = list.length > 2 ? '<span class="or">/</span>' : '<span class="or">or</span>';
    return list.map((c, i) => comboHTML(c, os, hits && hits.has(i))).join(sep);
  }

  const MAC_TEXT = { Ctrl: 'Ctrl', Opt: 'Opt', Shift: 'Shift', Cmd: 'Cmd' };
  function comboText(entry, os) {
    const list = entry[os] || [];
    if (!list.length) return '';
    if (isDigitRun(list)) return `${list[0][0]}–${list[list.length - 1][0]}`;
    return list.map((c) => c.map((k) => (os === 'mac' && MAC_TEXT[k]) || k).join('+')).join(' or ');
  }

  const STAR_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"/></svg>';

  function rowHTML(e, i, match) {
    const terms = match ? match.terms : null;
    const hits = match && match.hits ? match.hits[state.os] : null;
    const other = state.os === 'win' ? 'mac' : 'win';
    const only = !(e[state.os] || []).length && (e[other] || []).length
      ? `<span class="badge only">${OS_NAME[other]} only</span>` : '';
    const ctx = e.contexts.map((c) => `<span class="badge">${esc(c)}</span>`).join('');
    const fav = state.favs.has(e.id);
    return `<li class="row" style="--i:${i}" data-id="${esc(e.id)}">
  <button type="button" class="row-main" data-copy="${esc(e.id)}" title="Click to copy the shortcut">
    <span class="row-text">
      <span class="row-head"><span class="row-title">${highlight(e.action, terms)}</span>${e.menuPath ? `<span class="row-path">${highlight(e.menuPath, terms)}</span>` : ''}</span>
      <span class="row-desc">${highlight(e.description, terms)}</span>
      ${e.note ? `<span class="row-note">${esc(e.note)}</span>` : ''}
      <span class="row-meta">${ctx}<span class="badge tier-${e.tier}">${TIERS[e.tier]}</span>${only}</span>
    </span>
    <span class="row-keys">${combosHTML(e, state.os, hits)}</span>
  </button>
  <span class="row-side">
    <button type="button" class="star" data-star="${esc(e.id)}" aria-pressed="${fav}" aria-label="${fav ? 'Remove' : 'Save'} ${esc(e.action)} ${fav ? 'from' : 'to'} My shortcuts" title="${fav ? 'Remove from' : 'Save to'} My shortcuts">${STAR_ICON}</button>
    <a class="src" href="${esc(e.source)}" target="_blank" rel="noopener" title="Adobe source page" aria-label="Adobe source for ${esc(e.action)} (opens in a new tab)">SRC ↗</a>
  </span>
</li>`;
  }

  function groupHTML(id, title, intro, dotClass, items, matchFor) {
    return `<section class="group glass" aria-labelledby="${id}">
  <header class="group-head">
    <h2 id="${id}">${dotClass ? `<span class="dot ${dotClass}" aria-hidden="true"></span>` : ''}${esc(title)}</h2>
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
    chipsTier: $('#chips-tier'), chipsCat: $('#chips-cat'), chipsCtx: $('#chips-ctx'),
    toast: $('#toast'), dialog: $('#gem-dialog'), gemBody: $('#gem-body'), dock: $('#search-dock'),
  };

  function filtersActive() { return state.tiers.size || state.cats.size || state.ctxs.size || state.fav; }

  function render() {
    const r = compute();
    let html = '';
    let shown;
    if (r.mode === 'browse') {
      shown = r.list.length;
      if (state.group === 'category') {
        CAT_ORDER.forEach((cat, gi) => {
          const items = r.list.filter((e) => e.category === cat).sort((a, b) => a.tier - b.tier || a._i - b._i);
          if (items.length) html += groupHTML(`g-c${gi}`, cat, CAT_INTROS[cat], null, items);
        });
      } else {
        [1, 2, 3, 4].forEach((t) => {
          const items = r.list.filter((e) => e.tier === t);
          if (items.length) html += groupHTML(`g-t${t}`, t === 4 ? 'Hidden gems' : TIERS[t], TIER_INTROS[t], `dot-${t}`, items);
        });
      }
    } else {
      shown = r.results.length;
      const matches = new Map(r.results.map((m) => [m.e, m]));
      const items = r.results.map((m) => m.e);
      if (items.length) {
        const title = state.press ? `${state.press.text} in Premiere` : 'Best matches';
        const intro = state.press
          ? `Default ${OS_NAME[state.os]} shortcut${items.length === 1 ? '' : 's'} using exactly this combination.`
          : 'Ranked by closeness: exact name, then prefix, whole word, alias or description, then fuzzy matches.';
        html = groupHTML('g-results', title, intro, null, items, (e) => matches.get(e));
      }
    }
    if (!shown) html = emptyHTML(r);
    els.results.innerHTML = html;
    updateCount(shown, r.mode);
    els.clear.hidden = !filtersActive();
    scheduleURL();
  }

  function emptyHTML(r) {
    const q = state.press ? state.press.text : state.q.trim();
    const filters = filtersActive();
    let title, body;
    if (state.fav && !state.favs.size) {
      title = 'No saved shortcuts yet';
      body = 'Tap the star on any row to keep it in My shortcuts. They are saved in this browser.';
    } else if (state.press) {
      title = `No default Premiere shortcut uses ${esc(q)}`;
      body = `Nothing in Adobe's default ${OS_NAME[state.os]} set matches that exact combination${filters ? ' with the current filters' : ''}. Try another, or switch platform.`;
    } else if (q) {
      title = `No shortcuts match “${esc(q)}”`;
      body = filters
        ? 'The active filters may be hiding results. Clear them, or try a different word.'
        : 'Try a simpler word, a task (“split”, “slow motion”), or type the keys (“ctrl k”, “⌘K”, “shift ;”).';
    } else {
      title = 'Nothing matches these filters';
      body = 'Loosen the tier, category or panel filters to see more.';
    }
    const suggestions = ['ripple delete', 'match frame', 'ctrl k', '⌘K', 'slip', 'nudge'];
    return `<section class="empty glass" aria-live="polite">
  <h2>${title}</h2><p>${body}</p>
  <div class="suggest">
    ${filters ? '<button type="button" class="chip" data-action="clear-filters">Clear filters</button>' : ''}
    ${suggestions.map((s) => `<button type="button" class="chip" data-suggest="${esc(s)}">${esc(s)}</button>`).join('')}
  </div>
</section>`;
  }

  let countTimer = 0;
  function updateCount(shown, mode) {
    const filtered = mode === 'search' || filtersActive();
    const text = filtered
      ? `<strong>${shown}</strong> of ${TOTAL} shortcuts`
      : `<strong>${TOTAL}</strong> shortcuts · ${OS_NAME[state.os]} keys`;
    // Debounce the live-region update so screen readers aren't flooded while typing.
    clearTimeout(countTimer);
    countTimer = setTimeout(() => { els.count.innerHTML = text; }, filtered ? 250 : 0);
  }

  /* ------------------------------------------------------------ chips */
  function chipHTML(kind, value, label, pressed, prefix = '', count = null) {
    const n = count === null ? '' : ` <span class="n">${count}</span>`;
    return `<button type="button" class="chip${kind === 'fav' ? ' fav' : ''}" data-kind="${kind}" data-value="${esc(value)}" aria-pressed="${pressed}">${prefix}${esc(label)}${n}</button>`;
  }

  function renderChips() {
    const tierCount = (t) => DATA.filter((e) => e.tier === t).length;
    els.chipsTier.innerHTML = [1, 2, 3, 4].map((t) =>
      chipHTML('tier', t, TIERS[t], state.tiers.has(t), `<span class="dot dot-${t}" aria-hidden="true"></span>`, tierCount(t))).join('')
      + chipHTML('fav', '1', 'My shortcuts', state.fav, '<span aria-hidden="true">★</span> ', state.favs.size);
    els.chipsCat.innerHTML = CAT_ORDER.map((c) => chipHTML('cat', c, c, state.cats.has(c))).join('');
    const ctxs = [...new Set(DATA.flatMap((e) => e.contexts))]
      .sort((a, b) => (CTX_ORDER.indexOf(a) + 1 || 99) - (CTX_ORDER.indexOf(b) + 1 || 99));
    els.chipsCtx.innerHTML = ctxs.map((c) => chipHTML('ctx', c, c, state.ctxs.has(c))).join('');
  }

  function toggleChip(kind, value) {
    if (kind === 'fav') state.fav = !state.fav;
    else {
      const set = kind === 'tier' ? state.tiers : kind === 'cat' ? state.cats : state.ctxs;
      const v = kind === 'tier' ? Number(value) : value;
      if (set.has(v)) set.delete(v); else set.add(v);
    }
    renderChips();
    render();
  }

  function clearFilters() {
    state.tiers.clear(); state.cats.clear(); state.ctxs.clear(); state.fav = false;
    renderChips();
    render();
  }

  /* ------------------------------------------------------------ OS + grouping toggles */
  function setOS(os) {
    state.os = os;
    store.set('psc-os', os);
    $$('.os-toggle button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.os === os)));
    if (state.press) stopListening(false);
    render();
  }

  function setGroup(g) {
    state.group = g;
    $$('[data-group]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.group === g)));
    render();
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
    (p.get('tier') || '').split(',').map(Number).filter((t) => TIERS[t]).forEach((t) => state.tiers.add(t));
    (p.get('cat') || '').split('|').filter((c) => CAT_RANK.has(c)).forEach((c) => state.cats.add(c));
    (p.get('ctx') || '').split('|').filter(Boolean).forEach((c) => state.ctxs.add(c));
    state.fav = p.get('fav') === '1';
    if (p.get('group') === 'category') state.group = 'category';
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
      prefix = `No ${OS_NAME[state.os]} default · `;
    }
    const ok = await copyText(text);
    toast(ok
      ? `<span class="tick" aria-hidden="true">✓</span> ${prefix}Copied <strong>${esc(text)}</strong> — ${esc(e.action)}`
      : `Couldn't copy. ${esc(e.action)}: ${esc(text)}`);
  }

  function toggleFav(id) {
    if (state.favs.has(id)) state.favs.delete(id); else state.favs.add(id);
    store.set('psc-favs', [...state.favs]);
    const on = state.favs.has(id);
    const e = byId.get(id);
    $$(`.star[data-star="${CSS.escape(id)}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', `${on ? 'Remove' : 'Save'} ${e.action} ${on ? 'from' : 'to'} My shortcuts`);
      b.title = `${on ? 'Remove from' : 'Save to'} My shortcuts`;
    });
    renderChips();
    if (state.fav) render();
    toast(on ? `<span aria-hidden="true">★</span> Saved to My shortcuts` : 'Removed from My shortcuts');
  }

  /* ------------------------------------------------------------ random hidden gem */
  const GEMS = entries.filter((e) => e.tier === 4);
  let lastGem = null;
  function showGem() {
    if (!GEMS.length) return;
    let g;
    do { g = GEMS[Math.floor(Math.random() * GEMS.length)]; } while (GEMS.length > 1 && g === lastGem);
    lastGem = g;
    const other = state.os === 'win' ? 'mac' : 'win';
    const otherText = comboText(g, other);
    els.gemBody.innerHTML = `
      <p class="gem-kicker"><span class="badge tier-4">✦ Hidden gem</span>${g.contexts.map((c) => `<span class="badge">${esc(c)}</span>`).join('')}</p>
      <h2 id="gem-title">${esc(g.action)}</h2>
      ${g.menuPath ? `<span class="row-path">${esc(g.menuPath)}</span>` : `<span class="row-path">${esc(g.category)}</span>`}
      <p class="gem-desc">${esc(g.description)}</p>
      <div class="gem-keys">${combosHTML(g, state.os, null)}</div>
      ${otherText ? `<p class="gem-other">${OS_NAME[other]}: ${esc(otherText)}</p>` : ''}
      ${g.note ? `<p class="gem-other row-note">${esc(g.note)}</p>` : ''}
      <p class="gem-src"><a href="${esc(g.source)}" target="_blank" rel="noopener">Adobe source ↗</a></p>`;
    if (!els.dialog.open) {
      if (typeof els.dialog.showModal === 'function') els.dialog.showModal(); else els.dialog.setAttribute('open', '');
    }
  }
  function closeGem() {
    if (typeof els.dialog.close === 'function') els.dialog.close(); else els.dialog.removeAttribute('open');
  }

  function revealEntry(e) {
    state.q = e.action;
    els.q.value = e.action;
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
  function labelFromEvent(ev) {
    const c = ev.code || '';
    if (/^Key[A-Z]$/.test(c)) return c.slice(3);
    if (/^(Digit|Numpad)\d$/.test(c)) return c.slice(-1);
    if (/^F\d{1,2}$/.test(c)) return c;
    if (c === 'Enter' || c === 'NumpadEnter') return state.os === 'mac' && c === 'Enter' ? 'Return' : 'Enter';
    if (c === 'Backspace') return state.os === 'mac' ? 'Delete' : 'Backspace';
    if (c === 'Delete') return state.os === 'mac' ? 'Forward Delete' : 'Delete';
    if (CODE_KEYS[c]) return CODE_KEYS[c];
    if (ev.key && ev.key.length === 1) return ev.key.toUpperCase();
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
  const comboDisplay = (keys) => keys.map((k) => (state.os === 'mac' && MAC_TEXT[k]) || k).join(' + ');
  const defaultPlaceholder = () => (matchMedia('(max-width: 420px)').matches
    ? 'Search, or type “ctrl k”'
    : 'Try “ripple delete”, “ctrl k” or “⌘K”');

  function startListening() {
    state.listening = true;
    state.press = null;
    els.press.setAttribute('aria-pressed', 'true');
    els.pressNote.hidden = false;
    els.searchBox.classList.add('listening');
    els.q.readOnly = true;
    els.q.value = '';
    els.q.placeholder = `Press a ${OS_NAME[state.os]} shortcut…`;
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
    const text = comboDisplay(keys);
    const canon = canonCombo(keys, state.os);
    // Use the most specific token so Backspace-type keys don't also match Forward Delete.
    const specific = { Delete: state.os === 'mac' ? 'backspace' : 'delete', 'Forward Delete': 'fwddel' };
    state.press = { text, kq: { mods: canon.mods, keys: [specific[key] || canon.keys[canon.keys.length - 1][0]] } };
    els.q.value = text;
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
    const t = ev.target;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (ev.key === '/' && !typing && !ev.ctrlKey && !ev.metaKey && !ev.altKey && !els.dialog.open) {
      ev.preventDefault();
      els.q.focus();
      els.q.select();
    } else if (ev.key === 'Escape' && t === els.q) {
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
  $('.filters').addEventListener('click', (ev) => {
    const chip = ev.target.closest('.chip[data-kind]');
    if (chip) toggleChip(chip.dataset.kind, chip.dataset.value);
  });
  els.clear.addEventListener('click', clearFilters);

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

  $('#gem-btn').addEventListener('click', showGem);
  $('#gem-another').addEventListener('click', showGem);
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
    $('#sources-summary').textContent = `Sources: ${sources.length} official Adobe help pages`;
    $('#sources-list').innerHTML = sources.map((u) => {
      const label = u.replace('https://helpx.adobe.com/premiere/desktop/', '').replace(/\.html$/, '').replace(/[-/]/g, (c) => (c === '/' ? ' › ' : ' '));
      return `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(label)}</a></li>`;
    }).join('');
    const t = [1, 2, 3, 4].map((n) => DATA.filter((e) => e.tier === n).length);
    $('#build-info').textContent = `${TOTAL} shortcuts (${t[0]} essential, ${t[1]} everyday, ${t[2]} pro, ${t[3]} hidden gems). Data built from Adobe's pages on ${META.generated || 'an unknown date'} by scripts/build_shortcuts.py.`;
    $('#lede').innerHTML = `<strong>${TOTAL}</strong> default shortcuts, sourced line by line from ${sources.length} official Adobe help pages. Search by name, by what it does, or just press the keys.`;
  }

  function init() {
    readURL();
    els.q.value = state.q;
    els.q.placeholder = defaultPlaceholder();
    $$('.os-toggle button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.os === state.os)));
    $$('[data-group]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.group === state.group)));
    renderChips();
    renderFooter();
    if (!TOTAL) {
      els.results.innerHTML = '<section class="empty glass"><h2>No data loaded</h2><p>data/shortcuts.js is missing. Run <code>python scripts/build_shortcuts.py</code>.</p></section>';
      return;
    }
    render();
    els.q.focus({ preventScroll: true });
  }

  init();
})();
