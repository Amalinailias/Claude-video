
  // =====================================================================
  // HOOK — kinetic words + PANIC effects: busy notifications → siren → PANIK (shock lines, !!, sweat, ECG, glitch) → ???
  // =====================================================================
  const HOOK = D.hook;
  const HK_END = D.segments[0].out_out;
  const HC = [540, 840];                       // her head centre in the hook framing
  const NL = 18;
  const shockLines = Array.from({ length: NL }, (_, i) => {
    const a = (i / NL) * Math.PI * 2 + (i % 2 ? 0.08 : -0.05), r0 = 230 + (i % 3) * 14, r1 = r0 + 90 + (i % 4) * 22;
    return `<line x1="${(HC[0] + Math.cos(a) * r0).toFixed(1)}" y1="${(HC[1] + Math.sin(a) * r0).toFixed(1)}" x2="${(HC[0] + Math.cos(a) * r1).toFixed(1)}" y2="${(HC[1] + Math.sin(a) * r1).toFixed(1)}"/>`;
  }).join('');
  const QS = [[120, 760, -14], [880, 720, 12], [170, 1000, 8], [860, 990, -10], [70, 560, 4]];
  const NOTES = [['calendar', 'Meeting 9:00 AM', 600, 470, -4], ['message-circle', '12 mesej belum baca', 470, 560, 3], ['clock', 'Deadline hari ni!', 610, 650, -2]];
  add(`<div id="hk">
    <div id="redflash" style="opacity:0"></div>
    <svg id="shk" width="1080" height="1920" viewBox="0 0 1080 1920" style="position:absolute;inset:0;opacity:0"><g stroke="#1E1B22" stroke-width="10" stroke-linecap="round" style="filter:drop-shadow(0 0 3px rgba(255,255,255,.9))">${shockLines}</g></svg>
    <svg id="ecg" width="1080" height="200" viewBox="0 0 1080 200" style="position:absolute;left:0;top:1110px;opacity:0;overflow:visible">
      <path id="ecgp" d="M0 120 L250 120 L280 120 L300 60 L322 180 L345 20 L370 170 L392 120 L520 120 L545 120 L565 50 L588 185 L610 15 L636 175 L660 120 L790 120 L812 120 L832 55 L854 182 L877 18 L902 172 L925 120 L1080 120"
        fill="none" stroke="#FF3B4E" stroke-width="8" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="2400" stroke-dashoffset="2400" style="filter:drop-shadow(0 0 10px rgba(255,59,78,.9))"/></svg>
    ${NOTES.map((n, i) => `<div class="pill lt nt" id="nt${i}" style="position:absolute;left:${n[2]}px;top:${n[3]}px;font-size:26px;padding:12px 20px 12px 14px;background:#fff;box-shadow:0 10px 24px rgba(0,0,0,.2)">${IC(n[0])}${n[1]}</div>`).join('')}
    <div id="siren" class="abs" style="left:880px;top:200px;width:130px;height:130px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#fff;box-shadow:0 10px 26px rgba(0,0,0,.25)"><span style="width:84px;height:84px;color:#D7263D">${RAW('siren')}</span></div>
    <div class="kw" id="kw1"><span class="ic">${RAW('briefcase')}</span>BUSY</div>
    <div class="kw" id="kw2">PANIK</div>
    <div class="abs" id="ex" style="left:860px;top:405px;font:800 170px/1 'PJS';color:#FFD23A;-webkit-text-stroke:5px #1E1B22;letter-spacing:-.06em">!!</div>
    <div class="abs sw" id="sw1" style="left:300px;top:690px;width:96px;height:96px;color:#3AA0FF;filter:drop-shadow(0 4px 10px rgba(0,0,0,.35))">${RAW('droplet')}</div>
    <div class="abs sw" id="sw2" style="left:705px;top:670px;width:80px;height:80px;color:#3AA0FF;filter:drop-shadow(0 4px 10px rgba(0,0,0,.35))">${RAW('droplet')}</div>
    <div class="kw" id="kw3">tak tahu nak buat apa<span id="qm" style="display:inline-block">?</span></div>
    ${QS.map((q, i) => `<div class="abs qq" id="qq${i}" style="left:${q[0]}px;top:${q[1]}px;font:800 ${i === 4 ? 130 : 170}px/1 'PJS';color:${i % 2 ? '#FFD23A' : '#fff'};-webkit-text-stroke:5px #1E1B22;text-shadow:0 6px 20px rgba(0,0,0,.45)">?</div>`).join('')}
  </div>`);
  function renderHook(t) {
    const hk = $('hk');
    if (t > HK_END + 0.3) { hk.style.display = 'none'; return; }
    hk.style.display = '';
    const out = HK_END - 0.22, TP = W(12) - 0.05;
    pop($('kw1'), t, W(4) - 0.06, { from: 1.6, d: 0.35, tout: out, dout: 0.2 });
    // busy notifications pop in, then scatter on PANIK
    NOTES.forEach((n, i) => {
      const el = $('nt' + i);
      if (pop(el, t, W(4) + 0.18 + 0.22 * i, { from: 0.5, rot: n[4] * 2, d: 0.35 }) && t > TP) {
        const x = t - TP, dir = i % 2 ? 1 : -1;
        el.style.transform += ` translate(${(dir * 900 * x * x).toFixed(1)}px, ${(-200 * x + 1400 * x * x).toFixed(1)}px) rotate(${(dir * 160 * x).toFixed(1)}deg)`;
        el.style.opacity = (parseFloat(el.style.opacity) * Math.max(0, 1 - x * 1.6)).toFixed(3);
      } else if (t <= TP && t > W(4)) {
        el.style.transform += ` rotate(${n[4]}deg) translateY(${(4 * Math.sin(t * 3 + i)).toFixed(1)}px)`;
      }
    });
    // siren flashes from 'hospital'
    const sr = $('siren');
    if (pop(sr, t, W(10) - 0.05, { from: 0.3, rot: -20, d: 0.35, tout: out, dout: 0.2 })) {
      const on = Math.floor(t * 6) % 2;
      sr.style.boxShadow = `0 10px 26px rgba(0,0,0,.25), 0 0 ${on ? 60 : 30}px ${on ? 'rgba(255,40,60,.9)' : 'rgba(60,120,255,.9)'}`;
      sr.style.transform += ` rotate(${(10 * Math.sin(t * 20)).toFixed(1)}deg)`;
    }
    // PANIK: glitchy RGB-split word, shake, shock lines, !!, sweat, ECG, red pulses
    const k2 = pop($('kw2'), t, TP, { from: 2.4, d: 0.3, tout: out, dout: 0.2 });
    if (k2 && t > TP) {
      const x = t - TP, sh = 18 * Math.exp(-x * 5) * Math.sin(x * 62), g = Math.exp(-x * 3);
      $('kw2').style.transform += ` translateX(${sh.toFixed(1)}px)`;
      const j = (Math.sin(t * 91) * 8 * g).toFixed(1);
      $('kw2').style.textShadow = `${j}px 0 rgba(0,220,255,.85), ${-j}px 0 rgba(255,0,90,.85), 0 6px 26px rgba(0,0,0,.6)`;
    }
    const pulse = t >= TP ? (0.9 * Math.exp(-(t - TP) * 3.2) + 0.45 * bell(P(t, TP + 0.55, 0.35)) + 0.3 * bell(P(t, TP + 1.1, 0.35))) : 0;
    $('redflash').style.opacity = Math.min(1, pulse).toFixed(3);
    const sk = $('shk');
    if (show(sk, t >= TP && t < out + 0.1 ? 1 : 0)) {
      const x = t - TP, s = 0.8 + 0.25 * E.outBack(P(t, TP, 0.25)) + 0.04 * Math.sin(t * 40);
      sk.style.transformOrigin = `${HC[0]}px ${HC[1]}px`;
      sk.style.transform = `scale(${s.toFixed(4)}) rotate(${(3 * Math.sin(t * 13)).toFixed(2)}deg)`;
      sk.style.opacity = ((Math.floor(t * 14) % 3 ? 1 : 0.55) * Math.max(0.0, 1 - Math.max(0, x - 1.3) * 1.5)).toFixed(3);
    }
    if (pop($('ex'), t, TP + 0.08, { from: 2.0, rot: 18, d: 0.3, tout: out, dout: 0.2 })) $('ex').style.transform += ` rotate(${(8 * Math.sin(t * 24)).toFixed(1)}deg)`;
    ['sw1', 'sw2'].forEach((id, i) => {
      const el = $(id);
      if (pop(el, t, TP + 0.25 + 0.15 * i, { from: 0.4, d: 0.3, tout: out, dout: 0.2 })) el.style.transform += ` translateY(${(70 * P(t, TP + 0.4 + 0.15 * i, 1.4)).toFixed(1)}px)`;
    });
    const ecg = $('ecg');
    if (show(ecg, t >= TP - 0.05 && t < out + 0.15 ? 1 - E.inCubic(P(t, out, 0.2)) : 0))
      $('ecgp').setAttribute('stroke-dashoffset', (2400 * (1 - E.inOut(P(t, TP, 1.2)))).toFixed(1));
    // tak tahu nak buat apa → question marks everywhere
    ee($('kw3'), t, W(14) - 0.08, out, { dy: 26, blur: 12, din: 0.4, dout: 0.2 });
    const qb = bell(P(t, W(18) - 0.05, 0.45));
    $('qm').style.transform = `translateY(${(-26 * qb).toFixed(1)}px) rotate(${(14 * qb).toFixed(1)}deg)`;
    QS.forEach((q, i) => {
      const el = $('qq' + i), t0 = W(15) + 0.16 * i;
      if (pop(el, t, t0, { from: 0.2, rot: q[2] * 3, d: 0.35, tout: out, dout: 0.2 }))
        el.style.transform += ` rotate(${q[2]}deg) translateY(${(10 * Math.sin((t - t0) * 6 + i)).toFixed(1)}px)`;
    });
  }

  // =====================================================================
  // CARDS
  // =====================================================================
  add(`<div id="c1" class="abs" style="left:60px;right:60px;top:200px">
    <div class="wk" style="color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.4)"><span class="ic">${RAW('message-circle-question')}</span>Pernah dengar?</div>
    <div style="margin-top:18px"><div class="bub" id="c1q">“Busy… panik… tak tahu<br>nak buat apa.”</div></div>
    <div style="margin-top:22px"><span class="pill ok" id="c1ok">${IC('circle-check')}Jangan risau</span></div>
  </div>`);

  add(`<div id="c2" class="abs" style="left:60px;right:60px;top:160px">
    <div style="display:flex;align-items:flex-end;gap:24px">
      <div id="c2n" style="font:italic 400 330px/0.78 'ISerif';color:#fff;text-shadow:0 10px 30px rgba(0,0,0,.55)">3</div>
      <div id="c2t" style="padding-bottom:22px;color:#fff;text-shadow:0 3px 14px rgba(0,0,0,.8),0 1px 3px rgba(0,0,0,.8)">
        <div style="font:800 76px/0.95 'PJS';letter-spacing:-.03em">TIPS</div>
        <div style="font:italic 400 52px/1.05 'ISerif'">sebelum masuk<br>hospital</div>
      </div>
    </div>
    <div class="row" style="margin-top:18px;gap:12px">${[1, 2, 3].map(i => `<span class="pill lt" id="d${i}" style="font-size:28px;padding:10px 20px">0${i}</span>`).join('')}</div>
  </div>`);

  add(`<div class="wc" id="t1">
    <div style="display:flex;align-items:center;gap:20px"><span class="badge2" id="t1n">01</span><div class="wt" style="margin:0">Semak polisi <em>bersama ejen</em></div></div>
    <div class="rowi" id="t1a"><span class="ic">${RAW('receipt')}</span><div class="tx">Status bayaran<small>Premium dah dibayar? Polisi aktif?</small></div><span class="stamp2" id="t1as">AKTIF ✓</span></div>
    <div class="rowi" id="t1b"><span class="ic">${RAW('hourglass')}</span><div class="tx">Waiting period<small>Dah lepas tempoh menunggu?</small><div class="prog"><i id="t1bp" style="width:0%"></i></div></div><span class="stamp2" id="t1bs">LEPAS ✓</span></div>
  </div>`);

  add(`<div class="chat" id="t2">
    <div class="hd"><div class="av">${IC('user-round')}</div><div><div class="nm">Ejen anda</div><div class="st">● online</div></div>
      <div style="margin-left:auto;display:flex;align-items:center;gap:10px"><span class="badge2" style="width:64px;height:64px;font-size:30px">02</span></div></div>
    <div class="bd">
      <div class="msg me" id="m1">Saya nak masuk hospital.<br><span class="q" id="q1">Emergensi</span><span class="q" id="q2">Ward biasa</span></div>
      <div class="msg me" id="m2">Doktor pakar: <b id="m2v"></b></div>
      <div class="msg me" id="m3">Hospital: <b id="m3v"></b></div>
      <div class="typing" id="ty"><i></i><i></i><i></i></div>
      <div class="msg ag" id="m4">Baik, saya bantu hubungi pihak hospital sekarang ✓</div>
    </div>
  </div>`);

  // PiP infographic for tip 3 (background is drawn in the 'behind' pass; the compositor shrinks the video into a card)
  add(`<div id="pipbg" class="behindonly"><div class="dots"></div></div>`);
  add(`<div id="t3">
    <div class="abs" style="left:70px;top:170px;width:940px;color:var(--ink)">
      <div style="display:flex;align-items:center;gap:20px"><span class="badge2">03</span><div class="wt" style="margin:0">Permohonan <em>GL</em></div></div>
      <div style="font:600 30px/1.2 'PJS';color:rgba(30,27,34,.6);margin-top:10px">Guarantee Letter = surat jaminan bayaran kepada hospital</div>
    </div>
    <div class="flow" id="fl">
      <div class="conn" id="cn1" style="top:94px;height:64px"></div><div class="conn" id="cn2" style="top:246px;height:64px"></div><div class="conn" id="cn3" style="top:398px;height:64px"></div>
      <div class="step" id="s1"><span class="si">${IC('stethoscope')}</span><div class="sx">Doktor pakar periksa</div></div>
      <div class="step" id="s2"><span class="si">${IC('file-text')}</span><div class="sx">Laporan perubatan</div></div>
      <div class="step" id="s3"><span class="si">${IC('building-2')}</span><div class="sx">Syarikat insurans nilai</div></div>
      <div class="step" id="s4"><span class="si">${IC('badge-check')}</span><div class="sx">GL diluluskan</div></div>
    </div>
    <div class="abs" id="tmr" style="left:70px;top:1150px;display:flex;align-items:center;gap:24px;color:var(--ink)">
      <svg width="150" height="150" viewBox="0 0 150 150" style="flex:none"><circle cx="75" cy="75" r="62" stroke="rgba(30,27,34,.1)" stroke-width="14" fill="none"/>
        <circle id="tring" cx="75" cy="75" r="62" stroke="#D7263D" stroke-width="14" fill="none" stroke-linecap="round" stroke-dasharray="389.6" stroke-dashoffset="389.6" transform="rotate(-90 75 75)"/></svg>
      <div><div style="font:800 24px/1 'PJS';letter-spacing:.2em;color:var(--cr)">KEBIASAANNYA</div><div style="font:800 92px/1 'PJS';letter-spacing:-.04em">2–3 jam</div></div>
    </div>
  </div>`);

  add(`<div id="full2"><div class="a" id="fa2">Sebab itu…</div><div class="b" id="fb2">PENTING</div></div>`);

  add(`<div class="wc" id="k1">
    <div class="wk"><span class="ic">${RAW('heart-handshake')}</span>Pilih ejen yang</div>
    <div class="vs2">
      <div class="col bad" id="vb"><span class="ic" style="color:#B5AEA8">${RAW('x')}</span><div class="tx" style="text-decoration:line-through;text-decoration-thickness:4px">Hanya tahu jual polisi</div></div>
      <div class="col good" id="vg"><span class="ic">${RAW('circle-check')}</span><div class="tx">Bantu ketika anda memerlukan</div></div>
    </div>
  </div>`);

  add(`<div id="cta" class="abs" style="left:0;right:0;top:260px;display:flex;flex-direction:column;align-items:center">
    <div style="display:flex;gap:60px">
      <div class="rb" id="rb1"><div class="rip" id="rp1"></div>${IC('send')}Share</div>
      <div class="rb" id="rb2"><div class="rip" id="rp2"></div>${IC('bookmark')}Save</div>
    </div>
    <div id="ctat" style="margin-top:26px;font:italic 400 64px/1 'ISerif';color:#fff;text-shadow:0 3px 14px rgba(0,0,0,.85),0 1px 3px rgba(0,0,0,.9)">untuk masa hadapan</div>
  </div>`);

  const T = {};
  T.hk = HK_END;
  T.c1 = [W(19) - 0.04, W(27) - 0.12];
  T.c2 = [W(27) - 0.04, W(39) - 0.05];
  T.pull = [W(39) - 0.1, W(40) - 0.05];          // she pulls the camera closer: no card, just the move
  T.t1 = [W(40) - 0.02, W(52) - 0.1];
  T.t2 = [W(52) - 0.06, W(83) - 0.1];
  T.pip = [W(83) - 0.1, W(114) - 0.2];            // tip 3: video shrinks into a card
  T.t3 = [W(83) + 0.15, W(114) - 0.3];
  T.f2 = [W(114) - 0.15, W(117) - 0.05];          // full-screen 'Sebab itu… PENTING' (hides the camera reach)
  T.k1 = [W(117) - 0.1, W(133) - 0.1];
  T.cta = [W(133) - 0.06, D.total + 1];
  T.end = D.endStart;

  function renderCards(t) {
    if (ee($('c1'), t, T.c1[0], T.c1[1], { dy: 30 })) {
      pop($('c1q'), t, T.c1[0], { from: 0.6, rot: -3 });
      pop($('c1ok'), t, W(25) - 0.05, { from: 0.4 });
    }
    if (ee($('c2'), t, T.c2[0], T.c2[1], { dy: 20, dout: 0.18 })) {
      const n = $('c2n'), a = P(t, W(29) - 0.08, 0.45);
      if (show(n, clamp(a * 4))) n.style.transform = `scale(${lerp(2.2, 1, E.outBack(a)).toFixed(4)})`;
      ee($('c2t'), t, W(30) - 0.05, 1e9, { dy: 0, sc: 0, blur: 8 });
      [1, 2, 3].forEach(i => pop($('d' + i), t, W(35) + 0.12 * (i - 1), { from: 0.4 }));
    }
    if (ee($('t1'), t, T.t1[0], T.t1[1])) {
      pop($('t1n'), t, T.t1[0], { from: 2.0, rot: -20, d: 0.45 });
      ee($('t1a'), t, W(46) - 0.1, 1e9, { dy: 18 });
      pop($('t1as'), t, W(47) + 0.1, { from: 1.8, rot: -18, d: 0.35 });
      ee($('t1b'), t, W(50) - 0.1, 1e9, { dy: 18 });
      $('t1bp').style.width = (100 * E.inOut(P(t, W(50), 0.8))).toFixed(1) + '%';
      pop($('t1bs'), t, W(51) + 0.35, { from: 1.8, rot: -18, d: 0.35 });
    }
    if (ee($('t2'), t, T.t2[0], T.t2[1], { dy: 40 })) {
      ee($('m1'), t, W(54) - 0.05, 1e9, { dy: 20, sc: 0.1 });
      $('q1').classList.toggle('on', t > W(64) && t < W(66) - 0.05);
      $('q2').classList.toggle('on', t > W(66) - 0.05);
      ee($('m2'), t, W(68) - 0.05, 1e9, { dy: 20, sc: 0.1 });
      const d1 = 'Dr. ________';
      $('m2v').textContent = d1.slice(0, Math.floor(d1.length * P(t, W(69), 0.5)));
      ee($('m3'), t, W(71) - 0.05, 1e9, { dy: 20, sc: 0.1 });
      const d2 = 'Hospital ______';
      $('m3v').textContent = d2.slice(0, Math.floor(d2.length * P(t, W(72), 0.5)));
      const ty = $('ty');
      if (show(ty, t > W(74) - 0.3 && t < W(77) ? 1 : 0)) ty.querySelectorAll('i').forEach((d, i) => { d.style.transform = `translateY(${(-8 * Math.max(0, Math.sin(t * 9 - i * 0.9))).toFixed(1)}px)`; });
      ee($('m4'), t, W(77), 1e9, { dy: 20, sc: 0.1 });
    }
    const t3 = $('t3');
    $('pipbg').style.display = (t >= T.pip[0] - 0.02 && t <= T.pip[1] + 0.5) ? '' : 'none';
    if (ee(t3, t, T.t3[0], T.t3[1], { dy: 0, sc: 0, blur: 6 })) {
      const steps = [['s1', W(87)], ['s2', W(91)], ['s3', W(93)], ['s4', W(101)]];
      steps.forEach(([id, ts], i) => {
        ee($(id), t, ts - 0.1, 1e9, { dy: 24, blur: 6 });
        $(id).classList.toggle('done', i === 3 && t > ts);
        if (i) $('cn' + i).style.transform = `scaleY(${E.inOut(P(t, ts - 0.35, 0.3)).toFixed(4)})`;
      });
      ee($('tmr'), t, W(104) - 0.1, 1e9, { dy: 20 });
      $('tring').setAttribute('stroke-dashoffset', (389.6 * (1 - E.inOut(P(t, W(105), W(113) - W(105) + 0.2)))).toFixed(1));
    }
    const f = $('full2');
    if (show(f, t >= T.f2[0] && t < T.f2[1] ? 1 : 0)) {
      const inn = E.outExpo(P(t, T.f2[0], 0.2)), out = E.inCubic(P(t, T.f2[1] - 0.16, 0.16));
      f.style.clipPath = `circle(${(150 * inn).toFixed(1)}% at 50% 50%)`;
      f.style.opacity = (1 - out).toFixed(3);
      ee($('fa2'), t, T.f2[0] + 0.05, 1e9, { dy: 20, blur: 10 });
      pop($('fb2'), t, W(116) - 0.08, { from: 1.8, d: 0.35 });
    }
    if (ee($('k1'), t, T.k1[0], T.k1[1])) {
      ee($('vb'), t, W(123) - 0.1, 1e9, { dy: 20 });
      pop($('vg'), t, W(128) - 0.05, { from: 0.5 });
      const g = bell(P(t, W(131), 0.8));
      $('vg').style.boxShadow = `0 14px 30px rgba(215,38,61,.35), 0 0 ${(40 * g).toFixed(0)}px rgba(240,86,106,${(0.7 * g).toFixed(2)})`;
    }
    if (ee($('cta'), t, T.cta[0], T.cta[1], { dy: 30 })) {
      [['rb1', 'rp1', W(133)], ['rb2', 'rp2', W(135)]].forEach(([b, r, ts]) => {
        pop($(b), t, ts - 0.15, { from: 0.4 });
        const k = P(t, ts + 0.05, 0.6);
        $(b).style.transform += ` scale(${(1 - 0.12 * bell(P(t, ts, 0.25))).toFixed(3)})`;
        $(r).style.transform = `scale(${(1 + 0.6 * k).toFixed(3)})`; $(r).style.opacity = (k > 0 && k < 1 ? 0.9 * (1 - k) : 0).toFixed(3);
      });
      ee($('ctat'), t, W(137) - 0.1, 1e9, { dy: 16, blur: 8 });
    }
  }
