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
  // HOOK — "BTS camera": B&W viewfinder + typewriter → colour reveal stamp
  // =====================================================================
  const HOOK = D.hook, BW = D.bwEnd;
  const L1 = 'Hilang 1 ruas jari…', L2 = 'boleh claim insurans ke?';
  const TY = [[L1, 0.25, 1.3], [L2, 1.45, 2.65]];
  add(`<div id="hook">
    <div id="vf">
      <div class="corner" style="left:56px;top:96px;border-left:5px solid;border-top:5px solid"></div>
      <div class="corner" style="right:56px;top:96px;border-right:5px solid;border-top:5px solid"></div>
      <div class="corner" style="left:56px;bottom:96px;border-left:5px solid;border-bottom:5px solid"></div>
      <div class="corner" style="right:56px;bottom:96px;border-right:5px solid;border-bottom:5px solid"></div>
      <div class="vft" style="left:104px;top:132px"><span id="rdot"></span>REC</div>
      <div class="vft" id="tc" style="right:104px;top:132px">00:00:00:00</div>
      <div class="vft" style="left:104px;bottom:136px;font-size:26px;opacity:.85">BTS · TAKE 01</div>
      <div class="vft" style="right:104px;bottom:136px;font-size:26px;opacity:.85">4K · 50P</div>
    </div>
    <div class="tw" id="tw1" style="top:300px"><span class="tb" id="tw1t"></span></div>
    <div class="tw" id="tw2" style="top:392px"><span class="tb" id="tw2t"></span></div>
    <div class="tw" id="tw3" style="top:500px"><span class="tb" style="color:#FF8F9E">Ramai sangka: TAK BOLEH.</span></div>
    <div id="sebenar">Sebenarnya…</div>
    <div class="glass" id="stamp"><span class="ic">${RAW('circle-check')}</span>BOLEH!</div>
    <div class="abs" id="stampsub" style="left:0;right:0;top:560px;display:flex;justify-content:center"><span class="chip amber" style="font-size:36px">Dari 2% hingga 100%*</span></div>
    <div id="hnote">*Ikut jadual manfaat polisi. Tertakluk pada terma &amp; syarat.</div>
    <div id="hflash" class="abs" style="inset:0;background:#fff"></div>
    <div id="hblack" class="abs" style="inset:0;background:#000"></div>
  </div>`);

  function renderHook(t) {
    const hook = $('hook');
    if (t >= HOOK + 0.02) { hook.style.display = 'none'; return; }
    hook.style.display = '';
    $('hblack').style.opacity = (1 - E.outCubic(P(t, 0, 0.2))).toFixed(3);
    $('hflash').style.opacity = (0.85 * Math.exp(-Math.max(0, t - BW) * 7) * (t >= BW ? 1 : 0)).toFixed(3);
    // viewfinder UI only during the black & white part
    const vf = $('vf');
    if (show(vf, (t < BW ? 1 : 0) * E.outCubic(P(t, 0.05, 0.3)))) {
      $('rdot').style.opacity = (Math.floor(t * 2) % 2 === 0) ? '1' : '0.15';
      const fr = Math.floor(t * 25) % 25, s = Math.floor(t);
      $('tc').textContent = `00:00:${String(s).padStart(2, '0')}:${String(fr).padStart(2, '0')}`;
    }
    // typewriter lines
    TY.forEach(([txt, t0, t1], i) => {
      const el = $('tw' + (i + 1));
      if (show(el, t >= t0 && t < 3.45 ? 1 : 0)) {
        const n = Math.min(txt.length, Math.floor(txt.length * P(t, t0, t1 - t0)));
        const caret = t < t1 + 0.05 ? '<i class="caret">▌</i>' : '';
        $('tw' + (i + 1) + 't').innerHTML = txt.slice(0, n) + caret;
      }
    });
    const g = P(t, 2.85, 0.25);
    const tw3 = $('tw3');
    if (show(tw3, (t >= 2.85 && t < 3.45) ? 1 : 0)) {
      const j = (1 - g) * 14;
      tw3.style.transform = `translate(${(Math.sin(t * 180) * j).toFixed(1)}px, 0) skewX(${(Math.sin(t * 97) * j * 0.6).toFixed(1)}deg)`;
    }
    // "Sebenarnya…" over the covered lens
    ee($('sebenar'), t, 3.45, BW - 0.05, { dy: 16, sc: 0.08, blur: 16, din: 0.35, dout: 0.08 });
    // colour reveal
    const so = pop($('stamp'), t, BW + 0.02, { from: 1.9, rot: -14, d: 0.42, base: 'translateX(-50%)', tout: HOOK - 0.32, dout: 0.28 });
    if (so) $('stamp').style.transform += ' rotate(-5deg)';
    pop($('stampsub'), t, BW + 0.35, { from: 0.4, tout: HOOK - 0.3, dout: 0.25 });
    ee($('hnote'), t, BW + 0.35, HOOK - 0.3, { dy: 6, blur: 3, sc: 0 });
  }

  // =====================================================================
  // CARDS
  // =====================================================================
  add(`<div class="abs" style="left:0;right:0;top:200px;display:flex;justify-content:center"><div class="glass chip" id="pA" style="position:relative;font-size:38px;padding:18px 32px 18px 24px">${IC('lightbulb')}<span>Ramai <span class="serif" style="font-weight:400;color:var(--amber);font-size:48px">tak tahu…</span></span></div></div>`);

  // B — rider + formula
  add(`<div class="glass card" id="cB">
    <div class="kicker"><span class="ic">${RAW('shield-check')}</span>Rider AIA</div>
    <div class="title" id="cBt">Bayar ikut <em>% kehilangan upaya</em></div>
    <div class="fx">
      <div class="fbox" id="f1"><span class="ic">${RAW('percent')}</span><div class="l">% kehilangan<br>upaya</div></div>
      <div class="fop" id="fo1">×</div>
      <div class="fbox" id="f2"><span class="ic">${RAW('shield-check')}</span><div class="l">Jumlah<br>perlindungan</div></div>
      <div class="fop" id="fo2">=</div>
      <div class="fbox" id="f3" style="background:linear-gradient(135deg,rgba(243,176,97,.9),rgba(201,119,46,.9))"><span class="ic" style="color:#fff">${RAW('hand-coins')}</span><div class="l" style="color:#fff">Pampasan<br>anda</div></div>
    </div>
    <div class="ex" id="fex"><span class="ic">${RAW('calculator')}</span><span>Contoh: <b>15%</b> × RM100,000* = <b class="big2" id="fexr">RM15,000</b></span></div>
    <div class="foot" id="fexn">*Contoh ilustrasi · 15% = 1 ruas ibu jari kanan · ikut jumlah perlindungan &amp; terma polisi</div>
  </div>`);

  // C — table preview
  add(`<div class="glass card" id="cC">
    <div class="kicker"><span class="ic">${RAW('table-2')}</span>Jadual pampasan</div>
    <div class="sub" style="margin-top:12px">Contoh dari jadual polisi</div>
    <div style="margin-top:18px">
      <div class="tr" id="pc1">${IC('accessibility')}<div class="x">Hilang upaya kekal sepenuhnya</div><div class="p full">100%</div></div>
      <div class="tr" id="pc2">${IC('ear')}<div class="x">Pendengaran sebelah telinga</div><div class="p">25%</div></div>
      <div class="tr" id="pc3">${IC('hand')}<div class="x">Ibu jari kanan<small>1 ruas</small></div><div class="p">15%</div></div>
    </div>
  </div>`);

  // D — policy quote
  add(`<div class="glass paper" id="cD">
    <div class="qmark">“</div>
    <div class="kicker"><span class="ic">${RAW('scroll-text')}</span>Petikan polisi</div>
    <div class="prow2" id="q1"><div class="en"><span class="hl" id="h1"></span>…by reason of Injury…</div><div class="ms">Akibat <b>kecederaan</b> (kemalangan)</div></div>
    <div class="prow2" id="q2"><div class="en"><span class="hl" id="h2"></span>suffers any of the events stipulated below</div><div class="ms">Mengalami mana-mana <b>kejadian dalam jadual</b></div></div>
  </div>`);

  // E — 365-day timeline
  add(`<div class="glass card" id="cE">
    <div class="kicker"><span class="ic">${RAW('calendar-days')}</span>Tempoh tuntutan</div>
    <div class="title" style="font-size:50px">Dalam <em id="dcount">0</em><em> hari</em> dari tarikh kemalangan</div>
    <div class="tl">
      <div class="track"><div class="fill" id="tfill" style="right:0"></div></div>
      <div class="pin" id="tp0" style="left:60px;background:linear-gradient(135deg,#E08A99,#B9576A)">${RAW('ambulance')}</div>
      <div class="lab" id="tl0" style="left:0;margin-left:0;width:240px;text-align:left">Hari 0<small>Kemalangan</small></div>
      <div class="pin" id="tp1" style="left:40%;background:linear-gradient(135deg,#86A55A,#5E7F3A)">${RAW('check')}</div>
      <div class="lab" id="tl1" style="left:40%">Kehilangan<small>berlaku ✓</small></div>
      <div class="pin" id="tp2" style="left:calc(100% - 60px);background:linear-gradient(135deg,#F3B061,#C9772E)">${RAW('calendar-days')}</div>
      <div class="lab" id="tl2" style="left:auto;right:0;margin-left:0;width:240px;text-align:right">Hari 365<small>had tempoh</small></div>
    </div>
  </div>`);

  // F — full schedule (scrolling)
  const ROWS = [
    ['user-x', 'Kematian', '', '100%', 1], ['accessibility', 'Hilang upaya kekal sepenuhnya', '', '100%', 1],
    ['eye', 'Penglihatan sebelah mata', 'hilang kekal', '100%', 1], ['ear', 'Pendengaran kedua-dua telinga', '', '75%', 0],
    ['ear', 'Pendengaran sebelah telinga', '', '25%', 0], ['mic-off', 'Hilang pertuturan', 'kekal', '50%', 0],
    ['hand', '4 jari + ibu jari', 'tangan kanan', '70%', 0], ['hand', 'Ibu jari kanan', '1 ruas', '15%', 0],
    ['hand', 'Jari kanan', '1 ruas', '5%', 0], ['footprints', 'Ibu jari kaki', '2 ruas', '5%', 0],
    ['footprints', 'Jari kaki lain', 'setiap satu', '2%', 0], ['ruler', 'Kaki pendek', 'sekurang-kurangnya 5 cm', '7.5%', 0],
  ];
  add(`<div class="glass card" id="cF">
    <div class="kicker"><span class="ic">${RAW('table-2')}</span>Jadual pampasan</div>
    <div class="title" style="font-size:44px">Dibayar <em>% × jumlah perlindungan</em></div>
    <div class="tview"><div class="tlist" id="tlist">${ROWS.map((r, i) => `<div class="tr" id="fr${i}">${IC(r[0])}<div class="x">${r[1]}${r[2] ? `<small>${r[2]}</small>` : ''}</div><div class="p${r[4] ? ' full' : ''}">${r[3]}</div></div>`).join('')}</div></div>
    <div class="foot">Contoh jadual polisi AIA · Kidal: kadar tangan kanan &amp; kiri ditukar</div>
  </div>`);

  // G — scale: no need to wait for 100%
  const SC = [2, 5, 15, 25, 50, 75, 100];
  add(`<div class="glass card" id="cG">
    <div class="kicker"><span class="ic">${RAW('lightbulb')}</span>Maksudnya</div>
    <div class="title" style="font-size:50px">Tak perlu tunggu <span style="position:relative;display:inline-block;color:var(--rose)">hilang upaya 100%<span class="strike" id="gstrike" style="left:-6px;right:-6px;top:48%"></span></span></div>
    <div class="scale">
      <div class="bar"><div class="barf" id="gfill" style="right:0"></div></div>
      ${SC.map((v, i) => `<div class="dot" id="gd${i}" style="left:calc(30px + ${(i / (SC.length - 1)).toFixed(4)} * (100% - 60px))"></div><div class="dl" id="gl${i}" style="left:calc(30px + ${(i / (SC.length - 1)).toFixed(4)} * (100% - 60px))">${v}%</div>`).join('')}
    </div>
    <div class="vs" id="gv1"><span class="chip rose" style="font-size:28px;padding:10px 20px">${IC('x')}Ramai sangka</span>hanya 100% dibayar</div>
    <div class="vs" id="gv2"><span class="chip olive" style="font-size:28px;padding:10px 20px">${IC('check')}Sebenarnya</span>dari 2% pun dibayar</div>
  </div>`);

  // H — body map
  const CALL = [
    // [id, side, top, label, small, pct, full, hotspot x, hotspot y]
    ['b1', 'L', 18, 'Mata', 'sebelah', '100%', 1, 418, 58],
    ['b2', 'R', 40, 'Telinga', 'sebelah', '25%', 0, 482, 66],
    ['b3', 'L', 236, 'Ibu jari kanan', '1 ruas', '15%', 0, 302, 298],
    ['b4', 'L', 336, 'Jari kanan', '1 ruas', '5%', 0, 318, 322],
    ['b5', 'R', 300, 'Kaki pendek', '≥ 5 cm', '7.5%', 0, 466, 392],
    ['b6', 'R', 410, 'Jari kaki', 'setiap satu', '2%', 0, 476, 478],
  ];
  add(`<div class="glass card" id="cH">
    <div class="kicker" style="justify-content:space-between"><span style="display:flex;align-items:center;gap:14px"><span class="ic">${RAW('accessibility')}</span>Sebahagian pun dibayar</span>
      <span class="chip olive" id="hok" style="font-size:26px;padding:10px 18px;letter-spacing:0;text-transform:none">${IC('circle-check')}Dapat pampasan</span></div>
    <div class="body">
      <svg width="872" height="520" viewBox="0 0 872 520" style="position:absolute;left:0;top:0">
        <g fill="rgba(255,255,255,.62)" stroke="rgba(43,31,22,.28)" stroke-width="3" stroke-linejoin="round">
          <circle cx="436" cy="62" r="44"/>
          <path d="M436 106 v18"/>
          <path d="M366 132 Q436 116 506 132 Q526 140 528 168 L538 292 Q540 306 528 306 Q518 306 516 294 L500 196 L494 300 L486 470 Q484 492 466 492 Q448 492 448 470 L442 330 L430 330 L424 470 Q424 492 406 492 Q388 492 386 470 L378 300 L372 196 L356 294 Q354 306 344 306 Q332 306 334 292 L344 168 Q346 140 366 132 Z"/>
          <circle cx="324" cy="306" r="20"/><circle cx="548" cy="306" r="20"/>
        </g>
        ${CALL.map(c => `<line id="${c[0]}l" x1="${c[1] === 'L' ? 300 : 572}" y1="${c[2] + 34}" x2="${c[7]}" y2="${c[8]}" stroke="#C9772E" stroke-width="3" stroke-dasharray="400" stroke-dashoffset="400"/><circle id="${c[0]}d" cx="${c[7]}" cy="${c[8]}" r="9" fill="#C9772E" stroke="#fff" stroke-width="3"/>`).join('')}
      </svg>
      ${CALL.map(c => `<div class="callout" id="${c[0]}" style="top:${c[2]}px;${c[1] === 'L' ? 'right:572px' : 'left:572px'}"><div class="x">${c[3]}<small>${c[4]}</small></div><div class="p${c[6] ? ' full' : ''}">${c[5]}</div></div>`).join('')}
    </div>
  </div>`);

  // I — CTA
  add(`<div class="glass card" id="cI">
    <div class="kicker"><span class="ic">${RAW('sparkles')}</span>Nak tahu rider apa?</div>
    <div style="display:flex;align-items:center;gap:28px;margin-top:26px">
      <div class="avatar" id="iav">${IC('briefcase')}</div>
      <div><div style="font:800 46px/1.1 'PJS'" id="iname">Naja’a Amalina binti Ilias</div><div style="margin-top:12px" id="irole"><span class="badge">AIA ADVISOR</span></div></div>
    </div>
    <div style="margin-top:32px;display:flex;align-items:center;gap:26px">
      <div class="btn" id="ibtn"><div class="ring" id="iring"></div>${IC('message-circle')}PM saya</div>
      <div id="iarrow" style="width:66px;height:66px;color:var(--amber)">${RAW('chevrons-down')}</div>
    </div>
  </div>`);

  // end card
  add(`<div id="endc"><div id="endshade"></div>
    <div class="glass" id="endbox">
      <div class="kicker" id="ek" style="justify-content:center"><span class="ic">${RAW('sparkles')}</span>Ringkasan</div>
      <div id="e1" style="text-align:center;font:800 60px/1.08 'PJS';margin-top:22px">Rider ni bayar ikut</div>
      <div id="e2" style="text-align:center;font:italic 400 82px/1 'ISerif';color:var(--amber);margin-top:6px">% kehilangan upaya</div>
      <div style="margin-top:40px">
        <div class="erow" id="er1"><div class="x">Dari 2% hingga 100%, ikut jadual</div><div class="ck" id="ec1">${IC('check')}</div></div>
        <div class="erow" id="er2"><div class="x">Dalam 365 hari dari tarikh kemalangan</div><div class="ck" id="ec2">${IC('check')}</div></div>
        <div class="erow" id="er3"><div class="x">Tak perlu tunggu hilang upaya 100%</div><div class="ck" id="ec3">${IC('check')}</div></div>
      </div>
      <div style="display:flex;justify-content:center;margin-top:30px"><div class="chip amber" id="e3" style="font-size:36px">${IC('message-circle')}PM Naja’a · AIA Advisor</div></div>
      <div class="foot" id="e4" style="text-align:center;margin-top:18px">Contoh jadual polisi AIA · Tertakluk pada terma &amp; syarat polisi</div>
    </div></div>`);

  const T = {};
  T.pA = [W(0) + 0.05, W(6) - 0.12];
  T.cB = [W(6) - 0.02, W(24) - 0.12];
  T.cC = [1e9, 1e9];  // preview table dropped: the worked example + full table carry it
  T.cD = [W(24) - 0.04, W(39) - 0.12];
  T.cE = [W(39) - 0.04, W(47) - 0.12];
  T.cF = [W(47) - 0.04, W(62) - 0.12];
  T.cG = [W(62) - 0.04, W(75) - 0.12];
  T.cH = [W(75) - 0.04, W(85) - 0.12];
  T.cI = [W(85) - 0.04, D.endStart - 0.05];
  T.end = D.endStart;

  function renderCards(t) {
    pop($('pA'), t, T.pA[0], { tout: T.pA[1], from: 0.7 });
    // B
    if (ee($('cB'), t, T.cB[0], T.cB[1])) {
      ee($('cBt'), t, W(8) - 0.1, 1e9, { dy: 14, blur: 8 });
      pop($('f1'), t, W(13) - 0.05, { from: 0.5 });
      ee($('fo1'), t, W(14), 1e9, { dy: 0, sc: 0, blur: 6 });
      pop($('f2'), t, W(16) - 0.05, { from: 0.5 });
      ee($('fo2'), t, W(18), 1e9, { dy: 0, sc: 0, blur: 6 });
      pop($('f3'), t, W(19) - 0.05, { from: 0.4 });
      ee($('fex'), t, W(19) + 0.25, 1e9, { dy: 14, blur: 8 });
      ee($('fexn'), t, W(19) + 0.35, 1e9, { dy: 6, blur: 3, sc: 0 });
      const gx = bell(P(t, W(21) - 0.05, 0.7));
      $('fex').style.boxShadow = gx > 0.01 ? `0 0 0 ${(4 * gx).toFixed(1)}px rgba(201,119,46,.6), 0 0 ${(30 * gx).toFixed(0)}px rgba(239,162,79,${(0.6 * gx).toFixed(2)})` : 'none';
    }
    // C
    if (ee($('cC'), t, T.cC[0], T.cC[1])) {
      ['pc1', 'pc2', 'pc3'].forEach((id, i) => ee($(id), t, W(20) + 0.1 + 0.18 * i, 1e9, { dy: 18 }));
      $('pc3').classList.toggle('hl', t > W(21));
    }
    // D
    if (ee($('cD'), t, T.cD[0], T.cD[1], { dy: 40, blur: 12 })) {
      const rows = [['q1', 'h1', W(25), W(28) + 0.25], ['q2', 'h2', W(32), W(38) + 0.25]];
      rows.forEach(([q, h, ts, te], i) => {
        const next = rows[i + 1] ? rows[i + 1][2] : 1e9;
        if (ee($(q), t, ts - 0.08, 1e9, { dy: 18, blur: 8 })) {
          const active = t < next;
          $(q).classList.toggle('on', active);
          $(q).style.opacity = (parseFloat($(q).style.opacity) * (active ? 1 : 0.5)).toFixed(3);
          $(h).style.transform = `scaleX(${E.inOut(P(t, ts + 0.05, Math.max(0.4, te - ts))).toFixed(4)})`;
        }
      });
    }
    // E — timeline
    if (ee($('cE'), t, T.cE[0], T.cE[1])) {
      const c = E.outExpo(P(t, W(40) - 0.05, 1.1));
      $('dcount').textContent = Math.round(365 * c);
      $('tfill').style.transform = `scaleX(${E.inOut(P(t, W(40), 1.2)).toFixed(4)})`;
      pop($('tp2'), t, W(41) - 0.05, { from: 0.4, base: 'translateX(0)' });
      ee($('tl2'), t, W(41), 1e9, { dy: 10, sc: 0 });
      pop($('tp0'), t, W(44) - 0.05, { from: 0.4 });
      ee($('tl0'), t, W(44), 1e9, { dy: 10, sc: 0 });
      pop($('tp1'), t, W(46) - 0.05, { from: 0.3 });
      ee($('tl1'), t, W(46), 1e9, { dy: 10, sc: 0 });
    }
    // F — scrolling schedule
    if (ee($('cF'), t, T.cF[0], T.cF[1])) {
      ROWS.forEach((r, i) => ee($('fr' + i), t, W(47) + 0.12 + 0.08 * Math.min(i, 5), 1e9, { dy: 16, blur: 6 }));
      const sc = E.inOut(P(t, W(53) - 0.2, W(61) - W(53) + 0.4));
      $('tlist').style.transform = `translateY(${(-690 * sc).toFixed(1)}px)`;
      const hi = Math.min(ROWS.length - 1, Math.floor(sc * ROWS.length));
      ROWS.forEach((r, i) => $('fr' + i).classList.toggle('hl', t > W(53) && i === hi));
    }
    // G — scale
    if (ee($('cG'), t, T.cG[0], T.cG[1])) {
      const st = E.outExpo(P(t, W(70), 0.45));
      if (show($('gstrike'), st > 0 ? 1 : 0)) $('gstrike').style.transform = `scaleX(${st.toFixed(4)})`;
      const fill = E.inOut(P(t, W(71), 1.0));
      $('gfill').style.transform = `scaleX(${fill.toFixed(4)})`;
      SC.forEach((v, i) => {
        const on = t > W(71) + 0.16 * i;
        const only = !on && i === SC.length - 1 && t > W(64);
        $('gd' + i).className = 'dot' + (on ? ' on' : '') + (only ? ' only' : '');
        $('gl' + i).className = 'dl' + (on ? ' on' : '');
        const pk = bell(P(t, W(71) + 0.16 * i, 0.3));
        $('gd' + i).style.transform = `scale(${(1 + 0.4 * pk).toFixed(3)})`;
      });
      ee($('gv1'), t, W(64), 1e9, { dy: 12 });
      if (t > W(71)) $('gv1').style.opacity = (parseFloat($('gv1').style.opacity) * 0.45).toFixed(3);
      ee($('gv2'), t, W(73), 1e9, { dy: 12 });
    }
    // H — body map
    if (ee($('cH'), t, T.cH[0], T.cH[1])) {
      CALL.forEach((c, i) => {
        const t0 = W(76) + 0.4 * i;
        ee($(c[0]), t, t0, 1e9, { dy: 10, blur: 6 });
        $(c[0] + 'l').setAttribute('stroke-dashoffset', (400 * (1 - E.inOut(P(t, t0, 0.4)))).toFixed(1));
        const d = $(c[0] + 'd');
        const a = P(t, t0 + 0.25, 0.25);
        d.setAttribute('opacity', a.toFixed(3));
        d.setAttribute('r', (9 + 6 * bell(P(t, t0 + 0.25, 0.4))).toFixed(2));
      });
      pop($('hok'), t, W(83) - 0.05, { from: 0.4 });
    }
    // I — CTA
    if (ee($('cI'), t, T.cI[0], T.cI[1])) {
      pop($('iav'), t, W(86) - 0.05);
      ee($('iname'), t, W(86), 1e9, { dy: 14, blur: 10 });
      pop($('irole'), t, W(87), { from: 0.5 });
      if (pop($('ibtn'), t, W(89) - 0.05, { from: 0.5 })) {
        const r = ((t - W(89)) * 1.3) % 1;
        $('iring').style.transform = `scale(${(1 + 0.35 * r).toFixed(4)}, ${(1 + 0.6 * r).toFixed(4)})`;
        $('iring').style.opacity = (0.8 * (1 - r)).toFixed(3);
      }
      const ar = $('iarrow');
      if (show(ar, P(t, W(92), 0.25))) ar.style.transform = `translateY(${(10 * Math.abs(Math.sin((t - W(92)) * 5))).toFixed(2)}px)`;
    }
    // end card
    const ec = $('endc');
    if (t < T.end) { ec.style.display = 'none'; }
    else {
      ec.style.display = '';
      $('endshade').style.opacity = E.outCubic(P(t, T.end, 0.5)).toFixed(3);
      ee($('endbox'), t, T.end + 0.05, 1e9, { dy: 50, sc: 0.06, blur: 12 });
      ee($('ek'), t, T.end + 0.15, 1e9, { dy: 14 });
      ee($('e1'), t, T.end + 0.25, 1e9, { dy: 24, blur: 10 });
      ee($('e2'), t, T.end + 0.4, 1e9, { dy: 20, blur: 12 });
      [1, 2, 3].forEach(i => {
        ee($('er' + i), t, T.end + 0.45 + 0.22 * i, 1e9, { dy: 24 });
        pop($('ec' + i), t, T.end + 0.6 + 0.22 * i, { from: 0.2 });
      });
      pop($('e3'), t, T.end + 1.45, { from: 0.6 });
      ee($('e4'), t, T.end + 1.6, 1e9, { dy: 8, blur: 4 });
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
  // SFX cue sheet (time, name, gain dB) — hook cues get +7.5 dB, body +2 dB
  // =====================================================================
  const C = [];
  const q = (tm, name, g) => C.push([+tm.toFixed(3), name, g + (tm < HOOK ? 10.5 : 2)]);
  // hook: BTS camera
  q(0.0, 'rec_beep', -15); q(0.05, 'projector', -19);
  TY.forEach(([txt, t0, t1]) => { for (let k = 0; k < txt.length; k++) if (txt[k] !== ' ') q(t0 + (k + 1) / txt.length * (t1 - t0) - 0.02, 'type_key', -21); });
  q(TY[1][2] + 0.05, 'type_bell', -18);
  q(2.85, 'glitch', -14); q(2.86, 'scratch', -17);
  q(3.42, 'whoosh_down', -19); q(3.45, 'heartbeat', -11); q(BW - 1.1, 'riser_short', -17);
  q(BW, 'clapper', -8); q(BW, 'bass_hit', -13); q(BW + 0.02, 'impact', -17); q(BW + 0.05, 'shimmer', -18);
  q(BW + 0.35, 'pop', -17);
  q(BW + 0.8, 'clap2', -12); q(BW + 0.85, 'ding', -17);
  q(HOOK - 0.35, 'whoosh_long', -14);
  // body
  q(T.pA[0], 'pop', -19);
  q(T.cB[0], 'whoosh', -18); q(T.cB[0] + 0.02, 'glass_tap', -20); q(W(8), 'shimmer', -22);
  q(W(13), 'pop', -19); q(W(16), 'pop', -19); q(W(19), 'blip3', -18); q(W(19) + 0.05, 'coins', -22); q(W(19) + 0.3, 'chaching', -16);
  q(W(21) - 0.05, 'blip3', -19);
  q(T.cD[0] - 0.1, 'whoosh_long', -16); q(W(25), 'swipe', -19); q(W(32), 'swipe', -19);
  q(T.cE[0], 'whoosh', -18); q(W(40) - 0.05, 'counter', -18); q(W(41), 'pop', -19); q(W(44), 'pop_lo', -19); q(W(46), 'ding', -17);
  q(T.cF[0] - 0.1, 'whoosh_long', -16); q(W(53) - 0.2, 'riser_short', -24); q(W(59), 'blip3', -19);
  q(T.cG[0], 'whoosh', -18); q(W(64), 'pop_lo', -19); q(W(70), 'scratch', -18); q(W(70) + 0.05, 'impact_soft', -19);
  [0, 1, 2, 3, 4, 5, 6].forEach(i => q(W(71) + 0.16 * i, 'tick', -21 + i)); q(W(73), 'ding', -16); q(W(73) + 0.05, 'clap', -19);
  q(T.cH[0], 'whoosh', -18); [0, 1, 2, 3, 4, 5].forEach(i => q(W(76) + 0.4 * i, 'glass_tap', -20)); q(W(83), 'ding', -15); q(W(83) + 0.05, 'clap2', -18);
  q(T.cI[0], 'whoosh', -18); q(W(86), 'pop', -19); q(W(87), 'shimmer', -21); q(W(89), 'tap', -14); q(W(89), 'pop', -17); q(W(92), 'blip', -19);
  q(T.end - 0.1, 'whoosh_long', -15); q(T.end + 0.2, 'shimmer', -19);
  [1, 2, 3].forEach(i => q(T.end + 0.6 + 0.22 * i, 'pop', -18));
  q(T.end + 1.45, 'impact_soft', -16); q(T.end + 1.5, 'applause', -15);
  window.CUES = C;
  window.TIMES = T;

  window.renderAt = function (t) {
    renderHook(t);
    renderCards(t);
    renderCaps(t);
  };
  window.READY = document.fonts.ready.then(() => true);
})();
