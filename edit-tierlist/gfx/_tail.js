
  // =====================================================================
  // SFX cue sheet (time, name, gain dB) — pre-roll (no voice) gets +6 dB, the rest +2 dB
  // =====================================================================
  const C = [];
  const q = (tm, name, g) => C.push([+tm.toFixed(3), name, g + (tm < HOOK ? 6 : 2)]);
  q(0.0, 'whoosh_down', -20); TIERS.forEach((r, i) => q(0.12 + 0.06 * i, 'tick', -22));
  q(0.45, 'pop', -16); q(0.47, 'glass_tap', -20); q(0.8, 'pop', -16); q(1.0, 'tick', -20);
  q(1.05, 'blip', -18); q(1.2, 'tick', -21); q(1.32, 'tick', -21);
  q(T_DROP, 'whoosh_down', -13); q(T_LAND, 'bass_hit', -11); q(T_LAND + 0.01, 'impact_soft', -14); q(T_LAND + 0.03, 'scratch', -16);
  q(T_LAND + 0.12, 'pop_lo', -18);
  q(T_OUT - 0.05, 'whoosh_long', -14);
  q(BT_SMALL, 'pop_lo', -20); q(BT_BIG - 0.8, 'riser_short', -19); q(BT_BIG, 'whoosh_long', -14);
  q(BT_LAND, 'bass_hit', -12); q(BT_LAND + 0.02, 'impact', -17); q(BT_LAND + 0.04, 'shimmer', -19); q(BT_OUT, 'whoosh_down', -20);
  q(T.c1[0], 'whoosh', -18); q(W(25), 'blip', -20);
  q(T.yel[0], 'swipe', -12); q(T.yel[0] + 0.02, 'bass_hit', -12); q(T.yel[0] + 0.03, 'impact_soft', -15); q(T.yel[1], 'whoosh', -16);
  q(T.c2[0], 'whoosh', -19); q(W(36) - 0.05, 'pop_lo', -18); q(W(36), 'impact_soft', -19);
  q(T.c3[0], 'whoosh', -18); q(W(39), 'pop', -19); q(W(40), 'pop', -19); q(W(44) - 0.1, 'chaching', -16);
  q(T.c4[0], 'whoosh', -18); q(W(55), 'blip', -20);
  q(T.c5[0], 'whoosh', -18); q(W(58), 'whoosh_down', -20); q(W(62) - 0.05, 'sub_drop', -17);
  q(T.c6[0] - 0.08, 'whoosh_long', -15); q(T.c6[0] + 0.05, 'shimmer', -19); q(W(73), 'ding', -16);
  q(T.c7[0], 'whoosh', -18); q(W(75), 'pop', -19); q(W(76), 'blip', -18); q(W(78), 'pop', -19); q(W(82) - 0.1, 'chaching', -17);
  q(T.c8[0], 'whoosh', -18); q(W(84), 'pop', -19); q(W(85), 'shimmer', -21); q(W(90), 'tap', -14); q(W(90), 'pop', -17); q(W(93), 'blip', -19);
  q(T.end - 0.1, 'whoosh_long', -15); q(T.end + 0.25, 'shimmer', -19);
  [1, 2, 3].forEach(i => q(T.end + 0.55 + 0.2 * i, 'pop', -18));
  q(T.end + 1.3, 'impact_soft', -16); q(T.end + 1.35, 'applause', -16);
  window.CUES = C;
  window.TIMES = T;

  window.renderAt = function (t) {
    renderHook(t);
    renderCards(t);
    renderCaps(t);
    // keep the tier list and the yellow card clean: no captions over them
    if (t < T_OUT + 0.3 || (t >= T.yel[0] && t < T.yel[1] + 0.15)) $('cap').style.display = 'none';
  };
  window.READY = document.fonts.ready.then(() => true);
})();
