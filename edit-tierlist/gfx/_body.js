
  // =====================================================================
  // HOOK — minimalist tier list: awareness of medical card / hibah vs critical illness
  // =====================================================================
  const HOOK = D.hook;
  const ROWY = [690, 850, 1010, 1170, 1330];
  const TIERS = [['S', '#EBA3A0'], ['A', '#F2C38E'], ['B', '#F3DE8E'], ['C', '#BBD89E'], ['D', '#A2C6E2']];
  const T_DROP = 1.42, T_LAND = 1.86;                // critical-illness chip falls to D
  const T_OUT = W(5) - 0.12;                          // "Bila": zoom out of the tier list
  add(`<div id="tier">
    <div class="tk" id="tk">TIER LIST</div>
    <div class="tt" id="tt">Awareness orang ramai</div>
    <div class="ts2" id="ts2">tentang perlindungan diri</div>
    ${TIERS.map((r, i) => `<div class="trw" id="tr${i}" style="top:${ROWY[i]}px"><div class="lb" style="background:${r[1]}">${r[0]}</div><div class="tr2">${i === 0 ? '<div class="note" id="n0">TINGGI</div>' : ''}${i === 4 ? '<div class="note" id="n4" style="color:var(--rose)">SANGAT SIKIT</div>' : ''}</div></div>`).join('')}
    <div class="ti" id="tiM" style="left:262px;top:${ROWY[0] + 32}px"><span class="ic" style="color:#3E6FA8">${RAW('credit-card')}</span>Medical card</div>
    <div class="ti" id="tiH" style="left:262px;top:${ROWY[1] + 32}px"><span class="ic" style="color:var(--olive)">${RAW('hand-coins')}</span>Hibah</div>
    <div class="ti" id="tiC" style="left:262px;top:${ROWY[4] + 32}px"><span class="ic" style="color:var(--rose)">${RAW('heart-pulse')}</span>Pampasan sakit kritikal</div>
  </div>`);
  // text behind the subject (rendered in its own pass, person matte composited over it)
  add(`<div class="bt" id="bt" style="top:560px"><div id="bt1">SAKIT</div><div id="bt2">KRITIKAL</div></div>`);
  const BT_SMALL = W(6) - 0.1, BT_BIG = W(14) + 0.02, BT_LAND = W(15) - 0.02, BT_OUT = W(16) - 0.3;

  function renderHook(t) {
    const tier = $('tier');
    if (t > T_OUT + 0.45) { tier.style.display = 'none'; }
    else {
      tier.style.display = '';
      ee($('tk'), t, 0.05, 1e9, { dy: 12 });
      ee($('tt'), t, 0.1, 1e9, { dy: 20, blur: 10 });
      ee($('ts2'), t, 0.2, 1e9, { dy: 10 });
      TIERS.forEach((r, i) => {
        const el = $('tr' + i), a = E.outExpo(P(t, 0.12 + 0.06 * i, 0.5));
        show(el, a); el.style.transform = `translateX(${(-60 * (1 - a)).toFixed(1)}px)`;
      });
      pop($('tiM'), t, 0.45, { from: 0.5, rot: -6 });
      pop($('tiH'), t, 0.8, { from: 0.5, rot: 6 });
      ee($('n0'), t, 1.0, 1e9, { dy: 0, sc: 0, blur: 4 });
      // the critical-illness chip: appears high, hesitates, then drops all the way to D
      const c = $('tiC');
      if (show(c, E.outCubic(P(t, 1.05, 0.2)))) {
        const startY = 600 - (ROWY[4] + 32);                    // hovers just under the title, relative to its D-row home
        let y;
        if (t < T_DROP) y = startY + 8 * Math.sin(t * 22) * P(t, 1.15, 0.2);
        else { const p = P(t, T_DROP, T_LAND - T_DROP); y = startY * (1 - p * p); }
        const bounce = t > T_LAND ? -18 * Math.exp(-(t - T_LAND) * 9) * Math.abs(Math.sin((t - T_LAND) * 18)) : 0;
        const rot = t < T_LAND ? (t < T_DROP ? 3 * Math.sin(t * 20) : -4) : 0;
        c.style.transform = `translateY(${(y + bounce).toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
        const gl = bell(P(t, W(2) - 0.05, W(4) - W(2) + 0.5));
        c.style.boxShadow = `0 10px 28px rgba(70,38,12,.14), 0 0 0 ${(5 * gl).toFixed(1)}px rgba(185,87,106,${(0.5 * gl).toFixed(2)})`;
      }
      ee($('n4'), t, T_LAND + 0.1, 1e9, { dy: 0, sc: 0, blur: 4 });
      // exit: push into the D chip, fade to the footage
      const ex = E.inCubic(P(t, T_OUT, 0.4));
      tier.style.opacity = (1 - ex).toFixed(3);
      tier.style.transform = `scale(${(1 + 0.6 * ex).toFixed(4)})`;
      tier.style.transformOrigin = '420px 1400px';
      tier.style.filter = ex > 0.01 ? `blur(${(10 * ex).toFixed(2)}px)` : 'none';
    }
    // text behind subject: small on "kecil", huge on "barulah nampak"
    const bt = $('bt');
    if (t < BT_SMALL || t > BT_OUT + 0.4) { bt.style.display = 'none'; }
    else {
      bt.style.display = '';
      const a = E.outCubic(P(t, BT_SMALL, 0.3));
      const g = E.outExpo(P(t, BT_BIG, BT_LAND - BT_BIG));
      const s = lerp(0.22, 1, g) * (1 + 0.05 * bell(P(t, BT_LAND - 0.02, 0.3)));
      const ex = E.inCubic(P(t, BT_OUT, 0.35));
      bt.style.opacity = (a * (1 - ex)).toFixed(3);
      bt.style.transformOrigin = '540px 200px';
      bt.style.transform = `translateY(${(-40 * ex).toFixed(1)}px) scale(${(s * (1 + 0.08 * ex)).toFixed(4)})`;
    }
  }

  // =====================================================================
  // CARDS — minimalist glass
  // =====================================================================
  add(`<div class="glass card" id="c1">
    <div class="kicker"><span class="ic">${RAW('credit-card')}</span>Ramai sangka</div>
    <div class="mq">Ada medical card <em>= settle semua?</em></div>
  </div>`);

  add(`<div id="yel"><div class="y1" id="y1">TAPI<br>MEREKA<br>LUPA…</div></div>`);

  add(`<div class="glass card" id="c2">
    <div class="kicker" style="color:var(--rose)"><span class="ic">${RAW('house')}</span>Selepas rawatan</div>
    <div class="mq">Kos rawatan susulan</div>
    <div class="row" style="margin-top:20px"><div class="chip rose" id="c2x" style="font-size:34px">${IC('x')}Bayar sendiri</div></div>
  </div>`);

  add(`<div class="glass card" id="c3">
    <div class="kicker"><span class="ic">${RAW('stethoscope')}</span>Contoh</div>
    <div class="row" style="margin-top:20px;gap:14px">
      <div class="chip" id="c3a" style="font-size:36px">${IC('droplets')}Dialisis</div>
      <div class="chip" id="c3b" style="font-size:36px">${IC('ribbon')}Kanser</div>
      <div class="chip amber" id="c3c" style="font-size:36px">${IC('banknote')}= Perlukan duit</div>
    </div>
  </div>`);

  add(`<div class="glass card" id="c4">
    <div class="kicker"><span class="ic">${RAW('heart-pulse')}</span>Selepas treatment</div>
    <div class="mq">Macam mana nak <em>terus sihat?</em></div>
  </div>`);

  add(`<div class="glass card" id="c5">
    <div class="kicker" style="color:var(--rose)"><span class="ic">${RAW('briefcase')}</span>Sepanjang pemulihan</div>
    <div class="chart" id="c5ch" style="height:180px">
      <svg width="872" height="180" viewBox="0 0 872 180" style="position:absolute;inset:0">
        <text x="24" y="38" font-family="PJS" font-weight="800" font-size="22" fill="rgba(43,31,22,.55)">PENDAPATAN</text>
        <path id="inc" d="M24 70 L360 70 C440 72 470 146 540 150 L848 152" fill="none" stroke="#B9576A" stroke-width="7" stroke-linecap="round" stroke-dasharray="1000" stroke-dashoffset="1000"/>
      </svg>
      <div class="abs" id="incl" style="right:24px;top:84px;font:800 30px/1 'PJS';color:var(--rose)">Diberhentikan kerja</div>
    </div>
  </div>`);

  add(`<div class="glass card" id="c6">
    <div class="kicker"><span class="ic">${RAW('shield-check')}</span>Penyelesaian</div>
    <div class="mq">Top up dengan<br><em>pampasan sakit kritikal</em></div>
  </div>`);

  add(`<div class="glass card" id="c7">
    <div class="kicker"><span class="ic">${RAW('piggy-bank')}</span>Mampu milik</div>
    <div style="display:flex;align-items:flex-end;gap:24px;margin-top:18px;height:250px">
      <div class="price" id="pr1" style="width:330px"><div class="pbar" id="pb1" style="height:36px;background:linear-gradient(180deg,#F3B061,#C9772E)"></div><div class="v" style="font:800 54px/1 'PJS'">RM100*</div><div class="l">serendah</div></div>
      <div class="price" id="pr2" style="width:470px"><div class="pbar" id="pb2" style="height:150px;background:linear-gradient(180deg,#86A55A,#5E7F3A)"></div><div class="v" style="font:800 48px/1 'PJS'">Beratus ribu</div><div class="l">nilai perlindungan</div></div>
    </div>
    <div class="foot" id="c7n">*Premium bergantung pada umur, kesihatan, pelan &amp; jumlah perlindungan. Tertakluk pada terma &amp; syarat.</div>
  </div>`);

  add(`<div class="glass card" id="c8">
    <div class="kicker"><span class="ic">${RAW('sparkles')}</span>Nak tahu lebih lanjut?</div>
    <div style="display:flex;align-items:center;gap:28px;margin-top:24px">
      <div class="avatar" id="av">${IC('briefcase')}</div>
      <div><div style="font:800 46px/1.1 'PJS'" id="nm">Naja’a Amalina binti Ilias</div><div style="margin-top:12px" id="rl"><span class="badge">AIA ADVISOR</span></div></div>
    </div>
    <div style="margin-top:30px;display:flex;align-items:center;gap:26px">
      <div class="btn" id="btn"><div class="ring" id="ring"></div>${IC('message-circle')}PM saya</div>
      <div id="arrow" style="width:66px;height:66px;color:var(--amber)">${RAW('chevrons-down')}</div>
    </div>
  </div>`);

  add(`<div id="endc"><div id="endshade"></div>
    <div class="glass" id="endbox" style="top:470px">
      <div class="kicker" id="ek" style="justify-content:center"><span class="ic">${RAW('sparkles')}</span>Ringkasan</div>
      <div id="e1" style="text-align:center;font:italic 400 92px/1 'ISerif';margin-top:18px">Pampasan sakit kritikal</div>
      <div style="margin-top:30px">
        <div class="erow" id="er1"><div class="x">Medical card tak tanggung kos susulan</div><div class="ck" id="ec1" style="margin:0">${IC('check')}</div></div>
        <div class="erow" id="er2"><div class="x">Bantu tampung kos &amp; pendapatan</div><div class="ck" id="ec2" style="margin:0">${IC('check')}</div></div>
        <div class="erow" id="er3"><div class="x">Serendah RM100*</div><div class="ck" id="ec3" style="margin:0">${IC('check')}</div></div>
      </div>
      <div style="display:flex;justify-content:center;margin-top:24px"><div class="chip amber" id="e3" style="font-size:34px">${IC('message-circle')}PM Naja’a · AIA Advisor</div></div>
    </div></div>`);

  const T = {};
  T.tierOut = T_OUT; T.land = BT_LAND;
  T.c1 = [W(16) - 0.04, W(27) - 0.1];
  T.yel = [W(27) - 0.04, W(29) + 0.38];
  T.c2 = [W(30) - 0.1, W(38) - 0.12];
  T.c3 = [W(38) - 0.04, W(45) - 0.12];
  T.c4 = [W(45) - 0.04, W(56) - 0.12];
  T.c5 = [W(56) - 0.04, W(64) - 0.12];
  T.c6 = [W(64) - 0.04, W(74) - 0.12];
  T.c7 = [W(74) - 0.04, W(83) - 0.12];
  T.c8 = [W(83) - 0.04, D.endStart - 0.05];
  T.end = D.endStart;

  function renderCards(t) {
    ee($('c1'), t, T.c1[0], T.c1[1]);
    // yellow full-screen bold text
    const y = $('yel');
    const yin = E.outExpo(P(t, T.yel[0], 0.18)), yout = E.inCubic(P(t, T.yel[1], 0.2));
    if (show(y, (t >= T.yel[0] && t < T.yel[1] + 0.2) ? 1 : 0)) {
      y.style.clipPath = `inset(${((1 - yin) * 100).toFixed(2)}% 0 0 0)`;
      y.style.transform = `translateY(${(-1920 * yout).toFixed(1)}px)`;
      const sh = 10 * Math.exp(-(t - T.yel[0]) * 8) * Math.sin((t - T.yel[0]) * 60);
      $('y1').style.transform = `translateX(${sh.toFixed(1)}px)`;
    }
    if (ee($('c2'), t, T.c2[0], T.c2[1])) pop($('c2x'), t, W(36) - 0.05, { from: 0.4 });
    if (ee($('c3'), t, T.c3[0], T.c3[1])) {
      pop($('c3a'), t, W(39) - 0.05); pop($('c3b'), t, W(40) - 0.05); pop($('c3c'), t, W(44) - 0.1, { from: 0.4 });
    }
    ee($('c4'), t, T.c4[0], T.c4[1]);
    if (ee($('c5'), t, T.c5[0], T.c5[1])) {
      $('inc').setAttribute('stroke-dashoffset', (1000 * (1 - E.inOut(P(t, W(58), W(63) - W(58) + 0.3)))).toFixed(1));
      ee($('incl'), t, W(62) - 0.05, 1e9, { dy: -8, blur: 6, sc: 0 });
    }
    ee($('c6'), t, T.c6[0], T.c6[1]);
    if (ee($('c7'), t, T.c7[0], T.c7[1])) {
      pop($('pr1'), t, W(75) - 0.05, { from: 0.6 });
      $('pb1').style.transform = `scaleY(${E.outBack(P(t, W(76), 0.5)).toFixed(4)})`;
      pop($('pr2'), t, W(78) - 0.05, { from: 0.6 });
      $('pb2').style.transform = `scaleY(${E.outCubic(P(t, W(80), 0.9)).toFixed(4)})`;
      ee($('c7n'), t, W(76) + 0.2, 1e9, { dy: 6, blur: 3, sc: 0 });
    }
    if (ee($('c8'), t, T.c8[0], T.c8[1])) {
      pop($('av'), t, W(84) - 0.05);
      ee($('nm'), t, W(84), 1e9, { dy: 14, blur: 10 });
      pop($('rl'), t, W(85), { from: 0.5 });
      if (pop($('btn'), t, W(90) - 0.05, { from: 0.5 })) {
        const r = ((t - W(90)) * 1.3) % 1;
        $('ring').style.transform = `scale(${(1 + 0.35 * r).toFixed(4)}, ${(1 + 0.6 * r).toFixed(4)})`;
        $('ring').style.opacity = (0.8 * (1 - r)).toFixed(3);
      }
      const ar = $('arrow');
      if (show(ar, P(t, W(93) - 0.1, 0.25))) ar.style.transform = `translateY(${(10 * Math.abs(Math.sin((t - W(93)) * 5))).toFixed(2)}px)`;
    }
    const ec = $('endc');
    if (t < T.end) { ec.style.display = 'none'; }
    else {
      ec.style.display = '';
      $('endshade').style.opacity = E.outCubic(P(t, T.end, 0.5)).toFixed(3);
      ee($('endbox'), t, T.end + 0.05, 1e9, { dy: 50, sc: 0.06, blur: 12 });
      ee($('ek'), t, T.end + 0.15, 1e9, { dy: 14 });
      ee($('e1'), t, T.end + 0.25, 1e9, { dy: 20, blur: 12 });
      [1, 2, 3].forEach(i => {
        ee($('er' + i), t, T.end + 0.4 + 0.2 * i, 1e9, { dy: 24 });
        pop($('ec' + i), t, T.end + 0.55 + 0.2 * i, { from: 0.2 });
      });
      pop($('e3'), t, T.end + 1.3, { from: 0.6 });
    }
  }
