
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
  q(T.k1[0], 'whoosh_down', -19); q(W(123) - 0.1, 'swipe', -18); q(W(126), 'scratch', -19); q(W(128) - 0.05, 'pop', -14); q(W(128), 'shimmer', -18);
  q(T.cta[0], 'whoosh', -18); q(W(133), 'tap', -13); q(W(133) + 0.02, 'pop', -16); q(W(135), 'tap', -13); q(W(135) + 0.02, 'pop', -16);
  q(D.endStart - 0.2, 'applause', -17); q(D.endStart - 0.15, 'shimmer', -19);
  window.CUES = C;
  window.TIMES = T;

  window.renderAt = function (t) {
    renderHook(t);
    renderCards(t);
    renderCaps(t);
    if (t >= T.f2[0] && t < T.f2[1]) $('cap').style.display = 'none';
    $('cap').classList.toggle('dark', t >= T.pip[0] + 0.3 && t <= T.pip[1] - 0.2);
  };
  window.READY = document.fonts.ready.then(() => true);
})();
