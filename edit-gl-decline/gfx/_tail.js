  // =====================================================================
  // SFX cue sheet (time, name, gain dB) — all synthesised, copyright-free
  // =====================================================================
  const C = [];
  const q = (tm, name, g) => C.push([+Math.max(0, tm).toFixed(3), name, g + 2]);
  // ---- HOOK
  q(0.0, 'whoosh', -19); q(0.04, 'pop', -16);
  q(W(2) - 0.12, 'whoosh_down', -16); q(W(2) + 0.26, 'impact_soft', -14); q(W(2) + 0.3, 'shimmer', -17);
  q(W(3) + 0.12, 'pop', -15); q(W(3) + 0.14, 'ding', -17);
  q(W(4) - 0.02, 'skid', -13); q(W(4) + 0.2, 'riser_short', -20);
  // CRASH
  q(TC - 0.01, 'impact', -7); q(TC, 'bass_hit', -8); q(TC + 0.01, 'glass', -12); q(TC + 0.03, 'shock', -17); q(TC + 0.02, 'glitch', -16);
  // ambulance + HOSPITAL
  q(W(7) + 0.15, 'wail', -15); q(W(7) + 0.22, 'whoosh', -18);
  q(W(11) - 0.07, 'impact_soft', -14); q(W(11) - 0.06, 'pop', -17);
  // TAPI… record scratch, silence, heartbeat
  q(W(12) - 0.06, 'scratch', -9); q(W(12) - 0.02, 'bass_hit', -16);
  q(W(12) + 0.25, 'heartbeat', -9); q(W(13) + 0.08, 'heartbeat', -10);
  // GL → DECLINED stamp
  q(W(13) - 0.14, 'swipe', -14); q(W(13) - 0.1, 'whoosh_up', -19);
  q(TD - 0.02, 'stamp', -5); q(TD - 0.01, 'bass_hit', -8); q(TD, 'shock', -12); q(TD + 0.01, 'impact', -13); q(TD + 0.02, 'glitch', -15);
  q(TD + 0.35, 'heartbeat', -10);
  // KENAPA ??
  q(W(15) - 0.06, 'whoosh_up', -16); q(W(15) - 0.03, 'pop', -13);
  [0, 1, 2, 3, 4].forEach(i => q(W(15) + 0.1 + 0.11 * i, 'pop_lo', -18 + (i % 2)));
  q(W(16) - 0.02, 'blip', -15);
  q(HK_END - 0.14, 'whoosh_long', -13); q(HK_END + 0.4, 'impact_soft', -19);
  // ---- STORY (proof)
  q(PIPW[0] + 0.3, 'swipe', -17); q(PIPW[0] + 0.36, 'notif', -15);
  q(W(21) - 0.05, 'tap', -15); q(W(21) + 0.05, 'pop', -16);
  q(W(25) - 0.15, 'swipe', -17); q(W(25) - 0.1, 'notif2', -15); q(W(25) - 0.08, 'pop', -19);
  q(W(27) - 0.05, 'tap', -17); q(W(29) - 0.08, 'ding', -16); q(W(31) - 0.1, 'tap', -14);
  q(W(32) - 0.1, 'impact_soft', -15); q(W(32) - 0.08, 'pop_lo', -15);
  q(PIPW[1] - 0.5, 'whoosh_down', -18);
  // ---- 3 REASONS
  q(T.s3[0], 'whoosh', -17); q(W(35) - 0.08, 'impact', -13); q(W(35) - 0.05, 'shimmer', -19);
  [0, 1, 2].forEach(i => q(W(37) + 0.2 * i, 'pop', -19));
  q(T.r1[0], 'whoosh', -17); q(T.r1[0] + 0.02, 'pop', -16);
  q(W(42) - 0.05, 'swipe', -20); q(W(45) - 0.05, 'stamp_sm', -10); q(W(46) - 0.08, 'swipe', -20); q(W(50) - 0.05, 'ding', -15);
  q(T.r2[0], 'whoosh', -17); q(T.r2[0] + 0.02, 'pop', -16);
  [[61, 63], [64, 66], [68, 71]].forEach(([a, b]) => { q(W(a) - 0.12, 'pop', -19); q(W(b) - 0.05, 'stamp_sm', -11); });
  q(W(68), 'counter', -21);
  q(T.r3[0], 'whoosh', -17); q(T.r3[0] + 0.02, 'pop', -16);
  q(W(79) - 0.12, 'pop', -19); q(W(83) - 0.12, 'pop', -19);
  q(W(88) - 0.05, 'stamp', -8); q(W(88) - 0.04, 'bass_hit', -13);
  // ---- TAKEAWAY + CTA
  q(T.k1[0], 'whoosh', -16); q(T.k1[0] + 0.05, 'blip', -18);
  q(W(99) - 0.12, 'pop', -18); q(W(102) - 0.12, 'pop', -18); q(W(104) - 0.05, 'swipe', -14); q(W(104) + 0.07, 'swipe', -17);
  q(T.k2[0], 'whoosh', -17); q(W(108) - 0.05, 'shimmer', -17); q(W(108) - 0.03, 'pop', -17);
  q(W(109) - 0.1, 'impact_soft', -16); q(W(112) - 0.05, 'tick', -14); q(W(112) + 0.2, 'ding', -14);
  q(T.cta[0], 'whoosh', -18); q(W(114), 'tap', -13); q(W(114) + 0.02, 'pop', -16); q(W(116), 'tap', -13); q(W(116) + 0.02, 'pop', -16);
  q(W(118) - 0.1, 'shimmer', -18); q(D.endStart - 0.1, 'applause', -20);
  window.CUES = C;
  window.TIMES = T;

  window.renderAt = function (t) {
    renderHook(t);
    renderStory(t);
    renderCards(t);
    renderCaps(t);
    const inPip = t >= PIPW[0] + 0.3 && t <= PIPW[1] - 0.25;
    $('cap').classList.toggle('dark', inPip);
    $('cap').classList.toggle('low', inPip);
  };
  window.READY = document.fonts.ready.then(() => true);
})();
