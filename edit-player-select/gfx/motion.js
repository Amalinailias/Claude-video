(function () {
  const D = window.DATA;
  const root = document.getElementById('root');
  const IC = n => `<span class="ic">${D.icons[n]}</span>`;
  const RAW = n => D.icons[n];
  const W = i => D.words[i].s, WE = i => D.words[i].e;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const P = (t, s, d) => clamp((t - s) / d);
  const lerp = (a, b, x) => a + (b - a) * x;
  const E = {
    outCubic: x => 1 - Math.pow(1 - x, 3),
    outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    outBack: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    inOut: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    inCubic: x => x * x * x,
  };
  const bell = x => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x));

  function add(html, parent = root) {
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    const el = d.firstElementChild;
    parent.appendChild(el);
    return el;
  }
  const $ = id => document.getElementById(id);
  function show(el, o) {
    if (el.dataset.d === undefined) el.dataset.d = el.style.display === 'none' ? '' : el.style.display;
    if (o <= 0.001) { el.style.display = 'none'; return false; }
    el.style.display = el.dataset.d;
    el.style.opacity = o.toFixed(4);
    return true;
  }
  // enter / exit: fade + rise + de-blur
  function ee(el, t, tin, tout, o = {}) {
    const { din = 0.5, dout = 0.32, dy = 36, sc = 0.04, blur = 10, base = '', xout = 0 } = o;
    const a = E.outExpo(P(t, tin, din)), b = E.inCubic(P(t, tout, dout));
    const op = a * (1 - b);
    if (!show(el, op)) return 0;
    el.style.transform = `${base} translate(${xout * b}px, ${(1 - a) * dy - b * 24}px) scale(${1 - sc + sc * a - b * 0.03})`;
    const bl = (1 - a) * blur + b * 8;
    el.style.filter = bl > 0.05 ? `blur(${bl.toFixed(2)}px)` : 'none';
    return op;
  }
  // springy pop
  function pop(el, t, tin, o = {}) {
    const { d = 0.45, from = 0.55, tout = 1e9, dout = 0.25, base = '', rot = 0 } = o;
    const a = P(t, tin, d), b = E.inCubic(P(t, tout, dout));
    const s = from + (1 - from) * E.outBack(a);
    const op = clamp(a * 3.5) * (1 - b);
    if (!show(el, op)) return 0;
    el.style.transform = `${base} scale(${(s * (1 - 0.08 * b)).toFixed(4)}) rotate(${(rot * (1 - E.outCubic(a))).toFixed(2)}deg)`;
    return op;
  }
  const fmt = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // =====================================================================
  // HOOK — PLAYER SELECT: cut-out with glow outline over a navy HUD, stat card fills as she speaks
  // =====================================================================
  const HOOK = D.hook;
  const PS_END = D.psEnd;
  const BAR = (n, on, red) => `<div class="bar${red ? ' red' : ''}">${Array.from({ length: n }, (_, i) => `<i data-k="${i}"></i>`).join('')}</div>`;
  // background (rendered only in the 'behind' pass; the compositor puts her cut-out on top)
  add(`<div id="psbg" class="behindonly"><div class="grid"></div><div class="glowbar"></div><div class="scan"></div></div>`);
  add(`<div id="ps">
    <div id="pstitle">PLAYER SELECT</div>
    <div class="stat" id="stat">
      <div class="ttl" id="stt">KLIEN BIASA</div>
      <div class="box">
        <div class="srow" id="r1"><span class="nm">BUSY KERJA</span>${BAR(10)}</div>
        <div class="srow" id="r2"><span class="nm">PANIK</span>${BAR(10, 0, 1)}</div>
        <div class="srow" id="r3"><span class="nm">TAHU PROSES</span>${BAR(10)}</div>
      </div>
    </div>
    <div class="dash" id="dq" style="left:60px;top:1360px;width:620px"><span id="dqt"></span></div>
    <div class="dash" id="bf" style="right:50px;top:1120px;text-align:left">BEST<br>FRIEND:<br><span style="color:#6FD6FF">EJEN ANDA</span></div>
  </div>`);
  const DQ = 'MASUK HOSPITAL? TAK TAHU NAK BUAT APA.';
  function setBar(row, n, t, t0, dur, flicker) {
    const bars = $(row).querySelectorAll('i');
    const k = Math.round(n * E.outCubic(P(t, t0, dur)));
    bars.forEach((b, i) => b.classList.toggle('on', i < k && !(flicker && i === k - 1 && Math.floor(t * 6) % 2)));
  }
  function renderHook(t) {
    const ps = $('ps'), bg = $('psbg');
    const on = t < PS_END + 0.02;
    bg.style.display = on ? '' : 'none';
    if (!on) { ps.style.display = 'none'; return; }
    ps.style.display = '';
    ee($('pstitle'), t, 0.05, PS_END - 0.3, { dy: -14, blur: 6, din: 0.3 });
    $('pstitle').style.opacity = (parseFloat($('pstitle').style.opacity || 1) * (Math.floor(t * 3) % 4 ? 1 : 0.55)).toFixed(3);
    ee($('stat'), t, 0.15, PS_END - 0.25, { dy: 30, blur: 10, din: 0.35, dout: 0.2 });
    // bars fill on the words: busy → panik → (tak) tahu
    setBar('r1', 10, t, W(4) - 0.05, 0.6);
    setBar('r2', 10, t, W(12) - 0.05, 0.5);
    setBar('r3', 1, t, W(14) - 0.05, 0.25, true);
    const shake = t > W(12) ? 6 * Math.exp(-(t - W(12)) * 6) * Math.sin((t - W(12)) * 70) : 0;
    $('r2').style.transform = `translateX(${shake.toFixed(1)}px)`;
    // typed quote at the bottom
    const dq = $('dq');
    if (ee(dq, t, W(8) - 0.1, PS_END - 0.25, { dy: 0, sc: 0, blur: 0, din: 0.15, dout: 0.2 })) {
      const n = Math.floor(DQ.length * P(t, W(8), W(18) + 0.2 - W(8)));
      $('dqt').innerHTML = DQ.slice(0, n) + (Math.floor(t * 4) % 2 ? '▌' : '&nbsp;');
    }
    // payoff: best friend
    pop($('bf'), t, W(16) - 0.05, { from: 1.4, rot: 6, d: 0.35, tout: PS_END - 0.22, dout: 0.18 });
  }

  // =====================================================================
  // CARDS — game HUD
  // =====================================================================
  add(`<div class="hud" id="c1">
    <div class="hl"><span class="ic">${RAW('gamepad-2')}</span>PERNAH DENGAR?</div>
    <div class="ht">“Busy… <em>panik</em>… tak tahu nak buat apa.”</div>
    <div class="row" style="margin-top:18px"><div class="btn8" id="c1b" style="border-color:#5BE3A0;color:#5BE3A0;font-size:44px">${IC('circle-check')}JANGAN RISAU</div></div>
  </div>`);

  add(`<div class="hud" id="c2">
    <div class="hl"><span class="ic">${RAW('hospital')}</span>MISI BARU</div>
    <div class="ht">3 tips <em>sebelum masuk hospital</em></div>
    <div class="row" style="margin-top:20px;gap:16px">
      ${[1, 2, 3].map(i => `<div class="btn8" id="m${i}" style="font-size:46px">0${i}</div>`).join('')}
    </div>
  </div>`);

  add(`<div id="full"><div class="scan"></div><div class="a" id="fa">LEVEL 01</div><div class="b" id="fb">TIP 01</div><div class="c" id="fc"></div></div>`);

  add(`<div class="hud" id="t1">
    <div class="hl"><span class="lvl">01</span><span class="ic">${RAW('file-search')}</span>SEMAK POLISI</div>
    <div class="ht">Semak polisi <em>bersama ejen</em></div>
    <div class="ck2" id="t1a"><span class="bx" id="t1ax">${RAW('check')}</span>Status bayaran</div>
    <div class="ck2" id="t1b"><span class="bx" id="t1bx">${RAW('check')}</span>Waiting period</div>
  </div>`);

  add(`<div class="hud" id="t2">
    <div class="hl"><span class="lvl">02</span><span class="ic">${RAW('phone-call')}</span>BAGITAHU EJEN</div>
    <div class="ht">Keadaan anda <em>kepada ejen</em></div>
    <div class="fld" id="f1"><span class="k">MASUK:</span><span class="opt" id="o1">${'EMERGENSI'}</span><span class="opt" id="o2">WARD BIASA</span></div>
    <div class="fld" id="f2"><span class="k">DOKTOR PAKAR:</span><span id="f2v" style="border-bottom:3px dashed #6FD6FF;min-width:200px">&nbsp;</span></div>
    <div class="fld" id="f3"><span class="k">HOSPITAL:</span><span id="f3v" style="border-bottom:3px dashed #6FD6FF;min-width:200px">&nbsp;</span></div>
    <div class="row" style="margin-top:18px"><div class="btn8" id="t2c" style="font-size:40px">${IC('handshake')}EJEN ↔ HOSPITAL</div></div>
  </div>`);

  add(`<div class="hud" id="t3">
    <div class="hl"><span class="lvl">03</span><span class="ic">${RAW('file-text')}</span>PERMOHONAN GL</div>
    <div class="ht" style="font-size:44px">Guarantee Letter <em>(GL)</em></div>
    <div style="display:flex;gap:10px;margin-top:20px;align-items:stretch">
      <div class="node" id="n1"><span class="ic">${RAW('stethoscope')}</span>Doktor pakar</div><div class="arr">›</div>
      <div class="node" id="n2"><span class="ic">${RAW('file-text')}</span>Laporan perubatan</div><div class="arr">›</div>
      <div class="node" id="n3"><span class="ic">${RAW('building-2')}</span>Syarikat insurans nilai</div><div class="arr">›</div>
      <div class="node" id="n4"><span class="ic">${RAW('badge-check')}</span>GL lulus</div>
    </div>
    <div id="tm" style="margin-top:18px">
      <div class="hl" style="color:#FFE9A8"><span class="ic">${RAW('timer')}</span>KEBIASAANNYA <span id="tmv" style="font-size:52px;margin-left:8px">2–3 JAM</span></div>
      <div class="load"><i id="ld" style="width:0%"></i></div>
    </div>
  </div>`);

  add(`<div class="hud" id="k1">
    <div class="hl" style="color:#FFE9A8"><span class="ic">${RAW('sparkles')}</span>PENTING</div>
    <div class="ht">Ejen yang:</div>
    <div class="ck2" id="k1a"><span class="bx" style="border-color:#FF5A6A;color:#FF5A6A">${RAW('x')}</span><span style="opacity:.8">Bukan hanya tahu jual polisi</span></div>
    <div class="ck2" id="k1b"><span class="bx on">${RAW('check')}</span>Bantu <em style="font-style:normal;color:#FFE9A8">ketika anda memerlukan</em></div>
  </div>`);

  add(`<div class="hud" id="s1" style="text-align:center">
    <div class="hl" style="justify-content:center"><span class="ic">${RAW('save')}</span>SAVE POINT</div>
    <div class="row" style="justify-content:center;gap:22px;margin-top:20px">
      <div class="btn8" id="sb1">${IC('share-2')}SHARE</div>
      <div class="btn8" id="sb2">${IC('bookmark')}SAVE</div>
    </div>
    <div class="vt" id="sv" style="font-size:44px;color:#5BE3A0;margin-top:18px">✓ GAME SAVED</div>
  </div>`);

  const T = {};
  T.ps = PS_END;
  T.c1 = [W(19) - 0.02, W(27) - 0.12];
  T.c2 = [W(27) - 0.04, W(39) - 0.35];
  T.f1 = [W(39) - 0.32, W(41) - 0.05];       // full-screen LEVEL 01 over 'Yang pertama' (hides the camera being moved)
  T.t1 = [W(41) - 0.15, W(52) - 0.1];
  T.t2 = [W(52) - 0.06, W(83) - 0.1];
  T.t3 = [W(83) - 0.06, W(114) - 0.12];
  T.f2 = [W(114) - 0.12, W(117) - 0.05];     // full-screen PENTING over 'Sebab itu penting' (hides her reaching for the camera)
  T.k1 = [W(117) - 0.15, W(133) - 0.1];
  T.s1 = [W(133) - 0.06, D.endStart + 1.4];
  T.end = D.endStart;

  function full(t) {
    const f = $('full');
    let on = null;
    if (t >= T.f1[0] && t < T.f1[1]) on = ['LEVEL 01', 'TIP 01', 'Semak polisi bersama ejen', T.f1];
    if (t >= T.f2[0] && t < T.f2[1]) on = ['BOSS TIP', 'PENTING!', 'Pilih ejen yang betul', T.f2];
    if (!on) { f.style.display = 'none'; return; }
    f.style.display = '';
    $('fa').textContent = on[0]; $('fb').textContent = on[1]; $('fc').textContent = on[2];
    const [a, b] = on[3];
    const inn = E.outExpo(P(t, a, 0.14)), out = E.inCubic(P(t, b - 0.14, 0.14));
    f.style.clipPath = `inset(${((1 - inn) * 50).toFixed(2)}% 0 ${((1 - inn) * 50).toFixed(2)}% 0)`;
    f.style.opacity = (1 - out).toFixed(3);
    $('fb').style.transform = `scale(${(1 + 0.06 * bell(P(t, a + 0.08, 0.3))).toFixed(4)})`;
  }

  function renderCards(t) {
    if (ee($('c1'), t, T.c1[0], T.c1[1])) pop($('c1b'), t, W(25) - 0.05, { from: 0.4 });
    if (ee($('c2'), t, T.c2[0], T.c2[1])) {
      [1, 2, 3].forEach(i => pop($('m' + i), t, W(29) + 0.12 * (i - 1), { from: 0.3 }));
      const pk = bell(P(t, W(38) - 0.1, 0.5));
      $('m1').style.boxShadow = `6px 6px 0 rgba(255,233,168,.35), 0 0 ${(26 * pk).toFixed(0)}px rgba(255,233,168,${(0.8 * pk).toFixed(2)})`;
    }
    full(t);
    if (ee($('t1'), t, T.t1[0], T.t1[1])) {
      ee($('t1a'), t, W(46) - 0.1, 1e9, { dy: 10 }); $('t1ax').classList.toggle('on', t > W(47));
      ee($('t1b'), t, W(50) - 0.1, 1e9, { dy: 10 }); $('t1bx').classList.toggle('on', t > W(51));
    }
    if (ee($('t2'), t, T.t2[0], T.t2[1])) {
      ee($('f1'), t, W(60) - 0.1, 1e9, { dy: 10 });
      $('o1').classList.toggle('on', t > W(64) && t < W(66) - 0.05);
      $('o2').classList.toggle('on', t > W(66) - 0.05);
      ee($('f2'), t, W(68) - 0.1, 1e9, { dy: 10 });
      const d1 = 'Dr. _____', d2 = 'Hospital _____';
      $('f2v').textContent = d1.slice(0, Math.floor(d1.length * P(t, W(69), 0.5))) || ' ';
      ee($('f3'), t, W(71) - 0.1, 1e9, { dy: 10 });
      $('f3v').textContent = d2.slice(0, Math.floor(d2.length * P(t, W(72), 0.5))) || ' ';
      pop($('t2c'), t, W(78) - 0.05, { from: 0.4 });
    }
    if (ee($('t3'), t, T.t3[0], T.t3[1])) {
      const nodes = [['n1', W(87)], ['n2', W(91)], ['n3', W(93)], ['n4', W(101)]];
      nodes.forEach(([id, ts], i) => {
        ee($(id), t, Math.min(ts, W(85) + 0.25 * i) - 0.05, 1e9, { dy: 14, blur: 6 });
        $(id).classList.toggle('on', t > ts - 0.05 && i < 3);
        $(id).classList.toggle('ok', i === 3 && t > ts - 0.05);
      });
      ee($('tm'), t, W(104) - 0.1, 1e9, { dy: 10 });
      $('ld').style.width = (100 * E.inOut(P(t, W(105), W(113) - W(105) + 0.2))).toFixed(1) + '%';
      $('tmv').style.textShadow = `0 0 ${(18 * bell(P(t, W(110), 0.8))).toFixed(0)}px rgba(255,233,168,.9)`;
    }
    full(t);
    if (ee($('k1'), t, T.k1[0], T.k1[1])) {
      ee($('k1a'), t, W(123) - 0.1, 1e9, { dy: 10 });
      const st = E.outExpo(P(t, W(126), 0.4));
      $('k1a').style.opacity = (parseFloat($('k1a').style.opacity) * (1 - 0.45 * st)).toFixed(3);
      pop($('k1b'), t, W(128) - 0.05, { from: 0.5 });
    }
    if (ee($('s1'), t, T.s1[0], T.s1[1] + 5)) {
      pop($('sb1'), t, W(133) - 0.02, { from: 0.4 });
      pop($('sb2'), t, W(135) - 0.02, { from: 0.4 });
      pop($('sv'), t, D.endStart - 0.1, { from: 0.5 });
    }
  }
  // ---------------------------------------------------------------- captions
  const cap = add(`<div id="cap"></div>`);
  let curChunk = -1, spans = [];
  function renderCaps(t) {
    if (t < HOOK - 0.02 || t >= D.endStart) { cap.style.display = 'none'; return; }
    let k = -1;
    for (let i = 0; i < D.chunks.length; i++) if (t >= D.chunks[i].s && t < D.chunks[i].e) { k = i; break; }
    if (k < 0) { cap.style.display = 'none'; return; }
    cap.style.display = '';
    const c = D.chunks[k];
    if (k !== curChunk) {
      cap.innerHTML = c.w.map(w => `<span class="w ${w.c}${w.t.startsWith('-') ? ' join' : ''}">${w.t}</span>`).join('');
      spans = [...cap.children];
      spans.forEach((s, i) => { if (s.classList.contains('join')) { s.style.marginLeft = '-0.13em'; if (spans[i - 1]) spans[i - 1].style.marginRight = '0'; } });
      curChunk = k;
    }
    const a = E.outExpo(P(t, c.s, 0.22));
    const b = P(t, c.e - 0.08, 0.08);
    cap.style.opacity = (a * (1 - b)).toFixed(3);
    cap.style.transform = `translateY(${((1 - a) * 18).toFixed(2)}px)`;
    c.w.forEach((w, i) => {
      const s = spans[i];
      const on = t >= w.s - 0.03;
      s.classList.toggle('on', on);
      s.style.opacity = on ? '1' : '0.72';
      const pk = bell(P(t, w.s - 0.03, 0.28));
      s.style.transform = `scale(${(1 + 0.09 * pk).toFixed(4)}) translateY(${(-6 * pk).toFixed(2)}px)`;
    });
  }

  // =====================================================================
  // SFX cue sheet (time, name, gain dB) — 8-bit game sounds + whooshes
  // =====================================================================
  const C = [];
  const q = (tm, name, g) => C.push([+tm.toFixed(3), name, g + 2]);
  // hook: player select
  q(0.0, 'powerup8', -16); q(0.05, 'bass_hit', -15); q(0.15, 'select8', -17);
  for (let k = 0; k < 10; k++) q(W(4) - 0.05 + 0.06 * k, 'move8', -26);
  for (let k = 0; k < 10; k++) q(W(12) - 0.05 + 0.05 * k, 'move8', -25);
  q(W(12), 'error8', -19);
  q(W(14) - 0.05, 'error8', -21);
  for (let k = 0; k < 14; k++) q(W(8) + k * (W(18) + 0.2 - W(8)) / 14, 'type8', -27);
  q(W(16) - 0.05, 'coin8', -15); q(W(16), 'impact_soft', -19);
  q(PS_END - 0.08, 'glitch', -15); q(PS_END - 0.05, 'whoosh_down', -18);
  // body
  q(T.c1[0], 'select8', -19); q(W(25) - 0.05, 'coin8', -17);
  q(T.c2[0], 'select8', -19); [0, 1, 2].forEach(i => q(W(29) + 0.12 * i, 'move8', -19)); q(W(38) - 0.1, 'riser_short', -22);
  q(T.f1[0], 'levelup8', -15); q(T.f1[0], 'whoosh', -19); q(T.f1[1] - 0.12, 'whoosh_down', -20);
  q(T.t1[0], 'select8', -20); q(W(47), 'coin8', -18); q(W(51), 'coin8', -18);
  q(T.t2[0], 'levelup8', -19); q(W(64), 'move8', -18); q(W(66) - 0.05, 'move8', -18);
  for (let k = 0; k < 6; k++) q(W(69) + k * 0.08, 'type8', -25);
  for (let k = 0; k < 6; k++) q(W(72) + k * 0.08, 'type8', -25);
  q(W(78) - 0.05, 'select8', -18);
  q(T.t3[0], 'levelup8', -19); q(W(87), 'move8', -19); q(W(91), 'move8', -19); q(W(93), 'move8', -19); q(W(101), 'powerup8', -18); q(W(101) + 0.3, 'coin8', -16);
  q(W(105), 'tick', -21); q(W(113), 'ding', -17);
  q(T.f2[0], 'levelup8', -15); q(T.f2[0], 'whoosh', -19); q(T.f2[1] - 0.12, 'whoosh_down', -20);
  q(W(123) - 0.1, 'error8', -21); q(W(128) - 0.05, 'coin8', -16); q(W(128), 'shimmer', -21);
  q(T.s1[0], 'select8', -18); q(W(133), 'move8', -18); q(W(135), 'move8', -18); q(D.endStart - 0.1, 'save8', -14);
  window.CUES = C;
  window.TIMES = T;

  window.renderAt = function (t) {
    renderHook(t);
    renderCards(t);
    renderCaps(t);
    // no captions over the player-select hook (its own typed text) or the full-screen level cards
    const hideCap = t < PS_END + 0.05 || (t >= T.f1[0] && t < T.f1[1]) || (t >= T.f2[0] && t < T.f2[1]);
    if (hideCap) $('cap').style.display = 'none';
  };
  window.READY = document.fonts.ready.then(() => true);
})();
