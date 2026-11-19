
  // =====================================================================
  // SFX cue sheet (time, name, gain dB) — hook cues get +7.5 dB, body +2 dB
  // =====================================================================
  const C = [];
  const q = (tm, name, g) => C.push([+tm.toFixed(3), name, g + (tm < HOOK ? 7.5 : 2)]);
  // hook: attention grabber
  q(0.0, 'bass_hit', -13); q(0.02, 'whoosh_down', -20);
  q(0.15, 'notif', -15); q(0.8, 'notif2', -15);
  q(1.38, 'whoosh', -18); q(1.42, 'glass_tap', -20);
  q(1.65, 'blip', -19); q(1.9, 'blip', -19);
  q(2.15, 'counter', -17); q(2.95, 'chaching', -11); q(2.95, 'impact', -17);
  q(3.22, 'whoosh', -18); q(3.55, 'swipe', -15); q(3.55, 'sub_drop', -19);
  q(HOOK - 0.5, 'whoosh_long', -14); q(HOOK - 0.03, 'bass_hit', -18);
  // body
  q(T.pA[0], 'pop', -19);
  q(T.cB[0], 'whoosh', -18); q(T.cB[0] + 0.02, 'glass_tap', -20); q(W(8), 'shimmer', -22);
  q(W(13), 'pop', -19); q(W(16), 'pop', -19); q(W(19), 'blip3', -18); q(W(19) + 0.05, 'coins', -22);
  q(T.cC[0], 'whoosh', -19); [0, 1, 2].forEach(i => q(W(20) + 0.1 + 0.18 * i, 'glass_tap', -21)); q(W(21), 'blip', -20);
  q(T.cD[0] - 0.1, 'whoosh_long', -16); q(W(25), 'swipe', -19); q(W(32), 'swipe', -19);
  q(T.cE[0], 'whoosh', -18); q(W(40) - 0.05, 'counter', -18); q(W(41), 'pop', -19); q(W(44), 'pop_lo', -19); q(W(46), 'ding', -17);
  q(T.cF[0] - 0.1, 'whoosh_long', -16); q(W(53) - 0.2, 'riser_short', -24); q(W(59), 'blip3', -19);
  q(T.cG[0], 'whoosh', -18); q(W(64), 'pop_lo', -19); q(W(70), 'swipe', -15); q(W(70) + 0.05, 'impact_soft', -19);
  [0, 1, 2, 3, 4, 5, 6].forEach(i => q(W(71) + 0.16 * i, 'tick', -21 + i)); q(W(73), 'ding', -16);
  q(T.cH[0], 'whoosh', -18); [0, 1, 2, 3, 4, 5].forEach(i => q(W(76) + 0.4 * i, 'glass_tap', -20)); q(W(83), 'ding', -15);
  q(T.cI[0], 'whoosh', -18); q(W(86), 'pop', -19); q(W(87), 'shimmer', -21); q(W(89), 'tap', -14); q(W(89), 'pop', -17); q(W(92), 'blip', -19);
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
