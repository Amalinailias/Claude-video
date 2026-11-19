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
  // HOOK
  // =====================================================================
  const HOOK = D.hook;
  add(`<div id="hook">
    <div id="hookbg"></div><div id="hookshade"></div><div id="hookgrid"></div>
    <div class="hairline" id="hl1" style="top:660px;left:190px;width:700px"></div>
    <div class="kick abs" id="hk1" style="left:0;right:0;top:612px;text-align:center">Malaysia · 2024</div>
    <div id="bignum">0</div>
    <div id="numsub">kes perceraian setahun</div>
    <div id="pill"><div class="clock"><i id="hand1" style="height:21px"></i><i id="hand2" style="height:14px"></i></div><span>≈ <b>1 kes</b> setiap <b>9 minit</b></span></div>
    <div id="src">Sumber: Jabatan Perangkaan Malaysia (DOSM), 2025</div>
    <div id="love"><span>Cinta</span> <span>boleh</span> <span>putus.</span></div>
    <div id="loan1">Tapi loan bersama?</div>
    <div id="loan2">Tetap jalan.</div>
    <div id="chainic">${RAW('link')}</div>
    <div id="flash" class="abs" style="inset:0;background:radial-gradient(60% 40% at 50% 45%,rgba(255,230,180,.9),rgba(255,200,120,0) 70%)"></div>
    <div id="black" class="abs" style="inset:0;background:#000"></div>
  </div>`);
  const loveSpans = [...$('love').children];

  function renderHook(t) {
    const hook = $('hook');
    if (t >= HOOK + 0.02) { hook.style.display = 'none'; return; }
    hook.style.display = '';
    // background focus-pull
    const reveal = E.inOut(P(t, HOOK - 0.55, 0.55));
    const sc = lerp(1.14, 1.0, E.inOut(P(t, 0, HOOK)));
    const bl = 30 * (1 - reveal);
    $('hookbg').style.transform = `scale(${sc.toFixed(4)})`;
    $('hookbg').style.filter = `blur(${bl.toFixed(2)}px) brightness(${lerp(0.95, 1, reveal).toFixed(3)}) saturate(${lerp(1.15, 1, reveal).toFixed(3)})`;
    $('hookshade').style.opacity = (1 - reveal).toFixed(3);
    $('hookbg').style.opacity = (1 - reveal).toFixed(3);
    $('hookgrid').style.opacity = (0.9 * (1 - reveal) * P(t, 0.05, 0.6)).toFixed(3);
    $('black').style.opacity = (1 - E.outCubic(P(t, 0, 0.35))).toFixed(3);
    $('flash').style.opacity = (0.55 * bell(P(t, HOOK - 0.32, 0.45))).toFixed(3);

    // group A — statistic
    const tA = 2.3;
    ee($('hk1'), t, 0.12, tA, { dy: 20 });
    const hl = $('hl1');
    if (show(hl, 1 - P(t, tA, 0.3))) hl.style.transform = `scaleX(${E.outExpo(P(t, 0.1, 0.9)).toFixed(4)})`;
    const nk = E.outExpo(P(t, 0.18, 1.0));
    $('bignum').textContent = fmt(Math.round(60457 * nk));
    const bump = 1 + 0.06 * bell(P(t, 1.12, 0.32));
    ee($('bignum'), t, 0.12, tA, { dy: 40, sc: 0.1, blur: 16, din: 0.4 });
    if (t > 0.12 && t < tA + 0.35) $('bignum').style.transform += ` scale(${bump.toFixed(4)})`;
    ee($('numsub'), t, 1.2, tA, { dy: 26, blur: 12 });
    ee($('pill'), t, 1.5, tA, { base: 'translateX(-50%)', dy: 30 });
    $('hand1').style.transform = `translateX(-50%) rotate(${(180 + (t - 1.5) * 540).toFixed(1)}deg)`;
    $('hand2').style.transform = `translateX(-50%) rotate(${(180 + (t - 1.5) * 45 + 90).toFixed(1)}deg)`;
    ee($('src'), t, 0.4, tA, { dy: 10, blur: 4 });

    // group B — the line
    const tB = HOOK - 0.42;
    loveSpans.forEach((s, i) => ee(s, t, 2.42 + i * 0.16, tB, { dy: 22, blur: 16, din: 0.6 }));
    ee($('loan1'), t, 3.0, tB, { dy: 30, blur: 12 });
    ee($('loan2'), t, 3.32, tB, { dy: 30, blur: 12 });
    pop($('chainic'), t, 3.06, { from: 0.3, tout: tB, rot: -25 });
  }

  // =====================================================================
  // CARDS
  // =====================================================================
  add(`<div class="abs" id="c0wrap" style="left:0;right:0;top:214px;display:flex;justify-content:center">
    <div class="chip" id="c0" style="font-size:38px;padding:18px 32px 18px 24px">${IC('coffee')}<span>Coffee Talk&nbsp;<span class="serif" style="font-weight:400;color:var(--gold);font-size:46px">· kewangan</span></span></div></div>`);


  add(`<div class="card" id="c2">
    <div class="kicker"><span class="dot"></span>Fokus hari ini</div>
    <div style="font:italic 400 108px/1.05 'ISerif';margin-top:26px"><span class="wd" id="c2w1">Selepas</span> <span class="wd" id="c2w2">perceraian…</span></div>
    <div id="c2line" style="height:4px;margin-top:20px;background:linear-gradient(90deg,var(--gold),rgba(246,198,103,0));transform-origin:0 50%"></div>
  </div>`);

  add(`<div class="card" id="c3">
    <div class="kicker"><span class="dot red"></span>Yang selalu berlaku</div>
    <div class="row" style="margin-top:28px;gap:16px">
      <div class="chip" id="c3a">${IC('message-circle-x')}Perselisihan faham</div>
      <div class="chip" id="c3b">${IC('zap')}Gaduh</div>
    </div>
    <div id="c3arrow" style="margin:16px 0 0 34px;width:56px;height:56px;color:var(--coral)">${RAW('arrow-down')}</div>
    <div class="row" style="margin-top:12px"><div class="chip coral" id="c3d" style="font-size:42px;padding:22px 36px 22px 26px">${IC('baby')}Anak-anak terabai</div></div>
  </div>`);

  add(`<div class="card" id="c4">
    <div class="kicker"><span class="dot"></span>Hari ini saya share</div>
    <div style="display:flex;align-items:center;gap:26px;margin-top:4px">
      <div class="numeral" id="c4n" style="font-size:236px;line-height:1.02;padding-right:6px">3</div>
      <div id="c4r"><div style="font:800 80px/1 'PJS';letter-spacing:.05em">LANGKAH</div><div class="sub" style="margin-top:14px;font-size:31px">jaga kewangan selepas berpisah</div></div>
    </div>
    <div class="row" style="margin-top:8px">
      <div class="chip" id="c4a">${IC('user-check')}Jaga diri</div>
      <div class="chip" id="c4b">${IC('trending-up')}Jaga masa depan</div>
    </div>
  </div>`);

  add(`<div class="card" id="c5">
    <div class="stephead"><div class="numeral" id="c5n">01</div><div><div class="k">Langkah 1</div><div class="t" id="c5t">Elak joint loan</div></div></div>
    <div class="sep"></div>
    <div class="body">
      <div class="state" id="s1a" style="display:flex;align-items:flex-start;justify-content:space-between;padding:0 34px">
        <div id="s1n1"><div class="node">${IC('users')}</div><div class="nlabel">Anda berdua</div></div>
        <div style="position:relative;width:330px;height:150px">
          <svg width="330" height="150" viewBox="0 0 330 150" style="position:absolute;inset:0;overflow:visible">
            <line id="s1line" x1="10" y1="75" x2="320" y2="75" stroke="#F6C667" stroke-width="5" stroke-linecap="round" stroke-dasharray="310" stroke-dashoffset="310"/>
          </svg>
          <div id="s1link" style="position:absolute;left:115px;top:25px;width:100px;height:100px;border-radius:50%;background:#1a1f33;border:3px solid var(--gold);display:flex;align-items:center;justify-content:center;color:var(--gold)"><div style="width:54px;height:54px">${RAW('link')}</div></div>
          <div id="s1lab" class="nlabel" style="position:absolute;left:0;right:0;top:150px;color:var(--gold)">diikat bersama</div>
        </div>
        <div id="s1n2"><div class="node gold">${IC('landmark')}</div><div class="nlabel">Bank</div></div>
      </div>
      <div class="state" id="s1b" style="display:flex;flex-direction:column;justify-content:center;gap:24px">
        <div class="row"><div class="chip" id="s1b1">${IC('thumbs-up')}Baik</div><div class="chip" id="s1b2">${IC('thumbs-down')}Buruk</div>
          <div id="s1barr" style="width:54px;height:54px;color:var(--gold)">${RAW('arrow-down')}</div></div>
        <div class="row"><div class="chip gold" id="s1b3" style="font-size:38px">${IC('link')}Tetap kena bayar bersama</div></div>
      </div>
      <div class="state" id="s1c">
        <div class="kicker" id="s1ck" style="color:var(--muted);font-size:24px;gap:12px"><span class="ic" style="font-size:34px;color:var(--gold)">${RAW('circle-help')}</span>Sebelum loan bersama, tanya diri dulu</div>
        <div class="quote" style="margin-top:18px"><span class="wd" id="q1">Boleh ke buat business</span> <span class="wd" id="q2">dengan <span class="m wd" id="q2m">musuh</span></span> <span class="wd" id="q3">— tanpa emosi?</span></div>
      </div>
    </div>
    <div class="chip mint abs" id="s1d" style="right:40px;bottom:-34px;font-size:40px;background:#0f3b2b;padding:20px 32px 20px 24px">${IC('circle-check')}Kalau boleh, teruskan</div>
  </div>`);

  add(`<div class="card" id="c6">
    <div class="stephead"><div class="numeral">02</div><div><div class="k">Langkah 2</div><div class="t">Dua jenis simpanan</div></div></div>
    <div class="sep"></div>
    <div class="row" style="gap:24px;flex-wrap:nowrap;align-items:stretch">
      <div class="acct" id="a1"><div class="h">${IC('users')}Bersama</div><div class="bar"><i id="a1b"></i></div><div class="cap">Komitmen berdua</div></div>
      <div class="acct" id="a2"><div class="badge" id="a2badge">PENTING</div><div class="h">${IC('wallet')}Sendiri</div><div class="bar"><i id="a2b"></i></div><div class="cap">Dana peribadi anda</div></div>
    </div>
    <div class="row" style="margin-top:24px"><div class="chip" id="c6a">${IC('badge-check')}Belajar berdikari</div><div class="chip" id="c6b">${IC('heart')}Untuk diri sendiri</div></div>
  </div>`);

  add(`<div class="card" id="c7">
    <div class="stephead"><div class="numeral">03</div><div><div class="k">Langkah 3</div><div class="t" id="c7t">Kekalkan<br>perlindungan</div></div></div>
    <div class="shield" id="c7s">${RAW('shield-check')}</div>
    <div class="sep"></div>
    <div class="prow" id="p1"><div class="l">${IC('repeat')}Tukar penerima hibah?</div><div class="chip mint" id="p1c" style="padding:12px 24px 12px 18px">${IC('check')}Boleh</div></div>
    <div class="prow" id="p2" style="margin-bottom:0"><div class="l">${IC('baby')}+ Hibah anak-anak</div><div class="chip gold" id="p2c" style="padding:12px 24px 12px 18px">${IC('star')}Lagi bagus</div></div>
  </div>`);

  add(`<div class="card" id="c8">
    <div class="kicker"><span class="dot"></span>Nak tahu lebih lanjut?</div>
    <div style="display:flex;align-items:center;gap:28px;margin-top:28px">
      <div class="avatar" id="c8av">${IC('briefcase')}</div>
      <div><div style="font:800 44px/1.1 'PJS'" id="c8name">Naja’a Amalina binti Ilias</div><div class="sub" style="margin-top:8px;color:var(--gold)" id="c8role">Financial Advisor</div></div>
    </div>
    <div style="margin-top:34px;display:flex;align-items:center;gap:26px">
      <div class="btn" id="c8btn"><div class="ring" id="c8ring"></div>${IC('message-circle')}DM saya</div>
      <div id="c8arrow" style="width:66px;height:66px;color:var(--gold)">${RAW('chevrons-down')}</div>
    </div>
  </div>`);

  // ---------------------------------------------------------------- end card
  add(`<div id="endc"><div id="endshade"></div>
    <div class="endbox">
      <div class="kicker" id="ek" style="justify-content:center"><span class="dot"></span>Ringkasan</div>
      <div id="e1" style="text-align:center;font:800 70px/1.05 'PJS';margin-top:26px;letter-spacing:-.01em">3 Langkah Jaga Kewangan</div>
      <div id="e2" style="text-align:center;font:italic 400 68px/1 'ISerif';color:var(--gold);margin-top:14px">selepas berpisah</div>
      <div style="margin-top:56px">
        <div class="erow" id="er1"><div class="n">01</div><div class="x">Elak joint loan</div><div class="ck" id="ec1">${IC('check')}</div></div>
        <div class="erow" id="er2"><div class="n">02</div><div class="x">Simpanan bersama + sendiri</div><div class="ck" id="ec2">${IC('check')}</div></div>
        <div class="erow" id="er3"><div class="n">03</div><div class="x">Kekalkan perlindungan & hibah</div><div class="ck" id="ec3">${IC('check')}</div></div>
      </div>
      <div style="display:flex;justify-content:center;margin-top:44px"><div class="chip gold" id="e3" style="font-size:38px">${IC('bookmark')}Simpan & share video ni</div></div>
    </div></div>`);

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

  // ---------------------------------------------------------------- per-frame card logic
  const T = {};
  T.c0 = [W(0) + 0.08, W(36) - 0.2];
  T.c2 = [W(36) + 0.06, W(44) - 0.12];
  T.c3 = [W(44) + 0.02, W(59) - 0.12];
  T.c4 = [W(61) - 0.1, W(83) - 0.14];
  T.c5 = [W(83) - 0.04, W(138) - 0.14];
  T.c6 = [W(138) - 0.04, W(168) - 0.14];
  T.c7 = [W(168) + 0.0, W(207) - 0.14];
  T.c8 = [W(207) + 0.06, D.endStart - 0.05];
  T.end = D.endStart;

  function renderCards(t) {
    // c0
    pop($('c0'), t, T.c0[0], { tout: T.c0[1], from: 0.7 });
    // c2
    if (ee($('c2'), t, T.c2[0], T.c2[1])) {
      ee($('c2w1'), t, W(42) - 0.05, 1e9, { dy: 20, blur: 14, din: 0.55 });
      ee($('c2w2'), t, W(43) - 0.05, 1e9, { dy: 20, blur: 14, din: 0.55 });
      $('c2line').style.transform = `scaleX(${E.outExpo(P(t, W(43) + 0.15, 0.9)).toFixed(4)})`;
    }
    // c3
    if (ee($('c3'), t, T.c3[0], T.c3[1])) {
      pop($('c3a'), t, W(48) - 0.02);
      pop($('c3b'), t, W(50) - 0.02);
      const ar = $('c3arrow');
      if (show(ar, P(t, W(55), 0.2))) ar.style.transform = `translateY(${(-16 * (1 - E.outCubic(P(t, W(55), 0.4))) + 6 * Math.sin(t * 8)).toFixed(2)}px)`;
      pop($('c3d'), t, W(56) - 0.02, { from: 0.4 });
      if (t > W(56)) { const sh = 6 * Math.exp(-(t - W(56)) * 7) * Math.sin((t - W(56)) * 70); $('c3d').style.transform += ` translateX(${sh.toFixed(2)}px)`; }
    }
    // c4
    if (ee($('c4'), t, T.c4[0], T.c4[1])) {
      const n = $('c4n');
      const a = P(t, W(65) - 0.06, 0.5);
      if (show(n, clamp(a * 4))) { n.style.transform = `scale(${lerp(1.9, 1, E.outBack(a)).toFixed(4)})`; n.style.filter = `blur(${(10 * (1 - E.outCubic(a))).toFixed(2)}px)`; }
      ee($('c4r'), t, W(66) - 0.05, 1e9, { dy: 0, blur: 10, din: 0.5, base: '' , sc: 0});
      if (t >= W(66) - 0.05) $('c4r').style.transform = `translateX(${(-30 * (1 - E.outExpo(P(t, W(66) - 0.05, 0.5)))).toFixed(2)}px)`;
      pop($('c4a'), t, W(73) - 0.03);
      pop($('c4b'), t, W(76) - 0.03);
    }
    // c5 step 1
    if (ee($('c5'), t, T.c5[0], T.c5[1])) {
      pop($('c5n'), t, T.c5[0] + 0.05, { from: 1.6, d: 0.5 });
      ee($('c5t'), t, W(84) - 0.05, 1e9, { dy: 14, blur: 8 });
      // state a
      if (ee($('s1a'), t, W(86) - 0.05, W(100) - 0.08, { dy: 16 })) {
        pop($('s1n1'), t, W(86) - 0.05);
        pop($('s1n2'), t, W(87));
        const dr = E.inOut(P(t, W(97) - 0.1, 0.6));
        $('s1line').setAttribute('stroke-dashoffset', (310 * (1 - dr)).toFixed(1));
        pop($('s1link'), t, W(97) + 0.15, { rot: -40 });
        ee($('s1lab'), t, W(98), 1e9, { dy: 10, blur: 6 });
        const g = bell(P(t, W(99), 0.6));
        $('s1n2').firstElementChild.style.boxShadow = `0 0 ${(40 + 50 * g).toFixed(0)}px rgba(246,198,103,${(0.25 + 0.45 * g).toFixed(3)})`;
      }
      // state b
      if (ee($('s1b'), t, W(100) - 0.02, W(116) - 0.08, { dy: 16 })) {
        pop($('s1b1'), t, W(102) - 0.03);
        pop($('s1b2'), t, W(104) - 0.03);
        const ar = $('s1barr');
        if (show(ar, P(t, W(106), 0.2))) ar.style.transform = `translateY(${(4 * Math.sin(t * 8)).toFixed(2)}px)`;
        pop($('s1b3'), t, W(108) - 0.03, { from: 0.4 });
      }
      // state c
      if (ee($('s1c'), t, W(116) - 0.02, 1e9, { dy: 16 })) {
        ee($('q1'), t, W(122) - 0.05, 1e9, { dy: 16, blur: 12, din: 0.55 });
        ee($('q2'), t, W(127) - 0.05, 1e9, { dy: 16, blur: 12, din: 0.55 });
        ee($('q3'), t, W(130) - 0.05, 1e9, { dy: 16, blur: 12, din: 0.55 });
        // glitch on "musuh"
        const gk = P(t, W(128), 0.35);
        const m = $('q2m');
        if (gk > 0 && gk < 1) {
          const j = Math.sin(t * 173) * 6 * (1 - gk);
          m.style.transform = `translateX(${j.toFixed(2)}px) skewX(${(Math.sin(t * 91) * 8 * (1 - gk)).toFixed(2)}deg)`;
          m.style.textShadow = `${(-4 * (1 - gk)).toFixed(1)}px 0 rgba(0,220,255,.7), ${(4 * (1 - gk)).toFixed(1)}px 0 rgba(255,40,90,.7)`;
        } else { m.style.transform = ''; m.style.textShadow = 'none'; }
      }
      pop($('s1d'), t, W(135) - 0.05, { from: 1.5, rot: -8, d: 0.45 });
    }
    // c6 step 2
    if (ee($('c6'), t, T.c6[0], T.c6[1])) {
      pop($('a1'), t, W(139) - 0.05, { from: 0.8 });
      $('a1b').style.width = (65 * E.inOut(P(t, W(143) + 0.1, 0.9))).toFixed(2) + '%';
      pop($('a2'), t, W(150) - 0.05, { from: 0.8 });
      $('a2b').style.width = (88 * E.inOut(P(t, W(151) + 0.05, 1.0))).toFixed(2) + '%';
      pop($('a2badge'), t, W(152) + 0.15, { from: 1.6, rot: 8 });
      pop($('c6a'), t, W(156) - 0.03);
      pop($('c6b'), t, W(161) - 0.03);
    }
    // c7 step 3
    if (ee($('c7'), t, T.c7[0], T.c7[1])) {
      ee($('c7t'), t, W(172) - 0.05, 1e9, { dy: 14, blur: 8 });
      const sa = P(t, W(179) - 0.05, 0.6);
      const s = $('c7s');
      if (pop(s, t, W(179) - 0.05, { from: 0.3, rot: -20 })) {
        const g = 0.45 + 0.35 * bell(P(t, W(179) + 0.1, 0.8));
        s.style.filter = `drop-shadow(0 0 ${(22 + 30 * (g - 0.45)).toFixed(1)}px rgba(246,198,103,${g.toFixed(3)}))`;
      }
      ee($('p1'), t, W(186) - 0.05, 1e9, { dy: 18 });
      pop($('p1c'), t, W(196) - 0.03);
      ee($('p2'), t, W(199) - 0.05, 1e9, { dy: 18 });
      pop($('p2c'), t, W(205) - 0.03);
    }
    // c8 CTA
    if (ee($('c8'), t, T.c8[0], T.c8[1])) {
      pop($('c8av'), t, W(213) - 0.05);
      ee($('c8role'), t, W(213), 1e9, { dy: 10 });
      ee($('c8name'), t, W(219) - 0.05, 1e9, { dy: 14, blur: 10 });
      if (pop($('c8btn'), t, W(227) - 0.05, { from: 0.5 })) {
        const r = ((t - W(227)) * 1.3) % 1;
        const ring = $('c8ring');
        ring.style.transform = `scale(${(1 + 0.35 * r).toFixed(4)}, ${(1 + 0.6 * r).toFixed(4)})`;
        ring.style.opacity = (0.8 * (1 - r)).toFixed(3);
      }
      const ar = $('c8arrow');
      if (show(ar, P(t, W(229), 0.25))) ar.style.transform = `translateY(${(10 * Math.abs(Math.sin((t - W(229)) * 5))).toFixed(2)}px)`;
    }
    // end card
    const ec = $('endc');
    if (t < T.end) { ec.style.display = 'none'; }
    else {
      ec.style.display = '';
      $('endshade').style.opacity = E.outCubic(P(t, T.end, 0.5)).toFixed(3);
      ee($('ek'), t, T.end + 0.1, 1e9, { dy: 14 });
      ee($('e1'), t, T.end + 0.2, 1e9, { dy: 30, blur: 12 });
      ee($('e2'), t, T.end + 0.38, 1e9, { dy: 20, blur: 12 });
      [1, 2, 3].forEach(i => {
        ee($('er' + i), t, T.end + 0.45 + 0.22 * i, 1e9, { dy: 30, xout: 0 });
        pop($('ec' + i), t, T.end + 0.6 + 0.22 * i, { from: 0.2 });
      });
      pop($('e3'), t, T.end + 1.45, { from: 0.6 });
    }
  }

  // =====================================================================
  // SFX cue sheet (time, name, gain dB) — exported for the audio mix
  // =====================================================================
  const C = [];
  const q = (tm, name, g) => C.push([+tm.toFixed(3), name, g + (tm < HOOK ? 7.5 : 2)]);
  // hook
  q(0.12, 'whoosh_down', -22); q(0.18, 'counter', -15); q(1.12, 'impact', -7);
  q(1.5, 'blip', -17); q(2.28, 'whoosh_down', -17); q(2.42, 'shimmer', -21);
  q(3.0, 'pop_lo', -18); q(3.06, 'clink', -13); q(3.32, 'impact_soft', -12);
  q(HOOK - 1.1, 'riser_short', -17); q(HOOK - 0.32, 'whoosh_long', -12); q(HOOK - 0.02, 'shutter', -10);
  // body
  q(T.c0[0], 'pop', -19);
  q(T.c2[0], 'whoosh', -19); q(W(42), 'shimmer', -21);
  q(T.c3[0], 'whoosh', -20); q(W(48), 'blip', -19); q(W(50), 'pop', -17);
  q(W(56), 'heartbeat', -11); q(W(56), 'impact_soft', -17);
  q(W(61) - 0.9, 'riser', -20); q(W(65) - 0.06, 'impact', -11); q(W(73), 'pop', -19); q(W(76), 'pop', -19);
  q(T.c5[0] - 0.12, 'whoosh_long', -15); q(T.c5[0] + 0.05, 'impact_soft', -15);
  q(W(86), 'pop', -20); q(W(87), 'pop_lo', -20); q(W(97) - 0.05, 'whoosh', -21); q(W(97) + 0.15, 'clink', -14);
  q(W(102), 'blip', -19); q(W(104), 'pop_lo', -18); q(W(108), 'impact_soft', -18);
  q(W(116), 'whoosh', -21); q(W(128), 'glitch', -17); q(W(130), 'tick', -18); q(W(135), 'ding', -15);
  q(T.c6[0] - 0.12, 'whoosh_long', -15); q(T.c6[0] + 0.05, 'impact_soft', -15);
  q(W(139), 'pop', -19); q(W(143), 'blip3', -18); q(W(150), 'blip3', -18); q(W(152) + 0.15, 'pop', -17); q(W(156), 'pop', -19); q(W(161), 'pop', -19);
  q(T.c7[0] - 0.12, 'whoosh_long', -15); q(T.c7[0] + 0.05, 'impact_soft', -15);
  q(W(179), 'shimmer', -18); q(W(186), 'whoosh', -21); q(W(196), 'ding', -16); q(W(199), 'whoosh', -21); q(W(205), 'blip3', -17);
  q(T.c8[0], 'whoosh', -18); q(W(213), 'pop', -19); q(W(219), 'shimmer', -21); q(W(227), 'tap', -14); q(W(227), 'pop', -17); q(W(229), 'blip', -19);
  q(T.end - 0.1, 'whoosh_long', -15); q(T.end + 0.2, 'shimmer', -19);
  [1, 2, 3].forEach(i => q(T.end + 0.6 + 0.22 * i, 'pop', -18));
  q(T.end + 1.45, 'impact_soft', -15);
  window.CUES = C;
  window.TIMES = T;

  window.renderAt = function (t) {
    renderHook(t);
    renderCards(t);
    renderCaps(t);
  };
  window.READY = document.fonts.ready.then(() => true);
})();
