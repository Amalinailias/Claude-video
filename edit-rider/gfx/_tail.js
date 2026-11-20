
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
