
  // =====================================================================
  // HOOK — notification widgets + claim calculator
  // =====================================================================
  const HOOK = D.hook;
  add(`<div id="hook">
    <div id="hshade"></div>
    <div id="hstack" class="abs" style="left:0;top:0;width:1080px;height:1920px;transform:scale(.84);transform-origin:540px 0">
    <div class="glass notif" id="n1" style="top:220px">
      <div class="app" style="background:linear-gradient(135deg,#E08A99,#B9576A)">${RAW('ambulance')}</div>
      <div style="flex:1"><div class="meta"><span>Kemalangan</span><span>baru tadi</span></div><div class="msg">Hilang 1 ruas ibu jari kanan</div></div>
    </div>
    <div class="glass notif" id="n2" style="top:392px">
      <div class="app" style="background:linear-gradient(135deg,#F3B061,#C9772E)">${RAW('circle-help')}</div>
      <div style="flex:1"><div class="meta"><span>Soalan</span><span>sekarang</span></div><div class="msg">Boleh claim ke?</div></div>
    </div>
    <div class="glass" id="calc" style="top:562px">
      <div class="kicker" style="justify-content:center"><span class="ic">${RAW('calculator')}</span>Kalkulator pampasan</div>
      <div class="eq"><span class="chip amber" id="cq1" style="font-size:42px">15%</span><span id="cqx">×</span><span class="chip" id="cq2" style="font-size:42px">RM100,000*</span><span id="cqe">=</span></div>
      <div id="calcres">RM0</div>
    </div>
    <div class="glass" id="hban" style="top:1330px"><div class="t1">Tak perlu tunggu<br>hilang upaya <span class="s">100%<span class="strike" id="hstrike" style="left:-6px;right:-6px;top:48%"></span></span></div></div>
    </div>
    <div id="hnote">*Contoh ilustrasi. Pampasan sebenar tertakluk pada rider,<br>jumlah perlindungan &amp; terma polisi.</div>
    <div id="hflash" class="abs" style="inset:0;background:radial-gradient(60% 40% at 50% 45%,rgba(255,236,200,.95),rgba(255,210,150,0) 70%)"></div>
    <div id="hblack" class="abs" style="inset:0;background:#000"></div>
  </div>`);

  function renderHook(t) {
    const hook = $('hook');
    if (t >= HOOK + 0.02) { hook.style.display = 'none'; return; }
    hook.style.display = '';
    const reveal = E.inOut(P(t, HOOK - 0.5, 0.5));
    $('hshade').style.opacity = (1 - reveal).toFixed(3);
    $('hblack').style.opacity = (1 - E.outCubic(P(t, 0, 0.25))).toFixed(3);
    $('hflash').style.opacity = (0.5 * bell(P(t, 2.95, 0.35)) + 0.45 * bell(P(t, HOOK - 0.3, 0.4))).toFixed(3);
    const tOut = HOOK - 0.58;
    const dim = 1 - 0.3 * E.inOut(P(t, 1.4, 0.4));
    if (ee($('n1'), t, 0.15, tOut, { dy: -70, sc: 0.06, blur: 12, din: 0.5 })) { $('n1').style.opacity = (parseFloat($('n1').style.opacity) * dim).toFixed(3); }
    if (ee($('n2'), t, 0.8, tOut + 0.05, { dy: -70, sc: 0.06, blur: 12, din: 0.5 })) { $('n2').style.opacity = (parseFloat($('n2').style.opacity) * dim).toFixed(3); }
    ee($('hnote'), t, 1.5, tOut + 0.2, { dy: 8, blur: 4, sc: 0 });
    ee($('calc'), t, 1.4, tOut + 0.1, { dy: 50, sc: 0.12, blur: 14, din: 0.55 });
    pop($('cq1'), t, 1.65, { from: 0.4 });
    ee($('cqx'), t, 1.78, 1e9, { dy: 0, blur: 6, sc: 0 });
    pop($('cq2'), t, 1.9, { from: 0.4 });
    ee($('cqe'), t, 2.05, 1e9, { dy: 0, blur: 6, sc: 0 });
    const k = E.outExpo(P(t, 2.15, 0.85));
    $('calcres').innerHTML = 'RM' + fmt(Math.round(15000 * k / 10) * 10) + '<span style="font-size:64px;vertical-align:top">*</span>';
    const b = 1 + 0.12 * bell(P(t, 2.95, 0.35));
    $('calcres').style.transform = `scale(${b.toFixed(4)})`;
    ee($('hban'), t, 3.25, tOut + 0.15, { dy: 40, sc: 0.1, blur: 12, din: 0.45 });
    const st = E.outExpo(P(t, 3.55, 0.4));
    if (show($('hstrike'), st > 0 ? 1 : 0)) $('hstrike').style.transform = `scaleX(${st.toFixed(4)})`;
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
  T.cB = [W(6) - 0.02, W(20) - 0.12];
  T.cC = [W(20) - 0.04, W(24) - 0.12];
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
