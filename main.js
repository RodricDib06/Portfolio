/* Rodric Dib — portfolio. Vanilla JS, no dependencies. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const EMAIL = 'rdib062@uottawa.ca';

  const LINKS = {
    github: 'https://github.com/RodricDib06',
    linkedin: 'https://linkedin.com/in/rodricdib',
    sdr: 'https://github.com/RodricDib06/autonomous-sdr',
    sdrLive: 'https://autonomoussdr-web.onrender.com',
    lob: 'https://github.com/RodricDib06/limit-order-book',
    a11y: 'https://github.com/anthony0246/LMS_TOOL',
    eams: 'https://github.com/uOttawaSEG/Event-Attendance-Management-System-EAMS-App',
  };

  const go = (sel) => {
    const el = $(sel);
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  const openUrl = (u) => window.open(u, '_blank', 'noopener');
  const downloadResume = () => {
    const a = document.createElement('a');
    a.href = 'assets/Rodric_Dib_Resume.pdf';
    a.download = 'Rodric_Dib_Resume.pdf';
    document.body.append(a);
    a.click();
    a.remove();
  };

  /* ───────────── toast + clipboard ───────────── */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      toast('Email copied: ' + EMAIL);
    } catch (e) {
      toast(EMAIL);
    }
  }
  $$('[data-copy]').forEach((b) => b.addEventListener('click', copyEmail));

  /* ───────────── theme ───────────── */
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('rd-theme', t); } catch (e) {}
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0a0b0d' : '#f3efe6');
  }
  const toggleTheme = () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  $('#themeBtn').addEventListener('click', toggleTheme);

  /* ───────────── scroll progress + active nav ───────────── */
  const bar = $('#progressBar');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.nav-links a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => navIO.observe(s));
  }

  /* ───────────── ticker (duplicate once for a seamless loop) ───────────── */
  const track = $('#tickerTrack');
  if (track) track.innerHTML += track.innerHTML;

  /* ───────────── trilingual greeting ───────────── */
  const greet = $('#greet');
  const greetings = [
    { t: 'Hello,', lang: 'en', dir: 'ltr' },
    { t: 'Bonjour,', lang: 'fr', dir: 'ltr' },
    { t: 'مرحبا،', lang: 'ar', dir: 'rtl' },
  ];
  if (greet && !reduce) {
    let gi = 0;
    setInterval(() => {
      greet.classList.add('out');
      setTimeout(() => {
        gi = (gi + 1) % greetings.length;
        const g = greetings[gi];
        greet.textContent = g.t;
        greet.lang = g.lang;
        greet.dir = g.dir;
        greet.classList.remove('out');
      }, 360);
    }, 2800);
  }

  /* ───────────── reveal on scroll + count-up ───────────── */
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const fmt = el.dataset.format;
    const show = (v) => {
      if (fmt === 'comma') return Math.round(v).toLocaleString('en-US');
      if (fmt === 'dec') return v.toFixed(1);
      return String(Math.round(v));
    };
    if (reduce) { el.textContent = show(target); return; }
    const t0 = performance.now();
    const dur = 1300;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = show(target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        $$('[data-count]', e.target).forEach(countUp);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  // Run a callback the first time an element is on screen.
  function onFirstView(el, cb, threshold = 0.4) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(); return; }
    const o = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { o.disconnect(); cb(); }
    }, { threshold });
    o.observe(el);
  }

  /* ══════════════════════════════════════════════════════════
     LIVE ORDER BOOK
     A small JavaScript model of the C++ engine: price-time
     priority, integer-tick prices, pre-trade risk checks on the
     visitor's account, mark-to-market P&L and a kill switch.
     ══════════════════════════════════════════════════════════ */
  (function initLOB() {
    const el = $('#lob');
    if (!el) return;

    const N = 6;          // visible levels per side
    const STEP = 5;       // price grid, in cents (prices are integer ticks, never floats)
    const book = { bids: new Map(), asks: new Map(), index: new Map(), nextId: 1000, last: 10000, count: 0 };
    const acct = { pos: 0, cash: 0, avg: 0, maxQty: 500, maxPos: 600, maxLoss: 5000, blocked: false };
    let fair = 10000;
    let youSeq = 0;

    const ui = {
      asks: $('#lobAsks'), bids: $('#lobBids'), spread: $('#lobSpread'), mid: $('#lobMid'),
      last: $('#lobLast'), count: $('#lobCount'), tape: $('#lobTape'), console: $('#lobConsole'),
      pos: $('#acPos'), avg: $('#acAvg'), pnl: $('#acPnl'), status: $('#acStatus'), unblock: $('#lobUnblock'),
    };
    const px = (c) => (c / 100).toFixed(2);
    const money = (c) => (c < 0 ? '−$' : '$') + (Math.abs(c) / 100).toFixed(2);
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

    /* ── engine ── */
    const sideMap = (side) => (side === 'B' ? book.bids : book.asks);
    function best(side) {
      let b = null;
      for (const p of sideMap(side).keys()) if (b === null || (side === 'B' ? p > b : p < b)) b = p;
      return b;
    }
    function applyFill(side, qty, price) {
      const signed = side === 'B' ? qty : -qty;
      const next = acct.pos + signed;
      if (acct.pos === 0 || Math.sign(acct.pos) === Math.sign(signed)) {
        acct.avg = (Math.abs(acct.pos) * acct.avg + qty * price) / Math.abs(next);
      } else if (Math.abs(signed) > Math.abs(acct.pos)) {
        acct.avg = price;             // flipped through zero: new cost basis
      }
      if (next === 0) acct.avg = 0;
      acct.pos = next;
      acct.cash -= signed * price;
    }
    function match(side, limitPx, qty, owner) {
      const oppSide = side === 'B' ? 'S' : 'B';
      const opp = sideMap(oppSide);
      let filled = 0, notional = 0, lastPx = null;
      while (qty > 0) {
        const bp = best(oppSide);
        if (bp === null) break;
        if (limitPx !== null && (side === 'B' ? bp > limitPx : bp < limitPx)) break;
        const lvl = opp.get(bp);
        while (qty > 0 && lvl.q.length) {
          const resting = lvl.q[0];
          const f = Math.min(qty, resting.qty);
          resting.qty -= f; lvl.qty -= f; qty -= f;
          filled += f; notional += f * bp; lastPx = bp;   // trades execute at the resting price
          if (owner === 'you') applyFill(side, f, bp);
          if (resting.qty === 0) { lvl.q.shift(); book.index.delete(resting.id); }
        }
        if (!lvl.q.length) opp.delete(bp);
      }
      if (filled) {
        const prev = book.last;
        book.last = lastPx;
        onTrade({ side, qty: filled, price: lastPx, avg: notional / filled, owner, prev });
      }
      return { rem: qty, filled, avg: filled ? notional / filled : 0 };
    }
    function limit(side, price, qty, owner) {
      const id = book.nextId++;
      book.count++;
      const { rem } = match(side, price, qty, owner);
      if (rem > 0) {
        const m = sideMap(side);
        let lvl = m.get(price);
        if (!lvl) { lvl = { qty: 0, q: [] }; m.set(price, lvl); }
        const o = { id, side, price, qty: rem, owner };
        lvl.q.push(o); lvl.qty += rem;
        book.index.set(id, o);
      }
    }
    function market(side, qty, owner) {
      book.nextId++;
      book.count++;
      return match(side, null, qty, owner);
    }
    function cancel(id) {
      const o = book.index.get(id);
      if (!o) return;
      const m = sideMap(o.side);
      const lvl = m.get(o.price);
      const i = lvl.q.indexOf(o);
      if (i > -1) { lvl.q.splice(i, 1); lvl.qty -= o.qty; }
      if (!lvl.q.length) m.delete(o.price);
      book.index.delete(id);
      book.count++;
    }
    function levels(side) {
      const m = sideMap(side);
      return Array.from(m.keys())
        .sort((a, b) => (side === 'B' ? b - a : a - b))
        .slice(0, N)
        .map((p) => ({ price: p, qty: m.get(p).qty }));
    }

    /* ── simulated order flow ── */
    function passive(side) {
      const off = STEP * (1 + Math.floor(-Math.log(1 - Math.random()) * 2.4));
      limit(side, side === 'B' ? fair - off : fair + off, rnd(1, 20) * 10, 'mm');
    }
    function flow() {
      if (Math.random() < 0.09) fair += Math.random() < 0.5 ? -STEP : STEP;
      fair = Math.max(9000, Math.min(11000, fair));
      const side = Math.random() < 0.5 ? 'B' : 'S';
      const r = Math.random();
      if (r < 0.58) {
        if (Math.random() < 0.14) limit(side, side === 'B' ? fair + STEP : fair - STEP, rnd(1, 12) * 10, 'mm');
        else passive(side);
      } else if (r < 0.72) {
        market(side, rnd(2, 12) * 10, 'mm');
      } else if (book.index.size > 30) {
        const ids = Array.from(book.index.keys());
        cancel(ids[rnd(0, ids.length - 1)]);
      } else {
        passive(side);
      }
      // keep both sides quoted and drop levels far from the market
      if (book.bids.size < 5) passive('B');
      if (book.asks.size < 5) passive('S');
      for (const [p, lvl] of book.bids) if (p < fair - STEP * 28) { lvl.q.forEach((o) => book.index.delete(o.id)); book.bids.delete(p); }
      for (const [p, lvl] of book.asks) if (p > fair + STEP * 28) { lvl.q.forEach((o) => book.index.delete(o.id)); book.asks.delete(p); }
    }

    /* ── rendering ── */
    function mkRows(ol) {
      const rows = [];
      for (let i = 0; i < N; i++) {
        const li = document.createElement('li');
        li.innerHTML = '<span class="px">—</span><span class="sz"></span><span class="dp"><i></i></span>';
        ol.appendChild(li);
        rows.push({ li, px: li.children[0], sz: li.children[1], bar: li.children[2].firstChild, lastPx: null, lastQty: null });
      }
      return rows;
    }
    const askRows = mkRows(ui.asks);
    const bidRows = mkRows(ui.bids);

    function paint(row, lvl, max, color) {
      if (!lvl) {
        if (row.lastPx !== null) { row.px.textContent = '—'; row.sz.textContent = ''; row.bar.style.width = '0%'; row.lastPx = row.lastQty = null; }
        return;
      }
      if (row.lastPx !== lvl.price) row.px.textContent = px(lvl.price);
      if (row.lastQty !== lvl.qty || row.lastPx !== lvl.price) {
        row.sz.textContent = lvl.qty.toLocaleString('en-US');
        row.bar.style.width = Math.max(3, (lvl.qty / max) * 100).toFixed(1) + '%';
        if (row.lastPx === lvl.price && !reduce && row.li.animate) {
          row.li.animate([{ backgroundColor: color }, { backgroundColor: 'transparent' }], { duration: 420, easing: 'ease-out' });
        }
      }
      row.lastPx = lvl.price; row.lastQty = lvl.qty;
    }
    function render() {
      const A = levels('S'), B = levels('B');
      const max = Math.max(500, ...A.map((l) => l.qty), ...B.map((l) => l.qty));
      for (let i = 0; i < N; i++) {
        paint(askRows[N - 1 - i], A[i], max, 'rgba(255,111,67,.22)');
        paint(bidRows[i], B[i], max, 'rgba(113,137,255,.22)');
      }
      if (A[0] && B[0]) {
        ui.spread.textContent = 'spread ' + px(A[0].price - B[0].price);
        ui.mid.textContent = 'mid ' + ((A[0].price + B[0].price) / 200).toFixed(3);
      }
      ui.count.textContent = book.count.toLocaleString('en-US');

      const pnl = acct.cash + acct.pos * book.last;
      ui.pos.textContent = (acct.pos > 0 ? '+' : acct.pos < 0 ? '−' : '') + Math.abs(acct.pos).toLocaleString('en-US');
      ui.pos.className = acct.pos > 0 ? 'pos' : acct.pos < 0 ? 'neg' : '';
      ui.avg.textContent = acct.pos ? px(acct.avg) : '—';
      ui.pnl.textContent = money(pnl);
      ui.pnl.className = pnl > 0 ? 'pos' : pnl < 0 ? 'neg' : '';
    }

    const clock = () => new Date().toLocaleTimeString('en-GB').slice(0, 5);
    function onTrade(t) {
      ui.last.textContent = px(t.price);
      if (t.price !== t.prev) ui.last.className = t.price > t.prev ? 'up' : 'dn';
      const li = document.createElement('li');
      li.className = (t.side === 'B' ? 'b' : 's') + (t.owner === 'you' ? ' you' : '');
      const a = document.createElement('span');
      a.textContent = (t.side === 'B' ? 'BUY  ' : 'SELL ') + t.qty + ' @ ' + px(t.price);
      const b = document.createElement('span');
      b.textContent = t.owner === 'you' ? 'you' : clock();
      li.append(a, b);
      ui.tape.prepend(li);
      while (ui.tape.children.length > 6) ui.tape.lastChild.remove();
    }

    /* ── visitor account: risk checks, P&L, kill switch ── */
    const lines = [];
    function log(html) {
      lines.push(html);
      while (lines.length > 3) lines.shift();
      ui.console.innerHTML = lines.join('\n');
    }
    function checkKill() {
      if (acct.blocked) return;
      const pnl = acct.cash + acct.pos * book.last;
      if (pnl < -acct.maxLoss) {
        acct.blocked = true;
        ui.status.textContent = 'BLOCKED';
        ui.status.className = 'bad';
        ui.unblock.hidden = false;
        log('<span class="c-kil">KILLED</span>   <span class="c-rej">[you] max loss breached, account blocked</span>');
      }
    }
    function userOrder(side, qty) {
      const n = ++youSeq;
      const verb = side === 'B' ? 'BUY' : 'SELL';
      const rej = (why) => log(`<span class="c-rej">REJECTED #${n} [you]: risk: ${why}</span>`);
      if (acct.blocked) return rej('account is blocked (kill switch)');
      if (qty > acct.maxQty) return rej('order quantity above limit');
      if (Math.abs(acct.pos + (side === 'B' ? qty : -qty)) > acct.maxPos) return rej('position limit would be exceeded');
      log(`<span class="c-acc">ACCEPTED</span> #${n} [you] ${verb} ${qty.toLocaleString('en-US')} @ MARKET`);
      const r = market(side, qty, 'you');
      if (r.filled) log(`<span class="c-trd">TRADE    ${verb.toLowerCase()} #${n}  ${r.filled} @ ${px(Math.round(r.avg))}</span>`);
      if (r.rem) log(`<span class="c-dim">DROPPED  #${n} ${r.rem} unfilled</span>`);
      checkKill();
      render();
    }
    $$('.lob-btn[data-order]', el).forEach((b) => {
      b.addEventListener('click', () => userOrder(b.dataset.order, parseInt(b.dataset.qty, 10)));
    });
    ui.unblock.addEventListener('click', () => {
      const pnl = acct.cash + acct.pos * book.last;
      acct.maxLoss = Math.max(acct.maxLoss + 5000, Math.ceil((-pnl + 2500) / 2500) * 2500);
      acct.blocked = false;
      ui.status.textContent = 'ACTIVE';
      ui.status.className = 'ok';
      ui.unblock.hidden = true;
      log(`<span class="c-acc">UNBLOCKED</span> [you] loss limit raised to ${money(acct.maxLoss)}`);
    });

    /* ── run loop: only while visible ── */
    for (let i = 0; i < 90; i++) passive(i % 2 ? 'B' : 'S');
    book.count = 0;
    log('<span class="c-dim">Your limits: 500 per order · ±600 position · $50 max loss.\nSend an order: it passes the same checks as the real engine.</span>');
    render();

    let timer = null, visible = false;
    const tick = () => { flow(); if (Math.random() < 0.55) flow(); checkKill(); render(); };
    const sync = () => {
      const should = visible && !document.hidden;
      if (should && !timer) timer = setInterval(tick, reduce ? 900 : 120);
      else if (!should && timer) { clearInterval(timer); timer = null; }
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe(el);
    } else { visible = true; sync(); }
    document.addEventListener('visibilitychange', sync);
  })();

  /* ══════════════════════════════════════════════════════════
     AUTONOMOUS SDR — pipeline run (illustrative sample data)
     ══════════════════════════════════════════════════════════ */
  let runPipe = () => {};
  (function initPipe() {
    const panel = $('#pipe');
    if (!panel) return;
    const btn = $('#pipeRun'), logEl = $('#pipeLog');
    const ins = $$('#pipeIn li'), nodes = $$('#pipeNodes li'), outs = $$('#pipeOut li');
    const sleep = (ms) => new Promise((r) => setTimeout(r, reduce ? Math.min(ms, 80) : ms));

    const leads = [
      {
        ch: 0, channel: 'website_form', who: 'Maya Chen, VP Operations @ Northwind Freight', verdict: 'hot', score: 87,
        t: { orchestrate: [38, 'dedup ok · priority high'], enrich: [212, 'firmographics + funding signals'], research: [1840, 'ReAct · 3 iterations · 5 sources'], score_intent: [64, 'intent 0.84'], analyse: [1120, 'BANT 0.9 / 0.8 / 0.9 / 0.8'], validate: [730, 'judge agrees'] },
        after: ['<span class="h">verdict  HOT 87</span>  → booking agent · meeting link sent', '<span class="g">fact check</span>   3/3 claims traced to a source'],
      },
      {
        ch: 3, channel: 'linkedin_signal', who: 'Omar Haddad, Head of Sales @ Lumen Analytics', verdict: 'warm', score: 61,
        t: { orchestrate: [41, 'dedup ok · priority medium'], enrich: [198, 'firmographics + seniority'], research: [1610, 'ReAct · 3 iterations · 4 sources'], score_intent: [59, 'intent 0.58'], analyse: [1045, 'BANT 0.6 / 0.8 / 0.6 / 0.4'], validate: [690, 'judge agrees'] },
        after: ['<span class="w">verdict  WARM 61</span> → outreach agent · variant B drafted', '<span class="w">fact check</span>   2/3 claims traced · 1 flagged for review'],
      },
      {
        ch: 4, channel: 'event', who: 'Julie Tremblay, Marketing Coordinator @ Atelier Nord', verdict: 'cold', score: 27,
        t: { orchestrate: [36, 'dedup ok · priority low'], enrich: [184, 'firmographics only'], research: [1320, 'ReAct · 2 iterations · 2 sources'], score_intent: [57, 'intent 0.21'], analyse: [980, 'BANT 0.2 / 0.3 / 0.4 / 0.2'], validate: [655, 'judge agrees'] },
        after: ['<span class="k">verdict  COLD 27</span> → CRM sync · no outreach sent', '<span class="g">saved</span>        research kept for re-qualification'],
      },
    ];

    const lines = [];
    const put = (html) => {
      lines.push(html);
      while (lines.length > 10) lines.shift();
      logEl.innerHTML = lines.map((l) => `<span>${l}</span>`).join('');
    };

    let li = 0, running = false;
    runPipe = async function () {
      if (running) return;
      running = true;
      btn.disabled = true;
      btn.textContent = '● Running…';
      [...ins, ...nodes, ...outs].forEach((n) => n.classList.remove('on', 'run', 'done'));
      lines.length = 0;

      const L = leads[li++ % leads.length];
      ins[L.ch].classList.add('on');
      put(`<span class="k">ingest</span>       ← ${L.channel}`);
      put(`             <span class="v">${L.who}</span>`);
      await sleep(650);

      for (const n of nodes) {
        const [ms, note] = L.t[n.dataset.node];
        n.classList.add('run');
        await sleep(Math.min(950, 280 + ms * 0.4));
        n.classList.remove('run');
        n.classList.add('done');
        put(`<span class="k">${n.dataset.node.padEnd(13)}</span><span class="g">ok</span> ${String(ms).padStart(5)} ms  ${note}`);
      }
      await sleep(350);
      outs.find((o) => o.dataset.verdict === L.verdict).classList.add('on');
      for (const a of L.after) { put(a); await sleep(260); }

      running = false;
      btn.disabled = false;
      btn.textContent = '▶ Run another lead';
    };
    btn.addEventListener('click', runPipe);
    onFirstView(panel, runPipe, 0.55);
  })();

  /* ══════════════════════════════════════════════════════════
     LIMIT ORDER BOOK — benchmark bars + recorded terminal run
     ══════════════════════════════════════════════════════════ */
  onFirstView($('#bench'), () => $('#bench').classList.add('in'), 0.4);

  (function initTerm() {
    const out = $('#termOut'), btn = $('#termReplay');
    if (!out) return;
    // Output of data/risk_demo.csv, as recorded in the repository README.
    const script = [
      ['t-cmd', '$ ./build/orderbook data/risk_demo.csv'],
      ['t-acc', 'ACCEPTED #3 [alice] BUY 200 @ 101.00'],
      ['t-trd', 'TRADE    buy #3 / sell #2  200 @ 101.00'],
      ['t-rej', 'REJECTED #5 [alice]: risk: order quantity above limit'],
      ['t-rej', 'REJECTED #6 [alice]: risk: position limit would be exceeded'],
      ['t-rej', 'REJECTED #7 [alice]: risk: price outside allowed band'],
      ['t-acc', 'ACCEPTED #8 [alice] BUY 50 @ 100.00'],
      ['t-rst', 'RESTING  #8 50 @ 100.00'],
      ['t-rej', 'REJECTED #9 [alice]: risk: would trade with own order'],
      ['t-rej', 'REJECTED #11 [carol]: risk: credit limit would be exceeded'],
      ['t-acc', 'ACCEPTED #12 [bob] SELL 400 @ MARKET'],
      ['t-trd', 'TRADE    buy #8 / sell #12  50 @ 100.00'],
      ['t-trd', 'TRADE    buy #1 / sell #12  350 @ 99.00'],
      ['t-kil', 'KILLED   [alice] max loss breached, 1 order(s) cancelled, account blocked'],
      ['t-rej', 'REJECTED #13 [alice]: risk: account is blocked (kill switch)'],
    ];
    let run = 0;
    function play() {
      const mine = ++run;
      out.textContent = '';
      btn.disabled = true;
      let i = 0;
      const next = () => {
        if (mine !== run) return;
        if (i >= script.length) { btn.disabled = false; return; }
        const [cls, text] = script[i++];
        const s = document.createElement('span');
        s.className = cls;
        s.textContent = text;
        out.appendChild(s);
        setTimeout(next, reduce ? 0 : cls === 't-kil' ? 620 : i === 1 ? 520 : 190);
      };
      next();
    }
    btn.addEventListener('click', play);
    onFirstView(out, play, 0.5);
  })();

  /* ══════════════════════════════════════════════════════════
     SKILLS — where each one shipped
     ══════════════════════════════════════════════════════════ */
  (function initSkills() {
    const cats = $('#skillCats');
    if (!cats) return;
    const SRC = {
      sdr: ['AutonomousSDR', 'Project', '#p-sdr'],
      lob: ['Limit Order Book & Risk Engine', 'Project', '#p-lob'],
      a11y: ['Chatbot Accessibility Tool', 'Project', '#p-a11y'],
      hms: ['CAR-HMS', 'Project', '#p-hms'],
      eams: ['Event Attendance App', 'Project', '#p-eams'],
      arch: ['Earlier builds', 'Projects', '#archive'],
      gac: ['Global Affairs Canada', 'Co-op', '#experience'],
      hoist: ['Hoist Tech', 'Co-op', '#experience'],
      usj: ['Saint Joseph University of Beirut', 'Internship', '#experience'],
      site: ['This portfolio', 'Site', '#top'],
    };
    const MAP = {
      'TypeScript': ['sdr', 'hms', 'gac'],
      'JavaScript': ['a11y', 'gac', 'hoist', 'arch', 'site'],
      'Python': ['sdr', 'a11y', 'arch'],
      'Java': ['eams'],
      'Kotlin': ['hms'],
      'C++': ['lob'],
      'C#': ['gac'],
      'SQL': ['hoist', 'gac', 'sdr'],
      'HTML/CSS': ['site', 'a11y', 'gac', 'arch'],
      'React': ['sdr', 'arch'],
      'Angular': ['hms'],
      'Spring Boot': ['hms'],
      'FastAPI': ['sdr'],
      'Flask': ['a11y'],
      '.NET': ['gac'],
      'Android SDK': ['eams'],
      'LangGraph': ['sdr'],
      'PostgreSQL': ['sdr'],
      'SQL Server': ['gac'],
      'Redis': ['sdr'],
      'Firebase': ['eams'],
      'pgvector': ['sdr'],
      'Docker': ['sdr'],
      'Linux': ['lob'],
      'REST APIs': ['sdr', 'hms'],
      'OAuth2/JWT': ['sdr'],
      'Git': ['sdr', 'lob', 'a11y', 'hms', 'eams'],
      'GitHub Actions': ['lob', 'sdr'],
      'Azure DevOps': ['gac'],
      'CI/CD': ['sdr', 'lob'],
      'Gradle': ['hms', 'eams'],
      'CMake': ['lob'],
      'Agile/Scrum': ['gac'],
      'Playwright': ['gac'],
      'pytest': ['sdr'],
      'Vitest': ['sdr'],
      'GoogleTest': ['lob'],
      'LLM APIs (OpenAI)': ['a11y'],
      'AI Agents': ['sdr'],
      'Tailwind CSS': ['sdr'],
      'Vite': ['sdr'],
      'TanStack Query': ['sdr'],
      'Recharts': ['sdr', 'arch'],
      'Bootstrap': ['arch'],
      'SQLAlchemy': ['sdr'],
      'Alembic': ['sdr'],
      'Pydantic': ['sdr'],
      'Prometheus': ['sdr'],
      'ASan/UBSan': ['lob'],
      'SIEM/XDR': ['usj'],
      'Microsoft 365 Security': ['usj'],
      'Incident Response': ['usj'],
      'ITSM': ['usj'],
      'IFS Cloud ERP': ['hoist'],
      'RBAC': ['sdr', 'hms', 'eams'],
    };
    const NOTE = {
      'AI Coding Tools': 'Part of my daily workflow on every project here.',
    };
    const name = $('#inspName'), desc = $('#inspDesc'), list = $('#inspList');
    const buttons = $$('.skill', cats);
    const idle = { name: name.textContent, desc: desc.textContent };
    buttons.forEach((b) => b.setAttribute('aria-pressed', 'false'));

    function select(btn) {
      const skill = btn.textContent.trim();
      const was = btn.getAttribute('aria-pressed') === 'true';
      buttons.forEach((b) => { b.setAttribute('aria-pressed', 'false'); b.classList.remove('kin'); });
      list.textContent = '';
      if (was) {
        cats.classList.remove('has-pick');
        name.textContent = idle.name;
        desc.textContent = idle.desc;
        return;
      }
      btn.setAttribute('aria-pressed', 'true');
      cats.classList.add('has-pick');
      const srcs = MAP[skill] || [];
      name.textContent = skill;
      if (!srcs.length) {
        desc.textContent = NOTE[skill] || 'In my toolbox. Not tied to one of the projects featured on this page.';
        return;
      }
      desc.textContent = `Shipped in ${srcs.length} place${srcs.length > 1 ? 's' : ''}. Highlighted skills were used alongside it.`;
      srcs.forEach((k) => {
        const [label, kind, href] = SRC[k];
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = href;
        a.append(label);
        const s = document.createElement('small');
        s.textContent = kind;
        a.append(s);
        li.append(a);
        list.append(li);
      });
      // highlight the rest of the stack that shipped with it (same first source)
      const primary = srcs[0];
      buttons.forEach((b) => {
        if (b === btn) return;
        const other = MAP[b.textContent.trim()] || [];
        if (other.includes(primary)) b.classList.add('kin');
      });
    }
    cats.addEventListener('click', (e) => {
      const b = e.target.closest('.skill');
      if (b) select(b);
    });
  })();

  /* ───────────── archive hover preview ───────────── */
  (function initPreview() {
    const box = $('#ixPreview');
    if (!box || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const img = $('img', box);
    $$('.index li[data-img]').forEach((li) => {
      new Image().src = li.dataset.img; // warm the cache
      li.addEventListener('mouseenter', () => { img.src = li.dataset.img; box.classList.add('show'); });
      li.addEventListener('mouseleave', () => box.classList.remove('show'));
      li.addEventListener('mousemove', (e) => {
        const x = Math.min(e.clientX + 26, innerWidth - 320);
        const y = Math.min(Math.max(e.clientY - 100, 12), innerHeight - 210);
        box.style.transform = `translate(${x}px, ${y}px)`;
      });
    });
  })();

  /* ───────────── lightbox ───────────── */
  (function initLightbox() {
    const dlg = $('#lightbox');
    if (!dlg || !dlg.showModal) return;
    const img = $('#lightboxImg'), cap = $('#lightboxCap');
    $$('.shot').forEach((b) => b.addEventListener('click', () => {
      img.src = b.dataset.full;
      img.alt = $('img', b).alt;
      cap.textContent = b.dataset.caption;
      dlg.showModal();
    }));
    dlg.addEventListener('click', (e) => { if (e.target !== img) dlg.close(); });
  })();

  /* ───────────── command palette ───────────── */
  (function initPalette() {
    const dlg = $('#palette'), input = $('#paletteInput'), list = $('#paletteList'), openBtn = $('#paletteBtn');
    if (!dlg || !dlg.showModal) { if (openBtn) openBtn.hidden = true; return; }
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    const k = $('kbd', openBtn);
    if (k && !isMac) k.textContent = 'Ctrl K';

    const commands = [
      ['Go to Work', 'Section', () => go('#work')],
      ['Go to Experience', 'Section', () => go('#experience')],
      ['Go to Skills', 'Section', () => go('#skills')],
      ['Go to About', 'Section', () => go('#about')],
      ['Go to Contact', 'Section', () => go('#contact')],
      ['Trade on the live order book', 'Demo', () => go('#lob')],
      ['Run a lead through the AI pipeline', 'Demo', () => { go('#pipe'); setTimeout(runPipe, 600); }],
      ['Open AutonomousSDR on GitHub', 'Repo', () => openUrl(LINKS.sdr)],
      ['Open AutonomousSDR live demo', 'Live', () => openUrl(LINKS.sdrLive)],
      ['Open Limit Order Book on GitHub', 'Repo', () => openUrl(LINKS.lob)],
      ['Open Chatbot Accessibility Tool on GitHub', 'Repo', () => openUrl(LINKS.a11y)],
      ['Open Event Attendance App on GitHub', 'Repo', () => openUrl(LINKS.eams)],
      ['Open GitHub profile', 'Link', () => openUrl(LINKS.github)],
      ['Open LinkedIn', 'Link', () => openUrl(LINKS.linkedin)],
      ['Download résumé (PDF)', 'File', downloadResume],
      ['Copy email address', 'Action', copyEmail],
      ['Switch light / dark theme', 'Action', toggleTheme],
    ];
    let shown = commands, sel = 0;

    function draw() {
      list.textContent = '';
      if (!shown.length) {
        const li = document.createElement('li');
        li.className = 'empty';
        li.textContent = 'No matching command.';
        list.append(li);
        return;
      }
      shown.forEach(([label, hint], i) => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', i === sel ? 'true' : 'false');
        li.append(label);
        const s = document.createElement('small');
        s.textContent = hint;
        li.append(s);
        li.addEventListener('click', () => exec(i));
        li.addEventListener('mousemove', () => { if (sel !== i) { sel = i; mark(); } });
        list.append(li);
      });
    }
    function mark() {
      $$('li', list).forEach((li, i) => li.setAttribute('aria-selected', i === sel ? 'true' : 'false'));
      const cur = list.children[sel];
      if (cur) cur.scrollIntoView({ block: 'nearest' });
    }
    function exec(i) {
      const cmd = shown[i];
      if (!cmd) return;
      dlg.close();
      cmd[2]();
    }
    function open() {
      if (dlg.open) return;
      input.value = '';
      shown = commands; sel = 0;
      draw();
      dlg.showModal();
      input.focus();
    }
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      shown = q ? commands.filter(([l, h]) => (l + ' ' + h).toLowerCase().includes(q)) : commands;
      sel = 0;
      draw();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, shown.length); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(1, shown.length); mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); exec(sel); }
    });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    openBtn.addEventListener('click', open);
    addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dlg.open ? dlg.close() : open();
      }
    });
  })();
})();
