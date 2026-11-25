
  // =====================================================================
  // SFX cue sheet (time, name, gain dB) — 8-bit game sounds + whooshes
  // =====================================================================
  const C = [];
  const q = (tm, name, g) => C.push([+tm.toFixed(3), name, g + 2]);
  // hook: player select
  q(0.0, 'powerup8', -16); q(0.05, 'bass_hit', -15); q(0.15, 'select8', -17);
  for (let k = 0; k < 10; k++) q(W(4) - 0.05 + 0.06 * k, 'move8', -26);
  for (let k = 0; k < 10; k++) q(W(12) - 0.05 + 0.05 * k, 'move8', -25);
  q(W(12), 'error8', -19);
  q(W(14) - 0.05, 'error8', -21);
  for (let k = 0; k < 14; k++) q(W(8) + k * (W(18) + 0.2 - W(8)) / 14, 'type8', -27);
  q(W(16) - 0.05, 'coin8', -15); q(W(16), 'impact_soft', -19);
  q(PS_END - 0.08, 'glitch', -15); q(PS_END - 0.05, 'whoosh_down', -18);
  // body
  q(T.c1[0], 'select8', -19); q(W(25) - 0.05, 'coin8', -17);
  q(T.c2[0], 'select8', -19); [0, 1, 2].forEach(i => q(W(29) + 0.12 * i, 'move8', -19)); q(W(38) - 0.1, 'riser_short', -22);
  q(T.f1[0], 'levelup8', -15); q(T.f1[0], 'whoosh', -19); q(T.f1[1] - 0.12, 'whoosh_down', -20);
  q(T.t1[0], 'select8', -20); q(W(47), 'coin8', -18); q(W(51), 'coin8', -18);
  q(T.t2[0], 'levelup8', -19); q(W(64), 'move8', -18); q(W(66) - 0.05, 'move8', -18);
  for (let k = 0; k < 6; k++) q(W(69) + k * 0.08, 'type8', -25);
  for (let k = 0; k < 6; k++) q(W(72) + k * 0.08, 'type8', -25);
  q(W(78) - 0.05, 'select8', -18);
  q(T.t3[0], 'levelup8', -19); q(W(87), 'move8', -19); q(W(91), 'move8', -19); q(W(93), 'move8', -19); q(W(101), 'powerup8', -18); q(W(101) + 0.3, 'coin8', -16);
  q(W(105), 'tick', -21); q(W(113), 'ding', -17);
  q(T.f2[0], 'levelup8', -15); q(T.f2[0], 'whoosh', -19); q(T.f2[1] - 0.12, 'whoosh_down', -20);
  q(W(123) - 0.1, 'error8', -21); q(W(128) - 0.05, 'coin8', -16); q(W(128), 'shimmer', -21);
  q(T.s1[0], 'select8', -18); q(W(133), 'move8', -18); q(W(135), 'move8', -18); q(D.endStart - 0.1, 'save8', -14);
  window.CUES = C;
  window.TIMES = T;

  window.renderAt = function (t) {
    renderHook(t);
    renderCards(t);
    renderCaps(t);
    // no captions over the player-select hook (its own typed text) or the full-screen level cards
    const hideCap = t < PS_END + 0.05 || (t >= T.f1[0] && t < T.f1[1]) || (t >= T.f2[0] && t < T.f2[1]);
    if (hideCap) $('cap').style.display = 'none';
  };
  window.READY = document.fonts.ready.then(() => true);
})();
