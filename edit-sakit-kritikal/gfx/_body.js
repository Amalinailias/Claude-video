
  // =====================================================================
  // HOOK — her pinch shot (tiny caption) → her own title reveal → our title takes over:
  //        shrinks on "bila kecil", grows big on "barulah nampak"
  // =====================================================================
  const HOOK = D.hook;
  const [A0, A1, B0, B1] = D.segH;
  const TA = D.mainStart;
  const TK = W(1) - 0.05;          // "kecil"
  const TS = W(9) + 0.06;          // "barulah"
  const TL = W(10) - 0.03;         // "nampak"
  const TOUT = W(14) - 0.35;
  const MT_TOP = window.MT_TOP || 786;
  add(`<div id="hook">
    <div id="fring"></div>
    <div id="speed" style="opacity:0"></div>
    <div id="mt" style="left:-13px;top:${MT_TOP}px"><div class="ty" style="font-size:118px;transform:scaleY(1.16);transform-origin:50% 0">PAMPASAN SAKIT</div><div class="ts" style="font-size:89px;margin-top:-13px;transform:scaleY(1.17);transform-origin:50% 0">KRITIKAL</div></div>
    <div id="hflash" class="abs" style="inset:0;background:radial-gradient(70% 40% at 50% 46%,rgba(255,244,214,.95),rgba(255,226,160,0) 70%)"></div>
  </div>`);
  const MT = $('mt');
  let MH = 0;

  function renderHook(t) {
    const hook = $('hook');
    if (t > TOUT + 0.5) { hook.style.display = 'none'; return; }
    hook.style.display = '';
    // shot A: breathing focus ring around the tiny caption between her fingers
    const fr = $('fring');
    if (show(fr, (t < A1 ? 1 : 0) * E.outCubic(P(t, 0.1, 0.35)))) {
      const k = 1 + 0.12 * Math.sin(t * 7);
      fr.style.transform = `translate(-50%,-50%) scale(${k.toFixed(4)})`;
    }
    // shot B: her own title types in — add speed lines + flash
    $('speed').style.opacity = (0.7 * bell(P(t, B0 - 0.05, 0.55)) + 0.75 * bell(P(t, TL - 0.08, 0.5))).toFixed(3);
    const f1 = t >= B0 + 0.3 ? 0.55 * Math.exp(-(t - B0 - 0.3) * 7) : 0;
    const f2 = t >= TL ? 0.7 * Math.exp(-(t - TL) * 6) : 0;
    $('hflash').style.opacity = (f1 + f2).toFixed(3);
    // our matched title takes over at the cut
    if (t < TA || t > TOUT + 0.4) { show(MT, 0); return; }
    if (!MH) { MT.style.display = ''; MH = MT.offsetHeight; }
    const cx0 = 527, cy0 = MT_TOP + MH / 2;
    const S0 = [cx0, cy0, 1], ST = [570, 1085, 0.17], SB = [540, 420, 1.28];
    let st, bl = 0;
    if (t < TK) st = S0;
    else if (t < TS) { const p = E.inOut(P(t, TK, 0.5)); st = S0.map((v, i) => lerp(v, ST[i], p)); bl = 6 * bell(p); }
    else { const p = E.outExpo(P(t, TS, TL - TS)); st = ST.map((v, i) => lerp(v, SB[i], p)); bl = 9 * (1 - p); st[2] *= 1 + 0.07 * bell(P(t, TL - 0.02, 0.3)); }
    const ex = E.inCubic(P(t, TOUT, 0.35));
    show(MT, 1 - ex);
    MT.style.transformOrigin = `${540 + 13}px ${MH / 2}px`;
    MT.style.transform = `translate(${(st[0] - cx0).toFixed(1)}px, ${(st[1] - cy0 - 60 * ex).toFixed(1)}px) scale(${(st[2] * (1 - 0.1 * ex)).toFixed(4)})`;
    const b2 = bl + 8 * ex;
    MT.style.filter = b2 > 0.05 ? `blur(${b2.toFixed(2)}px)` : 'none';
  }

  // =====================================================================
  // CARDS
  // =====================================================================
  // 1 — "Ramai sangka": medical card settles everything?
  add(`<div class="glass card" id="c1">
    <div class="kicker"><span class="ic">${RAW('credit-card')}</span>Ramai sangka…</div>
    <div style="display:flex;align-items:center;gap:34px;margin-top:22px">
      <div class="mcard" id="mc"><div class="chipz"></div><div class="nm">MEDICAL CARD</div><div class="no">•••• •••• •••• 2026</div></div>
      <div>
        <div class="ck" id="k1"><span class="ic" style="color:var(--olive)">${RAW('circle-check')}</span>Bil hospital</div>
        <div class="ck" id="k2"><span class="ic" style="color:var(--olive)">${RAW('circle-check')}</span>Settle semua?</div>
        <div class="ck" id="k3" style="margin-bottom:0"><span class="ic" style="color:var(--olive)">${RAW('circle-check')}</span>Bayar rawatan</div>
      </div>
    </div>
  </div>`);

  // 2 — "Tapi mereka lupa": in hospital vs after treatment
  add(`<div class="glass card" id="c2">
    <div class="kicker" style="color:var(--rose)"><span class="ic">${RAW('circle-x')}</span>Tapi mereka lupa</div>
    <div class="h1" id="c2t">KOS <em>SELEPAS</em> RAWATAN?</div>
    <div style="display:flex;align-items:stretch;gap:18px;margin-top:20px">
      <div class="phase" id="ph1"><span class="ic" style="color:var(--olive)">${RAW('hospital')}</span><div class="l">DALAM HOSPITAL</div>
        <div class="s" style="background:linear-gradient(135deg,#86A55A,#5E7F3A)">${IC('check')}Medical card</div></div>
      <div id="pharr" style="display:flex;align-items:center;width:54px;color:var(--amber)"><span class="ic" style="font-size:54px">${RAW('arrow-right')}</span></div>
      <div class="phase" id="ph2"><span class="ic" style="color:var(--rose)">${RAW('house')}</span><div class="l">SELEPAS RAWATAN</div>
        <div class="s" style="background:linear-gradient(135deg,#E08A99,#B9576A)">${IC('x')}Bayar sendiri</div></div>
    </div>
    <div class="row" style="margin-top:18px"><div class="chip amber" id="c2op" style="font-size:30px">${IC('receipt')}Outpatient: bayar dulu, claim kemudian</div></div>
  </div>`);

  // 3 — dialysis, cancer → money
  add(`<div class="glass card" id="c3">
    <div class="kicker"><span class="ic">${RAW('stethoscope')}</span>Contoh rawatan susulan</div>
    <div class="row" style="margin-top:22px;gap:16px">
      <div class="chip" id="c3a" style="font-size:38px">${IC('droplets')}Dialisis</div>
      <div class="chip" id="c3b" style="font-size:38px">${IC('ribbon')}Rawatan kanser</div>
    </div>
    <div id="c3c" style="display:flex;align-items:center;gap:18px;margin-top:22px">
      <span class="ic" style="font-size:84px;color:var(--olive)">${RAW('banknote')}</span><div class="bigq" style="text-align:left">= PERLUKAN <span style="color:var(--amber)">DUIT</span></div>
    </div>
  </div>`);

  // 4 — after treatment: recovery takes weeks → months
  add(`<div class="glass card" id="c4">
    <div class="kicker"><span class="ic">${RAW('heart-pulse')}</span>Selepas rawatan</div>
    <div class="sub" id="c4s" style="margin-top:12px;font-size:32px">Contoh: selepas <b style="color:var(--amber)">treatment</b>…</div>
    <div class="bigq" id="c4q" style="margin-top:8px;font-size:64px">MACAM MANA NAK <span style="color:var(--amber)">TERUS SIHAT?</span></div>
    <div class="tl" id="c4tl" style="height:170px;margin-top:22px">
      <div class="track" style="top:58px"><div class="fill" id="rfill" style="right:0"></div></div>
      <div class="pin" id="rp0" style="left:60px;top:16px;background:linear-gradient(135deg,#E08A99,#B9576A)">${RAW('activity')}</div>
      <div class="lab" style="left:0;margin-left:0;width:220px;text-align:left;top:124px" id="rl0">Rawatan</div>
      <div class="pin" id="rp1" style="left:42%;top:16px;background:linear-gradient(135deg,#F3B061,#C9772E)">${RAW('calendar-days')}</div>
      <div class="lab" id="rl1" style="left:42%;top:124px">Berminggu</div>
      <div class="pin" id="rp2" style="left:calc(100% - 60px);top:16px;background:linear-gradient(135deg,#86A55A,#5E7F3A)">${RAW('heart-pulse')}</div>
      <div class="lab" id="rl2" style="left:auto;right:0;margin-left:0;width:240px;text-align:right;top:124px">Berbulan → pulih</div>
    </div>
  </div>`);

  // 5 — during recovery: income drops
  add(`<div class="glass card" id="c5">
    <div class="kicker" style="color:var(--rose)"><span class="ic">${RAW('trending-up')}</span>Sepanjang tempoh pemulihan</div>
    <div class="chart" id="c5ch">
      <svg width="872" height="210" viewBox="0 0 872 210" style="position:absolute;inset:0">
        <text x="24" y="40" font-family="PJS" font-weight="800" font-size="24" fill="rgba(43,31,22,.6)">PENDAPATAN</text>
        <path id="inc" d="M24 80 L330 80 L420 82 C470 86 500 168 560 172 L848 176" fill="none" stroke="#B9576A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1100" stroke-dashoffset="1100"/>
        <circle id="incd" cx="848" cy="176" r="11" fill="#B9576A" opacity="0"/>
      </svg>
      <div class="abs" id="incl" style="right:24px;top:110px;font:400 44px/1 'Anton';color:var(--rose)">↓ JATUH</div>
    </div>
    <div class="row" style="margin-top:18px;gap:14px">
      <div class="chip rose" id="c5a" style="font-size:32px">${IC('briefcase')}Diberhentikan kerja</div>
      <div class="chip rose" id="c5b" style="font-size:32px">${IC('calendar-x')}Cuti tanpa gaji</div>
    </div>
  </div>`);

  // 6 — all of it costs money → top up with critical-illness compensation
  add(`<div class="glass card" id="c6">
    <div class="kicker"><span class="ic">${RAW('wallet')}</span>Semua perlukan kos</div>
    <div style="display:flex;align-items:flex-end;gap:26px;margin-top:20px">
      <div class="stack">
        <div class="blk" id="s1" style="background:linear-gradient(135deg,#E08A99,#B9576A)">${IC('stethoscope')}Rawatan susulan</div>
        <div class="blk" id="s2" style="background:linear-gradient(135deg,#E9A66F,#C9772E)">${IC('receipt')}Outpatient</div>
        <div class="blk" id="s3" style="background:linear-gradient(135deg,#B08A6A,#7A5A40)">${IC('briefcase')}Pendapatan hilang</div>
      </div>
      <div style="flex:1;text-align:center" id="c6r">
        <div style="font:800 26px/1 'PJS';color:var(--muted);letter-spacing:.12em">TOP UP DENGAN</div>
        <div class="ty" style="font-size:84px;margin-top:12px;filter:drop-shadow(4px 5px 0 #9E1B12) drop-shadow(0 8px 18px rgba(0,0,0,.25))">PAMPASAN SAKIT</div>
        <div class="ts" style="font-size:74px;color:#2B1F16;filter:drop-shadow(0 4px 0 rgba(255,255,255,.6))">KRITIKAL</div>
        <div class="chip olive" id="c6ok" style="font-size:28px;margin-top:14px">${IC('shield-check')}Bantu tampung kos</div>
      </div>
    </div>
  </div>`);

  // 7 — affordable: from RM100 vs hundreds of thousands coverage
  add(`<div class="glass card" id="c7">
    <div class="kicker"><span class="ic">${RAW('piggy-bank')}</span>Very affordable</div>
    <div class="h1" id="c7t">SANGAT <em>MAMPU MILIK</em></div>
    <div style="display:flex;align-items:flex-end;gap:22px;margin-top:16px;height:300px">
      <div class="price" id="pr1"><div class="pbar" id="pb1" style="height:44px;background:linear-gradient(180deg,#F3B061,#C9772E)"></div><div class="v">RM100*</div><div class="l">serendah<br>(premium)</div></div>
      <div style="font:400 64px/1 'Anton';color:var(--amber);padding-bottom:70px" id="prv">VS</div>
      <div class="price" id="pr2"><div class="pbar" id="pb2" style="height:190px;background:linear-gradient(180deg,#86A55A,#5E7F3A)"></div><div class="v">RATUSAN RIBU</div><div class="l">nilai perlindungan<br>(RM)</div></div>
    </div>
    <div class="foot" id="c7n">*Premium bergantung pada umur, kesihatan, pelan &amp; jumlah perlindungan. Tertakluk pada terma &amp; syarat.</div>
  </div>`);

  // 8 — CTA
  add(`<div class="glass card" id="c8">
    <div class="kicker"><span class="ic">${RAW('sparkles')}</span>Nak tahu lebih lanjut?</div>
    <div style="display:flex;align-items:center;gap:28px;margin-top:26px">
      <div class="avatar" id="av">${IC('briefcase')}</div>
      <div><div style="font:800 46px/1.1 'PJS'" id="nm">Naja’a Amalina binti Ilias</div><div style="margin-top:12px" id="rl"><span class="badge">AIA ADVISOR</span></div></div>
    </div>
    <div style="margin-top:32px;display:flex;align-items:center;gap:26px">
      <div class="btn" id="btn"><div class="ring" id="ring"></div>${IC('message-circle')}PM saya</div>
      <div id="arrow" style="width:66px;height:66px;color:var(--amber)">${RAW('chevrons-down')}</div>
    </div>
  </div>`);

  // end card
  add(`<div id="endc"><div id="endshade"></div>
    <div class="glass" id="endbox" style="top:400px">
      <div class="kicker" id="ek" style="justify-content:center"><span class="ic">${RAW('sparkles')}</span>Ringkasan</div>
      <div style="text-align:center;margin-top:16px" id="e1"><div class="ty" style="font-size:100px;display:inline-block">PAMPASAN SAKIT</div></div>
      <div style="text-align:center;margin-top:-4px" id="e2"><div class="ts" style="font-size:86px;color:#2B1F16;filter:none;display:inline-block">KRITIKAL</div></div>
      <div style="margin-top:30px">
        <div class="erow" id="er1"><div class="x">Kos selepas rawatan, bayar sendiri</div><div class="ck" id="ec1" style="margin:0">${IC('check')}</div></div>
        <div class="erow" id="er2"><div class="x">Pemulihan lama, pendapatan terjejas</div><div class="ck" id="ec2" style="margin:0">${IC('check')}</div></div>
        <div class="erow" id="er3"><div class="x">Pampasan bantu tampung kos</div><div class="ck" id="ec3" style="margin:0">${IC('check')}</div></div>
      </div>
      <div style="display:flex;justify-content:center;margin-top:26px"><div class="chip amber" id="e3" style="font-size:34px">${IC('message-circle')}Serendah RM100* · PM Naja’a</div></div>
      <div class="foot" id="e4" style="text-align:center;margin-top:14px">*Tertakluk pada umur, pelan, terma &amp; syarat polisi</div>
    </div></div>`);

  const T = {};
  T.land = TL;
  T.c1 = [W(14) - 0.05, W(27) - 0.12];
  T.c2 = [W(27) - 0.04, W(47) - 0.12];
  T.c3 = [W(47) - 0.04, W(54) - 0.12];
  T.c4 = [W(54) - 0.04, W(77) - 0.12];
  T.c5 = [W(77) - 0.04, W(92) - 0.12];
  T.c6 = [W(92) - 0.04, W(108) - 0.12];
  T.c7 = [W(108) - 0.04, W(122) - 0.12];
  T.c8 = [W(122) - 0.04, D.endStart - 0.05];
  T.topup = W(102) - 0.05;
  T.end = D.endStart;

  function renderCards(t) {
    if (ee($('c1'), t, T.c1[0], T.c1[1])) {
      pop($('mc'), t, W(17) - 0.1, { from: 0.6, rot: -8 });
      ee($('k1'), t, W(18) + 0.1, 1e9, { dy: 12 });
      ee($('k2'), t, W(20) - 0.05, 1e9, { dy: 12 });
      ee($('k3'), t, W(24) - 0.05, 1e9, { dy: 12 });
      const sh = bell(P(t, W(17), 1.2));
      $('mc').style.boxShadow = `0 16px 40px rgba(20,40,80,.35), 0 0 ${(40 * sh).toFixed(0)}px rgba(120,170,240,${(0.6 * sh).toFixed(2)})`;
    }
    if (ee($('c2'), t, T.c2[0], T.c2[1])) {
      ee($('c2t'), t, W(30) - 0.05, 1e9, { dy: 14, blur: 8 });
      pop($('ph1'), t, W(31) - 0.05, { from: 0.7 });
      ee($('pharr'), t, W(32), 1e9, { dy: 0, sc: 0, blur: 6 });
      pop($('ph2'), t, W(33) - 0.05, { from: 0.7 });
      const sb = bell(P(t, W(37) - 0.05, 0.6));
      $('ph2').style.boxShadow = sb > 0.01 ? `0 0 0 ${(4 * sb).toFixed(1)}px rgba(185,87,106,.6)` : 'none';
      pop($('c2op'), t, W(43) - 0.05, { from: 0.5 });
    }
    if (ee($('c3'), t, T.c3[0], T.c3[1])) {
      pop($('c3a'), t, W(48) - 0.05);
      pop($('c3b'), t, W(49) - 0.05);
      ee($('c3c'), t, W(52) - 0.05, 1e9, { dy: 16, blur: 10 });
      $('c3c').style.transform += ` scale(${(1 + 0.08 * bell(P(t, W(53) - 0.05, 0.4))).toFixed(4)})`;
    }
    if (ee($('c4'), t, T.c4[0], T.c4[1])) {
      ee($('c4s'), t, W(57) - 0.1, 1e9, { dy: 12, blur: 6 });
      ee($('c4q'), t, W(62) - 0.1, 1e9, { dy: 16, blur: 10 });
      ee($('c4tl'), t, W(68) - 0.1, 1e9, { dy: 14 });
      pop($('rp0'), t, W(68) - 0.05, { from: 0.4 }); ee($('rl0'), t, W(68), 1e9, { dy: 8, sc: 0 });
      $('rfill').style.transform = `scaleX(${E.inOut(P(t, W(68), W(75) - W(68) + 0.3)).toFixed(4)})`;
      pop($('rp1'), t, W(72) - 0.05, { from: 0.4 }); ee($('rl1'), t, W(72), 1e9, { dy: 8, sc: 0 });
      pop($('rp2'), t, W(69) - 0.05, { from: 0.4 }); ee($('rl2'), t, W(69), 1e9, { dy: 8, sc: 0 });
      const rb = bell(P(t, W(75) - 0.05, 0.6));
      $('rp2').style.transform += ` scale(${(1 + 0.25 * rb).toFixed(3)})`;
    }
    if (ee($('c5'), t, T.c5[0], T.c5[1])) {
      ee($('c5ch'), t, W(79) - 0.1, 1e9, { dy: 12 });
      $('inc').setAttribute('stroke-dashoffset', (1100 * (1 - E.inOut(P(t, W(80), W(84) - W(80) + 0.4)))).toFixed(1));
      $('incd').setAttribute('opacity', P(t, W(84), 0.2).toFixed(2));
      ee($('incl'), t, W(84) + 0.1, 1e9, { dy: -10, blur: 6, sc: 0 });
      pop($('c5a'), t, W(83) - 0.05, { from: 0.5 });
      pop($('c5b'), t, W(89) - 0.05, { from: 0.5 });
    }
    if (ee($('c6'), t, T.c6[0], T.c6[1])) {
      ['s1', 's2', 's3'].forEach((id, i) => ee($(id), t, W(93) + 0.35 * i, 1e9, { dy: -40, blur: 6, din: 0.4 }));
      ee($('c6r'), t, T.topup, 1e9, { dy: 30, sc: 0.2, blur: 12, din: 0.5 });
      pop($('c6ok'), t, W(107) - 0.05, { from: 0.4 });
      const sq = E.inOut(P(t, T.topup + 0.2, 0.5));
      ['s1', 's2', 's3'].forEach(id => { if (t > T.topup) $(id).style.filter = `saturate(${(1 - 0.6 * sq).toFixed(3)})`; });
    }
    if (ee($('c7'), t, T.c7[0], T.c7[1])) {
      ee($('c7t'), t, W(110) - 0.1, 1e9, { dy: 14, blur: 8 });
      pop($('pr1'), t, W(113) - 0.05, { from: 0.6 });
      $('pb1').style.transform = `scaleY(${E.outBack(P(t, W(115), 0.5)).toFixed(4)})`;
      ee($('prv'), t, W(116), 1e9, { dy: 0, blur: 6, sc: 0.3 });
      pop($('pr2'), t, W(117) - 0.05, { from: 0.6 });
      $('pb2').style.transform = `scaleY(${E.outCubic(P(t, W(119), 1.0)).toFixed(4)})`;
      ee($('c7n'), t, W(115) + 0.2, 1e9, { dy: 6, blur: 3, sc: 0 });
    }
    if (ee($('c8'), t, T.c8[0], T.c8[1])) {
      pop($('av'), t, W(123) - 0.05);
      ee($('nm'), t, W(123), 1e9, { dy: 14, blur: 10 });
      pop($('rl'), t, W(124), { from: 0.5 });
      if (pop($('btn'), t, W(129) - 0.05, { from: 0.5 })) {
        const r = ((t - W(129)) * 1.3) % 1;
        $('ring').style.transform = `scale(${(1 + 0.35 * r).toFixed(4)}, ${(1 + 0.6 * r).toFixed(4)})`;
        $('ring').style.opacity = (0.8 * (1 - r)).toFixed(3);
      }
      const ar = $('arrow');
      if (show(ar, P(t, W(132) - 0.1, 0.25))) ar.style.transform = `translateY(${(10 * Math.abs(Math.sin((t - W(132)) * 5))).toFixed(2)}px)`;
    }
    const ec = $('endc');
    if (t < T.end) { ec.style.display = 'none'; }
    else {
      ec.style.display = '';
      $('endshade').style.opacity = E.outCubic(P(t, T.end, 0.5)).toFixed(3);
      ee($('endbox'), t, T.end + 0.05, 1e9, { dy: 50, sc: 0.06, blur: 12 });
      ee($('ek'), t, T.end + 0.15, 1e9, { dy: 14 });
      pop($('e1'), t, T.end + 0.25, { from: 0.4 });
      ee($('e2'), t, T.end + 0.42, 1e9, { dy: 20, blur: 12 });
      [1, 2, 3].forEach(i => {
        ee($('er' + i), t, T.end + 0.5 + 0.22 * i, 1e9, { dy: 24 });
        pop($('ec' + i), t, T.end + 0.65 + 0.22 * i, { from: 0.2 });
      });
      pop($('e3'), t, T.end + 1.5, { from: 0.6 });
      ee($('e4'), t, T.end + 1.65, 1e9, { dy: 6, blur: 3 });
    }
  }
