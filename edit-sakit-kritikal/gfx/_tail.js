
  // =====================================================================
  // SFX cue sheet (time, name, gain dB)
  // =====================================================================
  const C = [];
  const q = (tm, name, g) => C.push([+tm.toFixed(3), name, g + 2]);
  // hook
  q(0.02, 'glass_tap', -19); q(0.3, 'tick', -18); q(0.75, 'tick', -18);
  q(A1 - 1.0, 'riser_short', -17); q(A1 - 0.12, 'whoosh_long', -12);
  q(B0 + 0.3, 'bass_hit', -11); q(B0 + 0.32, 'impact', -15); q(B0 + 0.35, 'shimmer', -18);
  q(TK, 'whoosh_down', -18); q(TK + 0.45, 'pop_lo', -19);
  q(TS - 0.6, 'riser_short', -19); q(TS, 'whoosh_long', -13);
  q(TL - 0.02, 'shock', -15); q(TL, 'bass_hit', -12); q(TL + 0.03, 'shimmer', -19);
  q(TOUT, 'whoosh_down', -20);
  // cards
  q(T.c1[0], 'whoosh', -18); q(W(17) - 0.1, 'glass_tap', -19); [18, 20, 24].forEach((i, k) => q(W(i) + (k ? -0.05 : 0.1), 'pop', -19));
  q(T.c2[0], 'whoosh', -18); q(W(30), 'swipe', -19); q(W(31), 'pop', -19); q(W(33), 'pop_lo', -19); q(W(37) - 0.05, 'impact_soft', -18); q(W(43), 'tap', -16); q(W(43), 'pop', -19);
  q(T.c3[0], 'whoosh', -18); q(W(48), 'pop', -19); q(W(49), 'pop', -19); q(W(53) - 0.05, 'chaching', -15); q(W(53), 'coins', -20);
  q(T.c4[0], 'whoosh', -18); q(W(62) - 0.1, 'swipe', -19); q(W(68), 'tick', -18); q(W(69), 'pop', -19); q(W(72), 'pop', -19); q(W(75), 'ding', -16);
  q(T.c5[0], 'whoosh', -18); q(W(80), 'whoosh_down', -19); q(W(83) - 0.05, 'sub_drop', -17); q(W(83), 'pop_lo', -19); q(W(84), 'impact_soft', -19); q(W(89), 'pop_lo', -18);
  q(T.c6[0], 'whoosh', -18); [0, 1, 2].forEach(i => q(W(93) + 0.35 * i, 'pop', -19));
  q(T.topup - 0.1, 'whoosh_long', -14); q(T.topup + 0.05, 'shimmer', -18); q(T.topup + 0.08, 'bass_hit', -18); q(W(107), 'ding', -15); q(W(107) + 0.05, 'clap2', -18);
  q(T.c7[0], 'whoosh', -18); q(W(110), 'swipe', -20); q(W(113), 'pop', -19); q(W(115), 'blip', -18); q(W(117), 'pop', -19); q(W(119) - 0.3, 'riser_short', -22); q(W(121), 'chaching', -17);
  q(T.c8[0], 'whoosh', -18); q(W(123), 'pop', -19); q(W(124), 'shimmer', -21); q(W(129), 'tap', -14); q(W(129), 'pop', -17); q(W(132), 'blip', -19);
  q(T.end - 0.1, 'whoosh_long', -15); q(T.end + 0.25, 'shimmer', -19);
  [1, 2, 3].forEach(i => q(T.end + 0.65 + 0.22 * i, 'pop', -18));
  q(T.end + 1.5, 'impact_soft', -16); q(T.end + 1.55, 'applause', -15);
  window.CUES = C;
  window.TIMES = T;

  window.renderAt = function (t) {
    renderHook(t);
    renderCards(t);
    renderCaps(t);
  };
  window.READY = document.fonts.ready.then(() => true);
})();
