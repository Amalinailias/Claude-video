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

  // proof: real (redacted) WhatsApp chats, shown as a timeline deck next to a PiP of her
  const PC = [
    ['e1', 1206, 400, '10:04 PM', 'Klien masuk wad', [[3.6, 68.0, 45.8, 29.0]], '#D7263D'],
    ['e2', 1206, 179, '11:45 PM', 'Klien berterima kasih', [[4.1, 13.0, 74.2, 78.0]], '#D7263D'],
    ['e3', 1206, 475, '8:29 AM', 'Ejen ambil berat', [[44.8, 0.5, 51.5, 45.0], [3.6, 59.0, 69.0, 40.0]], '#2FA36B'],
  ];
  const CW = 600;
  add(`<div id="pf">
    <div class="abs" id="pft" style="left:60px;top:150px;width:960px;color:var(--ink)">
      <div class="wk" style="color:#2FA36B"><span class="ic">${RAW('badge-check')}</span>Bukti sebenar</div>
      <div class="wt" style="margin-top:10px;font-size:50px">Ejen yang <em>ada</em> bila klien perlukan</div>
      <div class="row" style="margin-top:16px;gap:12px">
        <span class="pill lt" id="pfb" style="font-size:26px;padding:10px 18px 10px 14px">${IC('x')}<span style="text-decoration:line-through;text-decoration-thickness:3px">Hanya jual polisi</span></span>
        <span class="pill ok" id="pfg" style="font-size:26px;padding:10px 18px 10px 14px">${IC('circle-check')}Bantu ketika anda memerlukan</span>
      </div>
    </div>
    <div id="deck" class="abs" style="left:50px;top:400px;width:${CW}px;height:760px">
      ${PC.map((c, i) => `<div class="pcard" id="pc${i}" style="width:${CW}px">
        <div class="ph"><span class="tm">${c[3]}</span><span class="lb">${c[4]}</span></div>
        <div style="position:relative"><img src="proof/${c[0]}.jpg" style="display:block;width:${CW}px;height:${Math.round(CW * c[2] / c[1])}px">
          ${c[5].map((h, k) => `<div class="hlb" id="h${i}_${k}" style="left:${h[0]}%;top:${h[1]}%;width:${h[2]}%;height:${h[3]}%;border-color:${c[6]}"></div>`).join('')}
        </div></div>`).join('')}
    </div>
    <div class="abs" id="pfn" style="left:60px;top:1250px;font:600 22px/1.2 'PJS';color:rgba(30,27,34,.55)">Nama klien &amp; hospital dikaburkan untuk privasi</div>
  </div>`);

  add(`<div id="cta" class="abs" style="left:0;right:0;top:260px;display:flex;flex-direction:column;align-items:center">
    <div style="display:flex;gap:60px">
      <div class="rb" id="rb1"><div class="rip" id="rp1"></div>${IC('send')}Share</div>
      <div class="rb" id="rb2"><div class="rip" id="rp2"></div>${IC('bookmark')}Save</div>
    </div>
    <div id="ctat" style="margin-top:26px;font:italic 400 64px/1 'ISerif';color:#fff;text-shadow:0 3px 14px rgba(0,0,0,.85),0 1px 3px rgba(0,0,0,.9)">untuk masa hadapan</div>
    <div id="nmt" style="margin-top:30px;display:inline-flex;align-items:center;gap:14px;padding:14px 30px 14px 16px;border-radius:999px;background:rgba(255,255,255,.92);box-shadow:0 10px 28px rgba(0,0,0,.25)">
      <span style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#F0566A,#D7263D);display:flex;align-items:center;justify-content:center;color:#fff"><span style="width:30px;height:30px">${RAW('user-round')}</span></span>
      <span style="font:800 40px/1 'PJS';color:#1E1B22;letter-spacing:-.01em">Amalina Ilias</span></div>
  </div>`);


  // per-tip proof strips (real, redacted chats) — shown while she talks about that step
  const PS = [
    // id, img h, time, label, top, in, out
    ['p1a', 320, '10:17 PM', 'Ejen semak dokumen polisi', 1050, W(41) - 0.15, W(46) - 0.12],
    ['p1b', 390, '8:29 AM', 'Waiting period dah lepas ✓', 1050, W(46) - 0.06, W(52) - 0.15],
    ['p2a', 360, '10:04 PM', 'Ejen tanya keadaan klien', 1050, W(54) - 0.1, W(68) - 0.15],
    ['p2b', 320, '10:17 PM', 'Ejen hubungi hospital', 1050, W(74) - 0.1, W(83) - 0.15],
    ['p3a', 160, '10:51 PM', 'Ejen follow-up laporan perubatan', 1075, W(87) - 0.1, W(93) - 0.12],
    ['p3b', 165, '11:40 PM', 'Hospital percepatkan proses', 1075, W(93) - 0.06, W(101) - 0.12],
    ['p3c', 160, '8:28 AM', 'GL diluluskan ✓', 1075, W(101) - 0.06, W(104) - 0.12],
  ];
  const SW = 900;
  PS.forEach(p => add(`<div class="pstrip" id="ps_${p[0]}" style="top:${p[4]}px">
    <div class="sh"><span class="ok">${IC('badge-check')}BUKTI</span><span class="tm">${p[2]}</span><span class="lb">${p[3]}</span></div>
    <img src="proof/${p[0]}.jpg" style="display:block;width:${SW}px;height:${Math.round(SW * p[1] / 1206)}px">
  </div>`));
  function renderStrips(t) {
    let low = false;
    PS.forEach(p => {
      const el = $('ps_' + p[0]);
      if (ee(el, t, p[5], p[6], { dy: 40, sc: 0.06, blur: 10, din: 0.38, dout: 0.2 })) {
        const g = bell(P(t, p[5] + 0.25, 0.9));
        el.style.boxShadow = `0 20px 50px rgba(20,10,10,.28), 0 0 0 ${(4 * g).toFixed(1)}px rgba(47,163,107,${(0.7 * g).toFixed(2)})`;
        if (p[4] < 1070) low = true;
      }
    });
    $('cap').classList.toggle('low', low);
  }

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
  T.proof = [W(117) - 0.1, W(133) - 0.1];       // proof deck + PiP
  T.k1 = T.proof;
  T.pc = [0.45, 1.95, 3.45].map(d => T.proof[0] + d);
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
    $('pipbg').style.display = ((t >= T.pip[0] - 0.02 && t <= T.pip[1] + 0.5) || (t >= T.proof[0] - 0.02 && t <= T.proof[1] + 0.5)) ? '' : 'none';
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
    const pf = $('pf');
    if (show(pf, t >= T.proof[0] && t < T.proof[1] + 0.3 ? 1 : 0)) {
      const TO = T.proof[1] - 0.6;
      ee($('pft'), t, T.proof[0] + 0.1, TO, { dy: 20, blur: 8 });
      ee($('pfn'), t, T.proof[0] + 0.6, TO, { dy: 6, sc: 0, blur: 3 });
      pop($('pfb'), t, W(123) - 0.1, { from: 0.5, tout: TO });
      pop($('pfg'), t, W(128) - 0.05, { from: 0.4, tout: TO });
      const g = bell(P(t, W(131), 0.8));
      $('pfg').style.boxShadow = `0 0 ${(34 * g).toFixed(0)}px rgba(47,163,107,${(0.75 * g).toFixed(2)})`;
      const n = T.pc.filter(x => t >= x).length;
      PC.forEach((c, i) => {
        const el = $('pc' + i), t0 = T.pc[i];
        if (t < t0 - 0.02 || t > T.proof[1] + 0.25) { el.style.display = 'none'; return; }
        el.style.display = '';
        const a = E.outBack(P(t, t0, 0.42));
        const yoff = PC.slice(0, i).reduce((s, q) => s + Math.round(CW * q[2] / q[1]) + 58 + 18, 0);
        const rot = (i % 2 ? 2 : -2) * (1 - a);
        const out = E.inCubic(P(t, TO, 0.25));
        el.style.opacity = (clamp(P(t, t0, 0.12)) * (1 - out)).toFixed(3);

        el.style.zIndex = String(10 + i);
        el.style.transform = `translate(${(260 * (1 - a)).toFixed(1)}px, ${(yoff + 30 * (1 - a)).toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
        c[5].forEach((h, k) => {
          const hb = $(`h${i}_${k}`), hp = P(t, t0 + 0.45 + 0.35 * k, 0.3);
          hb.style.opacity = (hp > 0 ? 1 : 0).toFixed(2);
          hb.style.transform = `scale(${(1.15 - 0.15 * E.outBack(hp)).toFixed(3)})`;
          hb.style.boxShadow = `0 0 ${(22 * bell(P(t, t0 + 0.45 + 0.35 * k, 0.7))).toFixed(0)}px ${c[6]}`;
        });
      });
    }
    if (ee($('cta'), t, T.cta[0], T.cta[1], { dy: 30 })) {
      [['rb1', 'rp1', W(133)], ['rb2', 'rp2', W(135)]].forEach(([b, r, ts]) => {
        pop($(b), t, ts - 0.15, { from: 0.4 });
        const k = P(t, ts + 0.05, 0.6);
        $(b).style.transform += ` scale(${(1 - 0.12 * bell(P(t, ts, 0.25))).toFixed(3)})`;
        $(r).style.transform = `scale(${(1 + 0.6 * k).toFixed(3)})`; $(r).style.opacity = (k > 0 && k < 1 ? 0.9 * (1 - k) : 0).toFixed(3);
      });
      ee($('ctat'), t, W(137) - 0.1, 1e9, { dy: 16, blur: 8 });
      pop($('nmt'), t, W(138), { from: 0.5 });
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
  // SFX cue sheet (time, name, gain dB) — modern, original, copyright-free
  // =====================================================================
  const C = [];
  const q = (tm, name, g) => C.push([+tm.toFixed(3), name, g + 2]);
  // hook
  q(0.0, 'whoosh_down', -20);
  q(W(4) - 0.08, 'pop', -14); q(W(4) - 0.06, 'impact_soft', -18);
  [0, 1, 2].forEach(i => q(W(4) + 0.18 + 0.22 * i, i % 2 ? 'notif2' : 'notif', -19));
  q(W(10) - 0.05, 'alarm', -22);
  // PANIK: the 'shocked' moment
  q(W(12) - 0.08, 'whoosh_up', -18);
  q(W(12) - 0.06, 'shock', -9); q(W(12) - 0.05, 'bass_hit', -11); q(W(12) - 0.04, 'glitch', -15);
  q(W(12), 'heartbeat', -11); q(W(12) + 0.55, 'heartbeat', -13);
  q(W(12) + 0.08, 'pop', -16); q(W(12) + 0.1, 'whoosh', -20);
  [0, 1, 2, 3, 4].forEach(i => q(W(15) + 0.16 * i, 'pop_lo', -19 + (i % 2)));
  q(W(18) - 0.05, 'blip', -16);
  q(HK_END - 0.15, 'whoosh_long', -15);
  // body
  q(T.c1[0], 'pop', -16); q(W(25) - 0.05, 'ding', -16);
  q(T.c2[0], 'whoosh', -18); q(W(29) - 0.08, 'impact', -15); q(W(29) - 0.06, 'shimmer', -20); [0, 1, 2].forEach(i => q(W(35) + 0.12 * i, 'pop', -19));
  // the camera pull itself: big whoosh + hit as the '01' lands
  q(T.pull[0] + 0.05, 'whoosh_long', -12); q(T.t1[0], 'bass_hit', -14); q(T.t1[0] + 0.02, 'impact_soft', -16);
  q(W(46) - 0.1, 'swipe', -19); q(W(47) + 0.1, 'shutter', -12); q(W(50) - 0.1, 'swipe', -19); q(W(51) + 0.35, 'shutter', -12);
  q(T.t2[0], 'whoosh', -17); q(W(54), 'tap', -16); q(W(64), 'tick', -18); q(W(66) - 0.05, 'tick', -18);
  q(W(68), 'tap', -17); q(W(71), 'tap', -17); q(W(74) - 0.3, 'blip', -21); q(W(77), 'ding', -15);
  q(T.pip[0], 'whoosh_long', -14); q(T.pip[0] + 0.3, 'impact_soft', -18);
  [[87, 0], [91, 1], [93, 2]].forEach(([i]) => q(W(i) - 0.1, 'pop', -18)); q(W(101), 'chaching', -15); q(W(101) + 0.05, 'clap2', -19);
  q(W(105), 'counter', -19); q(W(113), 'ding', -15);
  q(T.pip[1] - 0.05, 'whoosh_down', -18);
  q(T.f2[0], 'whoosh', -15); q(W(116) - 0.08, 'bass_hit', -12); q(W(116) - 0.06, 'impact', -16);
  PS.forEach(p => { q(p[5] - 0.02, 'whoosh', -22); q(p[5] + 0.08, 'notif', -16); });
  q(T.proof[0], 'whoosh_long', -14); q(T.proof[0] + 0.3, 'impact_soft', -19);
  T.pc.forEach((x, i) => { q(x - 0.05, 'whoosh', -21); q(x + 0.02, i % 2 ? 'notif2' : 'notif', -15); });
  q(T.pc[2] + 0.45, 'ding', -14); q(T.pc[2] + 0.5, 'shimmer', -18);
  q(W(123) - 0.1, 'swipe', -19); q(W(128) - 0.05, 'pop', -15); q(W(128), 'shimmer', -19);
  q(T.proof[1] - 0.15, 'whoosh_down', -19);
  q(T.cta[0], 'whoosh', -18); q(W(133), 'tap', -13); q(W(133) + 0.02, 'pop', -16); q(W(135), 'tap', -13); q(W(135) + 0.02, 'pop', -16);
  q(D.endStart - 0.2, 'applause', -17); q(D.endStart - 0.15, 'shimmer', -19);
  window.CUES = C;
  window.TIMES = T;

  window.renderAt = function (t) {
    renderHook(t);
    renderCards(t);
    renderCaps(t);
    renderStrips(t);
    if (t >= T.f2[0] && t < T.f2[1]) $('cap').style.display = 'none';
    $('cap').classList.toggle('dark', (t >= T.pip[0] + 0.3 && t <= T.pip[1] - 0.2) || (t >= T.proof[0] + 0.3 && t <= T.proof[1] - 0.2));
  };
  window.READY = document.fonts.ready.then(() => true);
})();
