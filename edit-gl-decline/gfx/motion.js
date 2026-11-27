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
  // HOOK (0 → 6.96 s) — medical card → CRASH → ambulance → TAPI… → GL stamped DECLINED → KENAPA??
  // =====================================================================
  const HOOK = D.hook;
  const HK_END = D.segments[1].out_out;           // 'Kenapa, Kak?' ends → story
  const TC = W(6) - 0.03;                          // 'aksiden' crash
  const TD = W(14) - 0.03;                         // 'decline' stamp
  const HC = [540, 860];                           // her head in the hook framing
  // seeded random so every frame of the render is identical
  let _sd = 7; const rnd = () => (_sd = (_sd * 16807) % 2147483647) / 2147483647;

  const NL = 20;
  const shockLines = Array.from({ length: NL }, (_, i) => {
    const a = (i / NL) * Math.PI * 2 + (i % 2 ? 0.08 : -0.05), r0 = 230 + (i % 3) * 16, r1 = r0 + 100 + (i % 4) * 24;
    return `<line x1="${(HC[0] + Math.cos(a) * r0).toFixed(1)}" y1="${(HC[1] + Math.sin(a) * r0).toFixed(1)}" x2="${(HC[0] + Math.cos(a) * r1).toFixed(1)}" y2="${(HC[1] + Math.sin(a) * r1).toFixed(1)}"/>`;
  }).join('');
  // glass cracks from an impact point (jagged radial lines + broken rings)
  const IP = [560, 400];
  let crk = '';
  for (let i = 0; i < 16; i++) {
    let a = (i / 16) * Math.PI * 2 + rnd() * 0.3, r = 30, x = IP[0], y = IP[1], d = `M${x} ${y}`;
    const R = 700 + rnd() * 700;
    while (r < R) { r += 50 + rnd() * 90; a += (rnd() - 0.5) * 0.28; x = IP[0] + Math.cos(a) * r; y = IP[1] + Math.sin(a) * r; d += ` L${x.toFixed(0)} ${y.toFixed(0)}`; }
    crk += `<path d="${d}"/>`;
  }
  [90, 170, 280].forEach((rr, k) => {
    for (let i = 0; i < 16; i++) {
      if (rnd() < 0.3) continue;
      const a0 = (i / 16) * Math.PI * 2 + rnd() * 0.2, a1 = a0 + Math.PI * 2 / 16, r0 = rr + (rnd() - 0.5) * 30, r1 = rr + (rnd() - 0.5) * 30;
      crk += `<path d="M${(IP[0] + Math.cos(a0) * r0).toFixed(0)} ${(IP[1] + Math.sin(a0) * r0).toFixed(0)} L${(IP[0] + Math.cos(a1) * r1).toFixed(0)} ${(IP[1] + Math.sin(a1) * r1).toFixed(0)}"/>`;
    }
  });
  // comic impact burst
  const burst = (cx, cy, ro, ri, n, rot) => Array.from({ length: n * 2 }, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2 + rot, r = i % 2 ? ri : ro * (0.86 + 0.14 * ((i * 37) % 5) / 4);
    return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
  const QS = [[90, 600, -14, '#FFD23A'], [860, 560, 12, '#fff'], [120, 930, 8, '#fff'], [870, 900, -10, '#FFD23A'], [470, 120, 4, '#FF3B4E']];
  const INK = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 + rnd() * 0.4; return [Math.cos(a), Math.sin(a), 160 + rnd() * 200, 10 + rnd() * 18]; });

  add(`<div id="hk">
    <div id="spd6" style="opacity:0"></div>
    <div id="sirL" style="opacity:0"></div><div id="sirR" style="opacity:0"></div>
    <div id="redflash" style="opacity:0"></div>
    <svg id="shk" width="1080" height="1920" viewBox="0 0 1080 1920" style="position:absolute;inset:0;opacity:0"><g stroke="#1E1B22" stroke-width="11" stroke-linecap="round" style="filter:drop-shadow(0 0 3px rgba(255,255,255,.9))">${shockLines}</g></svg>
    <div class="abs" style="left:0;right:0;top:170px;display:flex;justify-content:center"><div class="tag6" id="t0" style="position:relative">Anda ada…</div></div>
    <div id="mc6"><div class="sh" id="mcsh" style="left:-200px"></div><span class="ico">${RAW('heart-pulse')}</span>
      <div class="chip"></div><div class="t">MEDICAL CARD</div><div class="n">•••• •••• •••• 2026</div></div>
    <div class="abs" id="mcok" style="left:610px;top:560px"><span class="okb">${IC('shield-check')}Dilindungi</span></div>
    <svg id="crk" width="1080" height="1920" viewBox="0 0 1080 1920" style="position:absolute;inset:0;opacity:0;overflow:visible">
      <g fill="none" stroke-linejoin="round" stroke-linecap="round"><g stroke="rgba(20,20,30,.55)" stroke-width="7">${crk}</g><g stroke="#fff" stroke-width="3">${crk}</g></g></svg>
    <svg id="bst" width="1080" height="1920" viewBox="0 0 1080 1920" style="position:absolute;inset:0;opacity:0;overflow:visible">
      <polygon points="${burst(540, 400, 330, 225, 14, 0.1)}" fill="#FFD23A" stroke="#1E1B22" stroke-width="12" stroke-linejoin="round"/>
      <polygon points="${burst(540, 400, 250, 175, 12, 0.35)}" fill="#FF3B4E" stroke="#1E1B22" stroke-width="8" stroke-linejoin="round"/></svg>
    <div class="abs" style="left:0;right:0;top:325px;display:flex;justify-content:center"><div class="k6" id="kA" style="position:relative;font-size:150px">AKSIDEN!</div></div>
    <div class="ibx" id="amb" style="left:780px;top:170px;width:210px;height:210px;color:#E0182F">${RAW('ambulance')}</div>
    <div class="abs" style="left:0;right:0;top:420px;display:flex;justify-content:center"><div class="k6" id="kH" style="position:relative;font-size:140px">HOSPITAL</div></div>
    <div class="abs" style="left:0;right:0;top:300px;display:flex;justify-content:center"><div class="k6 yel" id="kT" style="position:relative;font-size:200px">TAPI…</div></div>
    <div id="gl6">
      <div class="hd">${IC('file-text')}GUARANTEE LETTER</div>
      <div class="bd">
        <div style="display:flex;align-items:flex-end;gap:18px"><div class="big">GL</div><div style="font:italic 400 44px/1.1 'ISerif';padding-bottom:6px">Surat jaminan hospital</div></div>
        <div class="ln">Pesakit<i style="width:260px"></i></div>
        <div class="ln">Rawatan<i style="width:330px"></i></div>
        <div class="ln">Status<i style="width:200px"></i></div>
      </div>
    </div>
    ${INK.map((k, i) => `<div class="inkd" id="ink${i}" style="left:529px;top:389px;width:${k[3].toFixed(0)}px;height:${k[3].toFixed(0)}px;opacity:0"></div>`).join('')}
    <div class="abs" style="left:0;right:0;top:318px;display:flex;justify-content:center"><div id="stp6" style="position:relative;left:auto;top:auto">DECLINED</div></div>
    <div class="abs" id="ex" style="left:820px;top:640px;font:800 170px/1 'PJS';color:#FFD23A;-webkit-text-stroke:14px #1E1B22;paint-order:stroke fill;letter-spacing:-.06em">!!</div>
    <div class="abs sw" id="sw1" style="left:330px;top:700px;width:92px;height:92px;color:#3AA0FF;filter:drop-shadow(0 4px 10px rgba(0,0,0,.35))">${RAW('droplet')}</div>
    <div class="abs sw" id="sw2" style="left:680px;top:680px;width:78px;height:78px;color:#3AA0FF;filter:drop-shadow(0 4px 10px rgba(0,0,0,.35))">${RAW('droplet')}</div>
    <div class="abs" style="left:0;right:0;top:300px;display:flex;justify-content:center"><div class="k6" id="kK" style="position:relative;font-size:170px">KENAPA<span style="color:#FFD23A">?</span></div></div>
    ${QS.map((q, i) => `<div class="q6" id="qq${i}" style="left:${q[0]}px;top:${q[1]}px;color:${q[3]};${i === 4 ? 'font-size:130px;' : ''}">?</div>`).join('')}
    <div id="wf" style="opacity:0"></div>
  </div>`);

  function shakeXY(t, t0, amp, dur = 0.6) {
    const x = t - t0;
    if (x < 0 || x > dur) return [0, 0];
    const a = amp * Math.exp(-x * 7);
    return [a * Math.sin(x * 70), a * Math.cos(x * 53)];
  }
  function renderHook(t) {
    const hk = $('hk');
    if (t > HK_END + 0.3) { hk.style.display = 'none'; return; }
    hk.style.display = '';
    // --- 'Anda ada…' + medical card
    pop($('t0'), t, -0.12, { from: 0.5, d: 0.3, tout: TC - 0.02, dout: 0.08 });
    const mc = $('mc6'), m0 = W(2) - 0.1;
    if (t >= m0 && t < TC + 0.7) {
      const a = P(t, m0, 0.42), e = E.outBack(a);
      let tf = `perspective(1400px) translateY(${(-520 * (1 - E.outCubic(a))).toFixed(1)}px) rotateX(${(68 * (1 - e)).toFixed(2)}deg) rotate(${(-5 + 16 * (1 - e)).toFixed(2)}deg) scale(${(1 + 0.3 * (1 - e)).toFixed(4)})`;
      let op = clamp(a * 4);
      if (t < TC) {
        const k = P(t, W(4), TC - W(4));               // tension: trembles harder towards the crash
        tf += ` translate(${(k * 9 * Math.sin(t * 83)).toFixed(1)}px, ${(6 * Math.sin(t * 3) + k * 7 * Math.cos(t * 71)).toFixed(1)}px)`;
      } else {
        const x = t - TC;                                // knocked off-screen by the crash
        tf += ` translate(${(-1100 * x - 600 * x * x).toFixed(1)}px, ${(-700 * x + 2600 * x * x).toFixed(1)}px) rotate(${(-520 * x).toFixed(1)}deg)`;
        op *= clamp(1 - x * 1.6);
      }
      show(mc, op); mc.style.transform = tf;
      $('mcsh').style.transform = `translateX(${(-100 + 900 * E.inOut(P(t, W(2) + 0.25, 0.6))).toFixed(1)}px) rotate(20deg)`;
    } else show(mc, 0);
    const ok = $('mcok');
    if (pop(ok, t, W(3) + 0.12, { from: 0.3, rot: -12, d: 0.35, tout: TC - 0.02, dout: 0.06 })) ok.style.transform += ` rotate(-4deg)`;
    // --- speed lines build into the crash
    const sp = W(4) - 0.05;
    $('spd6').style.opacity = (t < TC ? 0.85 * E.inCubic(P(t, sp, TC - sp)) : 0.85 * Math.exp(-(t - TC) * 5)).toFixed(3);
    $('spd6').style.transform = `rotate(${(t * 40).toFixed(1)}deg) scale(${(1 + 0.08 * Math.sin(t * 30)).toFixed(3)})`;
    // --- CRASH
    $('wf').style.opacity = (t >= TC ? 0.95 * Math.exp(-(t - TC) * 13) + (t >= TD ? 0.6 * Math.exp(-(t - TD) * 16) : 0) : 0).toFixed(3);
    const ck = $('crk'), kout = W(7) + 0.35;
    if (show(ck, t >= TC && t < kout + 0.3 ? 1 - E.inCubic(P(t, kout, 0.3)) : 0)) {
      ck.querySelectorAll('path').forEach(p => { p.style.strokeDasharray = '1600'; p.style.strokeDashoffset = (1600 * (1 - E.outExpo(P(t, TC, 0.16)))).toFixed(0); });
    }
    const [cx, cy] = shakeXY(t, TC, 26);
    const bs = $('bst');
    if (pop(bs, t, TC, { from: 0.2, d: 0.28, tout: W(7) + 0.15, dout: 0.22 })) {
      bs.style.transformOrigin = '540px 400px';
      bs.style.transform += ` rotate(${(6 * Math.sin(t * 9)).toFixed(2)}deg) translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`;
    }
    const kA = $('kA');
    if (pop(kA, t, TC + 0.02, { from: 2.8, d: 0.26, rot: -10, tout: W(7) + 0.15, dout: 0.22 })) {
      const x = t - TC, g = Math.exp(-x * 4), j = (Math.sin(t * 91) * 10 * g).toFixed(1);
      kA.style.transform += ` rotate(-4deg) translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`;
      kA.style.textShadow = `${j}px 0 rgba(0,220,255,.9), ${-j}px 0 rgba(255,0,90,.9)`;
    }
    // shock lines + !! + sweat on the crash and on the stamp
    const sk = $('shk');
    const shkOn = (t >= TC && t < W(7) + 0.3) || (t >= TD && t < W(15) - 0.05);
    if (show(sk, shkOn ? (Math.floor(t * 14) % 3 ? 1 : 0.55) : 0)) {
      const t0 = t >= TD ? TD : TC, s = 0.8 + 0.25 * E.outBack(P(t, t0, 0.25)) + 0.04 * Math.sin(t * 40);
      sk.style.transformOrigin = `${HC[0]}px ${HC[1]}px`;
      sk.style.transform = `scale(${s.toFixed(4)}) rotate(${(3 * Math.sin(t * 13)).toFixed(2)}deg)`;
    }
    const ex = $('ex');
    if (t < TD - 0.1) { if (pop(ex, t, TC + 0.08, { from: 2.0, rot: 18, d: 0.3, tout: W(7) + 0.15, dout: 0.2 })) ex.style.transform += ` rotate(${(8 * Math.sin(t * 24)).toFixed(1)}deg)`; }
    else if (pop(ex, t, TD + 0.08, { from: 2.0, rot: 18, d: 0.3, tout: W(15) - 0.1, dout: 0.15 })) ex.style.transform += ` rotate(${(8 * Math.sin(t * 24)).toFixed(1)}deg)`;
    ['sw1', 'sw2'].forEach((id, i) => {
      const el = $(id), t0 = TD + 0.25 + 0.15 * i;
      if (pop(el, t, t0, { from: 0.4, d: 0.3, tout: W(15) - 0.1, dout: 0.15 })) el.style.transform += ` translateY(${(70 * P(t, t0 + 0.15, 1.2)).toFixed(1)}px)`;
    });
    // --- ambulance + siren lights + HOSPITAL
    const a0 = W(7) + 0.2, aout = W(12) - 0.08;
    const am = $('amb');
    if (show(am, t >= a0 && t < aout + 0.25 ? 1 : 0)) {
      const a = E.outBack(P(t, a0, 0.45)), b = E.inCubic(P(t, aout, 0.25));
      const on = Math.floor(t * 7) % 2;
      am.style.transform = `translateX(${(560 * (1 - a) - 1300 * b).toFixed(1)}px) translateY(${(5 * Math.sin(t * 22)).toFixed(1)}px) rotate(${(-3 * Math.sin(t * 11)).toFixed(1)}deg)`;
      am.style.boxShadow = `0 16px 36px rgba(0,0,0,.28), 0 0 ${on ? 70 : 40}px ${on ? 'rgba(255,40,60,.95)' : 'rgba(50,110,255,.95)'}`;
    }
    const sOn = t >= a0 && t < W(12) - 0.02 ? clamp(P(t, a0, 0.2)) : 0, ph = Math.floor(t * 7) % 2;
    $('sirL').style.opacity = (sOn * (ph ? 0.95 : 0.12)).toFixed(3);
    $('sirR').style.opacity = (sOn * (ph ? 0.12 : 0.95)).toFixed(3);
    const kH = $('kH');
    if (pop(kH, t, W(11) - 0.06, { from: 2.2, d: 0.3, rot: 6, tout: aout, dout: 0.15 })) kH.style.transform += ` rotate(2deg)`;
    // --- TAPI… (music cuts, record scratch)
    const kT = $('kT');
    if (pop(kT, t, W(12) - 0.03, { from: 2.0, d: 0.32, tout: W(13) - 0.12, dout: 0.14 })) {
      kT.style.transform += ` scale(${(1 + 0.05 * P(t, W(12), 0.8)).toFixed(4)}) rotate(-3deg)`;
    }
    // heartbeat red pulses from TAPI, big flash on the stamp
    const hb = t >= W(12) ? 0.35 * bell(P(t, W(12) + 0.25, 0.3)) + 0.4 * bell(P(t, W(13) + 0.08, 0.3)) : 0;
    const rf = t >= TD ? 0.95 * Math.exp(-(t - TD) * 2.6) + 0.35 * bell(P(t, TD + 0.35, 0.3)) : 0;
    $('redflash').style.opacity = Math.min(1, hb + (t < W(15) + 0.05 ? rf : rf * clamp(1 - (t - W(15) - 0.05) * 5))).toFixed(3);
    // --- GL document + DECLINED stamp
    const gl = $('gl6'), g0 = W(13) - 0.12, gout = W(15) - 0.08;
    if (show(gl, t >= g0 && t < gout + 0.3 ? clamp(P(t, g0, 0.1)) : 0)) {
      const a = E.outBack(P(t, g0, 0.42)), b = E.inCubic(P(t, gout, 0.28));
      const [sx, sy] = shakeXY(t, TD, 22, 0.5);
      gl.style.transform = `translate(${(sx - 300 * b).toFixed(1)}px, ${(700 * (1 - a) + sy - 900 * b).toFixed(1)}px) rotate(${(2 + 10 * (1 - a) - 30 * b).toFixed(2)}deg)`;
    }
    const st = $('stp6');
    if (show(st, t >= TD - 0.12 && t < gout + 0.3 ? clamp(P(t, TD - 0.12, 0.05)) : 0)) {
      const a = P(t, TD - 0.12, 0.12), x = t - TD, b = E.inCubic(P(t, gout, 0.28));
      const s = a < 1 ? 2.8 - 1.8 * E.inCubic(a) : 1 + 0.07 * Math.exp(-x * 14) * Math.sin(x * 46);
      const [sx, sy] = shakeXY(t, TD, 22, 0.5);
      st.style.transform = `translate(${(sx - 300 * b).toFixed(1)}px, ${(sy - 900 * b).toFixed(1)}px) rotate(${(-13 - 30 * b).toFixed(2)}deg) scale(${s.toFixed(4)})`;
    }
    INK.forEach((k, i) => {
      const el = $('ink' + i), x = P(t, TD, 0.45);
      if (show(el, t >= TD && x < 1 ? 1 - x : 0)) el.style.transform = `translate(${(k[0] * k[2] * E.outCubic(x)).toFixed(1)}px, ${(k[1] * k[2] * 0.7 * E.outCubic(x) + 120 * x * x).toFixed(1)}px) scale(${(1 - 0.5 * x).toFixed(3)})`;
    });
    // --- KENAPA ?? (punch-in shot)
    const kK = $('kK');
    if (pop(kK, t, W(15) - 0.04, { from: 2.4, d: 0.3, rot: -8, tout: HK_END - 0.16, dout: 0.14 })) {
      const x = t - W(15), sh = 10 * Math.exp(-x * 6) * Math.sin(x * 60);
      kK.style.transform += ` translateX(${sh.toFixed(1)}px) rotate(-2deg)`;
    }
    QS.forEach((q, i) => {
      const el = $('qq' + i), t0 = W(15) + 0.1 + 0.11 * i;
      if (pop(el, t, t0, { from: 0.2, rot: q[2] * 3, d: 0.3, tout: HK_END - 0.16, dout: 0.14 })) {
        const kb = bell(P(t, W(16) - 0.02, 0.3));
        el.style.transform += ` rotate(${q[2]}deg) translateY(${(10 * Math.sin((t - t0) * 7 + i) - 30 * kb).toFixed(1)}px)`;
      }
    });
  }

  // =====================================================================
  // STORY (6.96 → 14.5) — video shrinks into a PiP, real (redacted) chat proof
  // =====================================================================
  const PIPW = [HK_END - 0.06, W(34) + 0.05];
  add(`<div id="pipbg" class="behindonly"><div class="dots"></div></div>`);
  add(`<div id="st6">
    <div class="abs" id="stl" style="left:60px;top:180px;width:620px;color:var(--ink)">
      <div class="wk" style="color:#2FA36B"><span class="ic">${RAW('badge-check')}</span>Bukti sebenar</div>
      <div class="wt" style="margin-top:12px;font-size:58px">Kes klien <em>saya</em></div>
      <div class="cl6">
        <span class="chip6 ink" id="ch1">${IC('stethoscope')}Doktor sahkan…</span>
        <span class="chip6 ok" id="ch2">${IC('circle-check')}Rawatan biasa dah cukup</span>
        <span class="chip6 red" id="ch3">${IC('x')}GL tak diluluskan</span>
      </div>
    </div>
    <div class="abs" id="pv" style="left:60px;top:1372px;font:600 22px/1.2 'PJS';color:rgba(30,27,34,.5)">Nama klien &amp; hospital dikaburkan untuk privasi</div>
    <div class="pcard" id="pa" style="left:60px;top:735px;width:520px">
      <div class="ph"><span class="tm">3:24 PM</span><span class="lb">X-ray klien</span></div>
      <div style="position:relative"><img src="proof/xa.jpg" style="display:block;width:520px;height:580px">
        <div class="hlb" id="ha" style="left:2%;top:86.3%;width:95%;height:13%"></div></div>
    </div>
    <div class="abs" id="pac" style="left:640px;top:1070px"><span class="chip6 red" style="font-size:44px;line-height:1.05;white-space:normal;width:360px;padding:20px 26px 20px 20px;border-radius:28px;align-items:flex-start"><span class="ic" style="font-size:52px">${RAW('bone')}</span><span>Dislocated<br>finger</span></span></div>
    <svg id="parw" width="1080" height="1920" viewBox="0 0 1080 1920" style="position:absolute;left:0;top:0;overflow:visible">
      <path id="parwp" d="M790 1222 C 790 1300, 700 1322, 604 1320" fill="none" stroke="#D7263D" stroke-width="9" stroke-linecap="round" stroke-dasharray="300" stroke-dashoffset="300"/>
      <path id="parwh" d="M630 1298 L600 1320 L630 1342" fill="none" stroke="#D7263D" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0"/></svg>
    <div class="pcard" id="pb" style="left:65px;top:735px;width:950px">
      <div class="ph"><span class="tm">4:22 PM</span><span class="lb">Chat dengan klien</span></div>
      <div style="position:relative"><img src="proof/xb.jpg" style="display:block;width:950px;height:559px">
        <div class="hlb" id="hb1" style="left:34.5%;top:13.5%;width:61.5%;height:16.5%;border-color:#2FA36B"></div>
        <div class="hlb" id="hb2" style="left:31%;top:76.2%;width:66%;height:23.3%"></div></div>
    </div>
  </div>`);
  function renderStory(t) {
    const r = $('st6');
    $('pipbg').style.display = (t >= PIPW[0] - 0.02 && t <= PIPW[1] + 0.5) ? '' : 'none';
    if (!show(r, t >= PIPW[0] && t < PIPW[1] + 0.1 ? 1 : 0)) return;
    const TO = PIPW[1] - 0.55;
    ee($('stl'), t, PIPW[0] + 0.25, TO, { dy: 24, blur: 8 });
    ee($('pv'), t, PIPW[0] + 0.8, TO, { dy: 6, sc: 0, blur: 3 });
    pop($('ch1'), t, W(25) - 0.08, { from: 0.4, tout: TO });
    pop($('ch2'), t, W(29) - 0.08, { from: 0.4, tout: TO });
    const c3 = $('ch3');
    if (pop(c3, t, W(32) - 0.08, { from: 0.3, rot: -8, tout: TO })) {
      const g = bell(P(t, W(32), 0.6));
      c3.style.boxShadow = `0 10px 24px rgba(20,10,10,.12), 0 0 ${(40 * g).toFixed(0)}px rgba(215,38,61,${(0.8 * g).toFixed(2)})`;
    }
    // card A: x-ray → slides out left when the chat comes in
    const pa = $('pa'), a0 = PIPW[0] + 0.3, aout = W(25) - 0.15;
    if (show(pa, t >= a0 && t < aout + 0.3 ? clamp(P(t, a0, 0.12)) * (1 - E.inCubic(P(t, aout, 0.3))) : 0)) {
      const a = E.outBack(P(t, a0, 0.45)), b = E.inCubic(P(t, aout, 0.3));
      pa.style.transform = `translate(${(300 * (1 - a) - 700 * b).toFixed(1)}px, ${(40 * (1 - a)).toFixed(1)}px) rotate(${(-2 + 4 * (1 - a) - 8 * b).toFixed(2)}deg)`;
      const hp = P(t, W(21) - 0.05, 0.3), ha = $('ha');
      ha.style.opacity = hp > 0 ? '1' : '0';
      ha.style.transform = `scale(${(1.15 - 0.15 * E.outBack(hp)).toFixed(3)})`;
      ha.style.boxShadow = `0 0 ${(24 * bell(P(t, W(21) - 0.05, 0.7))).toFixed(0)}px #D7263D`;
    }
    const pc = $('pac');
    if (pop(pc, t, W(21) + 0.05, { from: 0.3, rot: 8, tout: aout, dout: 0.2 })) pc.style.transform += ` rotate(-3deg) translateY(${(4 * Math.sin(t * 4)).toFixed(1)}px)`;
    const aw = $('parw');
    if (show(aw, t >= W(21) + 0.2 && t < aout + 0.2 ? 1 - E.inCubic(P(t, aout, 0.2)) : 0)) {
      const dk = E.inOut(P(t, W(21) + 0.2, 0.35));
      $('parwp').setAttribute('stroke-dashoffset', (300 * (1 - dk)).toFixed(1));
      $('parwh').setAttribute('opacity', dk > 0.95 ? '1' : '0');
    }
    // card B: the chat
    const pb = $('pb'), b0 = W(25) - 0.1;
    if (show(pb, t >= b0 && t < TO + 0.3 ? clamp(P(t, b0, 0.12)) * (1 - E.inCubic(P(t, TO, 0.25))) : 0)) {
      const a = E.outBack(P(t, b0, 0.45));
      pb.style.transform = `translate(${(700 * (1 - a)).toFixed(1)}px, ${(30 * (1 - a)).toFixed(1)}px) rotate(${(1.2 + 5 * (1 - a)).toFixed(2)}deg)`;
      [['hb1', W(27) - 0.05, '#2FA36B'], ['hb2', W(31) - 0.1, '#D7263D']].forEach(([id, ts, c]) => {
        const hb = $(id), hp = P(t, ts, 0.3);
        hb.style.opacity = hp > 0 ? '1' : '0';
        hb.style.transform = `scale(${(1.15 - 0.15 * E.outBack(hp)).toFixed(3)})`;
        hb.style.boxShadow = `0 0 ${(26 * bell(P(t, ts, 0.8))).toFixed(0)}px ${c}`;
      });
    }
  }

  // =====================================================================
  // 3 REASONS
  // =====================================================================
  add(`<div class="wc" id="s3" style="padding:24px 36px 30px">
    <div style="display:flex;align-items:center;gap:28px">
      <div id="s3n" style="font:italic 400 250px/0.78 'ISerif';color:var(--cr)">3</div>
      <div id="s3t"><div style="font:800 92px/0.92 'PJS';letter-spacing:-.04em">SEBAB</div>
        <div style="font:italic 400 60px/1.05 'ISerif';margin-top:6px">GL anda boleh <span style="color:var(--cr)">decline</span></div></div>
    </div>
    <div class="row" style="margin-top:22px;gap:12px">
      ${['Masuk wad', 'Syarat polisi', 'Kelayakan GL'].map((x, i) => `<span class="pill lt" id="s3p${i}" style="font-size:26px;padding:12px 20px 12px 12px"><span class="badge2" style="width:44px;height:44px;font-size:20px;box-shadow:none">0${i + 1}</span>${x}</span>`).join('')}
    </div>
  </div>`);

  add(`<div class="wc" id="r1">
    <div style="display:flex;align-items:center;gap:20px"><span class="badge2" id="r1n">01</span><div class="wt" style="margin:0;font-size:52px">Tiada keperluan <em>masuk wad</em></div></div>
    <div class="vs6">
      <div class="col a" id="r1a">${IC('bed')}<div class="tx">Medical admission<small>Masuk wad</small></div>
        <div class="abs" id="r1x" style="right:16px;top:20px"><span class="xs">${IC('x')}TAK PERLU</span></div></div>
      <div class="col b" id="r1b">${IC('stethoscope')}<div class="tx">Rawatan outpatient<small>Pesakit luar</small></div>
        <div class="abs" id="r1k" style="right:16px;top:22px"><span class="ok6">${IC('check')}Dah settle</span></div></div>
    </div>
  </div>`);

  add(`<div class="wc" id="r2">
    <div style="display:flex;align-items:center;gap:20px"><span class="badge2" id="r2n">02</span><div class="wt" style="margin:0;font-size:50px">Polisi tak <em>memenuhi syarat</em></div></div>
    <div class="rowi" id="r2a"><span class="ic">${RAW('shield-alert')}</span><div class="tx">Status polisi</div><span class="xs" id="r2ax">${IC('x')}TAK AKTIF</span></div>
    <div class="rowi" id="r2b"><span class="ic">${RAW('wallet')}</span><div class="tx">Caruman</div><span class="xs" id="r2bx">${IC('x')}TAK BAYAR</span></div>
    <div class="rowi" id="r2c"><span class="ic">${RAW('hourglass')}</span><div class="tx">Tempoh menunggu<div class="prog"><i id="r2cp" style="width:0%"></i></div></div><span class="xs" id="r2cx">${IC('x')}BELUM LEPAS</span></div>
  </div>`);

  add(`<div class="wc" id="r3">
    <div style="display:flex;align-items:center;gap:20px"><span class="badge2" id="r3n">03</span><div class="wt" style="margin:0;font-size:52px">Rawatan tak <em>layak GL</em></div></div>
    <div class="rowi" id="r3a"><span class="ic">${RAW('clipboard-check')}</span><div class="tx">Syarat kelayakan GL<small>Ikut terma &amp; syarat polisi</small></div></div>
    <div class="rowi" id="r3b"><span class="ic">${RAW('hospital')}</span><div class="tx">Kemasukan hospital<small>Kriteria perubatan?</small></div></div>
    <div class="bstamp" id="r3s" style="right:34px;bottom:30px;font-size:62px;padding:10px 22px;border-width:8px">TIDAK LAYAK</div>
  </div>`);

  // =====================================================================
  // TAKEAWAY + CTA
  // =====================================================================
  add(`<div class="wc" id="k1">
    <div class="wk"><span class="ic">${RAW('lightbulb')}</span>Ingat</div>
    <div class="wt" style="font-size:52px">Jangan tengok medical card <em>hanya</em> pada…</div>
    <div class="rowi" id="k1a" style="position:relative"><span class="ic">${RAW('wallet')}</span><div class="tx">Caruman bulanan</div><div class="strk" id="k1as" style="left:90px;right:30px"></div></div>
    <div class="rowi" id="k1b" style="position:relative"><span class="ic">${RAW('shield-check')}</span><div class="tx">Annual coverage</div><div class="strk" id="k1bs" style="left:90px;right:30px"></div></div>
  </div>`);

  add(`<div class="wc" id="k2">
    <div class="wt" style="margin-top:0;font-size:58px">Anda juga perlu <em id="cak" style="display:inline-block">cakna</em></div>
    <div class="wp" id="k2w"><span class="hg" id="k2h">${RAW('hourglass')}</span><div><div class="l1">Waiting period</div><div class="l2">tempoh menunggu polisi anda</div></div></div>
  </div>`);

  add(`<div id="cta" class="abs" style="left:0;right:0;top:300px;display:flex;flex-direction:column;align-items:center">
    <div style="display:flex;gap:60px">
      <div class="rb" id="rb1"><div class="rip" id="rp1"></div>${IC('send')}Share</div>
      <div class="rb" id="rb2"><div class="rip" id="rp2"></div>${IC('bookmark')}Save</div>
    </div>
    <div id="nmt" style="margin-top:34px;display:inline-flex;align-items:center;gap:14px;padding:14px 30px 14px 16px;border-radius:999px;background:#fff;box-shadow:0 12px 30px rgba(0,0,0,.28)">
      <span style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#F0566A,#D7263D);display:flex;align-items:center;justify-content:center;color:#fff"><span style="width:30px;height:30px">${RAW('user-round')}</span></span>
      <span style="font:800 40px/1 'PJS';color:#1E1B22;letter-spacing:-.01em">Amalina Ilias</span></div>
  </div>`);

  const T = {};
  T.hk = HK_END;
  T.pip = PIPW;
  T.s3 = [W(34) - 0.05, W(41) - 0.12];
  T.r1 = [W(41) - 0.08, W(53) - 0.12];
  T.r2 = [W(53) - 0.08, W(73) - 0.12];
  T.r3 = [W(73) - 0.08, W(90) - 0.12];
  T.k1 = [W(90) - 0.06, W(105) - 0.12];
  T.k2 = [W(105) - 0.06, W(114) - 0.12];
  T.cta = [W(114) - 0.06, D.total + 1];
  T.end = D.endStart;
  T.t1 = T.r1; T.f2 = T.k2;                          // music: lift at reason 1, break on the 'cakna' card
  const SG = D.segments.map(s => s.out_in);
  T.bumps = [[W(2) - 0.06, 0.04], [TC, 0.13], [W(11) - 0.05, 0.05], [W(12) - 0.03, 0.03], [TD, 0.15], [W(15) - 0.02, 0.07],
    [SG[3], 0.03], [SG[4], 0.03], [T.s3[0], 0.05], [T.r1[0], 0.05], [T.r2[0], 0.05], [SG[8], 0.04], [T.r3[0], 0.05], [SG[10], 0.04],
    [W(88) - 0.05, 0.06], [T.k1[0], 0.05], [T.k2[0], 0.04], [W(112) - 0.05, 0.05], [T.cta[0], 0.04]];
  T.shakes = [[TC, 34, 0.9], [TD, 30, 0.8], [W(15) - 0.02, 10, 0.4], [W(88) - 0.05, 12, 0.5]];
  T.glitch = [[TC, 0.3], [TD, 0.28]];

  function renderCards(t) {
    if (ee($('s3'), t, T.s3[0], T.s3[1], { dy: 30 })) {
      const n = $('s3n'), a = P(t, W(35) - 0.08, 0.45);
      if (show(n, clamp(a * 4))) n.style.transform = `scale(${lerp(2.4, 1, E.outBack(a)).toFixed(4)})`;
      ee($('s3t'), t, W(36) - 0.1, 1e9, { dy: 0, sc: 0, blur: 8 });
      [0, 1, 2].forEach(i => pop($('s3p' + i), t, W(37) + 0.2 * i, { from: 0.4 }));
    }
    if (ee($('r1'), t, T.r1[0], T.r1[1])) {
      pop($('r1n'), t, T.r1[0], { from: 2.0, rot: -20, d: 0.45 });
      ee($('r1a'), t, W(42) - 0.05, 1e9, { dy: 20 });
      pop($('r1x'), t, W(45) - 0.05, { from: 2.2, rot: -18, d: 0.3 });
      const ad = P(t, W(45), 0.3);
      $('r1a').style.opacity = (parseFloat($('r1a').style.opacity || 1) * (1 - 0.35 * ad)).toFixed(3);
      ee($('r1b'), t, W(46) - 0.08, 1e9, { dy: 20 });
      pop($('r1k'), t, W(50) - 0.05, { from: 0.3, d: 0.4 });
    }
    if (ee($('r2'), t, T.r2[0], T.r2[1])) {
      pop($('r2n'), t, T.r2[0], { from: 2.0, rot: -20, d: 0.45 });
      [['r2a', W(61) - 0.12, W(63) - 0.03], ['r2b', W(64) - 0.12, W(66) - 0.03], ['r2c', W(68) - 0.12, W(71) - 0.05]].forEach(([id, ti, tx]) => {
        ee($(id), t, ti, 1e9, { dy: 18 });
        pop($(id + 'x'), t, tx, { from: 2.2, rot: -18, d: 0.3 });
      });
      const pr = 62 * E.outCubic(P(t, W(68), 0.7)) + (t > W(70) ? 1.5 * Math.sin(t * 30) : 0);
      $('r2cp').style.width = pr.toFixed(1) + '%';
    }
    if (ee($('r3'), t, T.r3[0], T.r3[1])) {
      pop($('r3n'), t, T.r3[0], { from: 2.0, rot: -20, d: 0.45 });
      ee($('r3a'), t, W(79) - 0.12, 1e9, { dy: 18 });
      ee($('r3b'), t, W(83) - 0.12, 1e9, { dy: 18 });
      const s = $('r3s'), a = P(t, W(88) - 0.15, 0.12), x = t - W(88) + 0.03;
      if (show(s, clamp(a * 3))) s.style.transform = `rotate(-9deg) scale(${(a < 1 ? 2.6 - 1.6 * E.inCubic(a) : 1 + 0.06 * Math.exp(-x * 14) * Math.sin(x * 46)).toFixed(4)})`;
    }
    if (ee($('k1'), t, T.k1[0], T.k1[1])) {
      ee($('k1a'), t, W(99) - 0.12, 1e9, { dy: 18 });
      ee($('k1b'), t, W(102) - 0.12, 1e9, { dy: 18 });
      ['k1as', 'k1bs'].forEach((id, i) => { $(id).style.transform = `scaleX(${E.outCubic(P(t, W(104) - 0.05 + 0.12 * i, 0.3)).toFixed(4)})`; });
      const dm = P(t, W(104) + 0.1, 0.3);
      ['k1a', 'k1b'].forEach(id => { const el = $(id); if (el.style.display !== 'none') el.style.opacity = (parseFloat(el.style.opacity || 1) * (1 - 0.4 * dm)).toFixed(3); });
    }
    if (ee($('k2'), t, T.k2[0], T.k2[1])) {
      const c = $('cak'), g = bell(P(t, W(108) - 0.05, 0.5));
      c.style.transform = `scale(${(1 + 0.18 * g).toFixed(4)}) rotate(${(-4 * g).toFixed(2)}deg)`;
      ee($('k2w'), t, W(109) - 0.1, 1e9, { dy: 24, sc: 0.08 });
      const fl = E.inOut(P(t, W(112) - 0.05, 0.5));
      $('k2h').style.transform = `rotate(${(180 * fl + 6 * Math.sin(t * 5)).toFixed(1)}deg)`;
      const gw = bell(P(t, W(112), 0.9));
      $('k2w').style.boxShadow = `0 16px 34px rgba(200,16,46,.35), 0 0 ${(50 * gw).toFixed(0)}px rgba(255,80,100,${(0.9 * gw).toFixed(2)})`;
    }
    if (ee($('cta'), t, T.cta[0], T.cta[1], { dy: 30 })) {
      [['rb1', 'rp1', W(114)], ['rb2', 'rp2', W(116)]].forEach(([b, r, ts]) => {
        pop($(b), t, ts - 0.15, { from: 0.4 });
        const k = P(t, ts + 0.05, 0.6);
        $(b).style.transform += ` scale(${(1 - 0.12 * bell(P(t, ts, 0.25))).toFixed(3)})`;
        $(r).style.transform = `scale(${(1 + 0.6 * k).toFixed(3)})`; $(r).style.opacity = (k > 0 && k < 1 ? 0.9 * (1 - k) : 0).toFixed(3);
      });
      pop($('nmt'), t, W(118) - 0.1, { from: 0.5 });
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
  // SFX cue sheet (time, name, gain dB) — all synthesised, copyright-free
  // =====================================================================
  const C = [];
  const q = (tm, name, g) => C.push([+Math.max(0, tm).toFixed(3), name, g + 2]);
  // ---- HOOK
  q(0.0, 'whoosh', -19); q(0.04, 'pop', -16);
  q(W(2) - 0.12, 'whoosh_down', -16); q(W(2) + 0.26, 'impact_soft', -14); q(W(2) + 0.3, 'shimmer', -17);
  q(W(3) + 0.12, 'pop', -15); q(W(3) + 0.14, 'ding', -17);
  q(W(4) - 0.02, 'skid', -13); q(W(4) + 0.2, 'riser_short', -20);
  // CRASH
  q(TC - 0.01, 'impact', -7); q(TC, 'bass_hit', -8); q(TC + 0.01, 'glass', -12); q(TC + 0.03, 'shock', -17); q(TC + 0.02, 'glitch', -16);
  // ambulance + HOSPITAL
  q(W(7) + 0.15, 'wail', -15); q(W(7) + 0.22, 'whoosh', -18);
  q(W(11) - 0.07, 'impact_soft', -14); q(W(11) - 0.06, 'pop', -17);
  // TAPI… record scratch, silence, heartbeat
  q(W(12) - 0.06, 'scratch', -9); q(W(12) - 0.02, 'bass_hit', -16);
  q(W(12) + 0.25, 'heartbeat', -9); q(W(13) + 0.08, 'heartbeat', -10);
  // GL → DECLINED stamp
  q(W(13) - 0.14, 'swipe', -14); q(W(13) - 0.1, 'whoosh_up', -19);
  q(TD - 0.02, 'stamp', -5); q(TD - 0.01, 'bass_hit', -8); q(TD, 'shock', -12); q(TD + 0.01, 'impact', -13); q(TD + 0.02, 'glitch', -15);
  q(TD + 0.35, 'heartbeat', -10);
  // KENAPA ??
  q(W(15) - 0.06, 'whoosh_up', -16); q(W(15) - 0.03, 'pop', -13);
  [0, 1, 2, 3, 4].forEach(i => q(W(15) + 0.1 + 0.11 * i, 'pop_lo', -18 + (i % 2)));
  q(W(16) - 0.02, 'blip', -15);
  q(HK_END - 0.14, 'whoosh_long', -13); q(HK_END + 0.4, 'impact_soft', -19);
  // ---- STORY (proof)
  q(PIPW[0] + 0.3, 'swipe', -17); q(PIPW[0] + 0.36, 'notif', -15);
  q(W(21) - 0.05, 'tap', -15); q(W(21) + 0.05, 'pop', -16);
  q(W(25) - 0.15, 'swipe', -17); q(W(25) - 0.1, 'notif2', -15); q(W(25) - 0.08, 'pop', -19);
  q(W(27) - 0.05, 'tap', -17); q(W(29) - 0.08, 'ding', -16); q(W(31) - 0.1, 'tap', -14);
  q(W(32) - 0.1, 'impact_soft', -15); q(W(32) - 0.08, 'pop_lo', -15);
  q(PIPW[1] - 0.5, 'whoosh_down', -18);
  // ---- 3 REASONS
  q(T.s3[0], 'whoosh', -17); q(W(35) - 0.08, 'impact', -13); q(W(35) - 0.05, 'shimmer', -19);
  [0, 1, 2].forEach(i => q(W(37) + 0.2 * i, 'pop', -19));
  q(T.r1[0], 'whoosh', -17); q(T.r1[0] + 0.02, 'pop', -16);
  q(W(42) - 0.05, 'swipe', -20); q(W(45) - 0.05, 'stamp_sm', -10); q(W(46) - 0.08, 'swipe', -20); q(W(50) - 0.05, 'ding', -15);
  q(T.r2[0], 'whoosh', -17); q(T.r2[0] + 0.02, 'pop', -16);
  [[61, 63], [64, 66], [68, 71]].forEach(([a, b]) => { q(W(a) - 0.12, 'pop', -19); q(W(b) - 0.05, 'stamp_sm', -11); });
  q(W(68), 'counter', -21);
  q(T.r3[0], 'whoosh', -17); q(T.r3[0] + 0.02, 'pop', -16);
  q(W(79) - 0.12, 'pop', -19); q(W(83) - 0.12, 'pop', -19);
  q(W(88) - 0.05, 'stamp', -8); q(W(88) - 0.04, 'bass_hit', -13);
  // ---- TAKEAWAY + CTA
  q(T.k1[0], 'whoosh', -16); q(T.k1[0] + 0.05, 'blip', -18);
  q(W(99) - 0.12, 'pop', -18); q(W(102) - 0.12, 'pop', -18); q(W(104) - 0.05, 'swipe', -14); q(W(104) + 0.07, 'swipe', -17);
  q(T.k2[0], 'whoosh', -17); q(W(108) - 0.05, 'shimmer', -17); q(W(108) - 0.03, 'pop', -17);
  q(W(109) - 0.1, 'impact_soft', -16); q(W(112) - 0.05, 'tick', -14); q(W(112) + 0.2, 'ding', -14);
  q(T.cta[0], 'whoosh', -18); q(W(114), 'tap', -13); q(W(114) + 0.02, 'pop', -16); q(W(116), 'tap', -13); q(W(116) + 0.02, 'pop', -16);
  q(W(118) - 0.1, 'shimmer', -18); q(D.endStart - 0.1, 'applause', -20);
  window.CUES = C;
  window.TIMES = T;

  window.renderAt = function (t) {
    renderHook(t);
    renderStory(t);
    renderCards(t);
    renderCaps(t);
    const inPip = t >= PIPW[0] + 0.3 && t <= PIPW[1] - 0.25;
    $('cap').classList.toggle('dark', inPip);
    $('cap').classList.toggle('low', inPip);
  };
  window.READY = document.fonts.ready.then(() => true);
})();
