// Renders the HTML motion layer to transparent PNG frames.
// usage: node render.js <outdir> all <fps> [workers]
//        node render.js <outdir> times t1,t2,...
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const [outdir, mode, arg, workersArg, scaleArg, maskArg] = process.argv.slice(2);
  const MASK = maskArg === 'mask';
  const DSF = parseFloat(scaleArg || '1');
  fs.mkdirSync(outdir, { recursive: true });
  const url = 'file://' + path.join(__dirname, 'gfx', 'index.html');
  const browser = await chromium.launch();
  const mkPage = async () => {
    const p = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: DSF });
    await p.goto(url);
    await p.evaluate(() => window.READY);
    if (MASK) await p.evaluate(() => document.body.classList.add('mask'));
    await p.evaluate(() => new Promise(r => { const i = new Image(); i.onload = r; i.onerror = r; i.src = 'hookbg.jpg'; }));
    return p;
  };
  const first = await mkPage();
  const meta = await first.evaluate(() => ({ total: window.DATA.total, cues: window.CUES, times: window.TIMES }));
  fs.writeFileSync(path.join(outdir, 'meta.json'), JSON.stringify(meta, null, 1));

  let jobs;
  if (mode === 'times') {
    jobs = arg.split(',').map((t, i) => ({ t: parseFloat(t), f: path.join(outdir, `t_${String(i).padStart(3, '0')}.png`) }));
  } else {
    const fps = parseFloat(arg || '30');
    const n = Math.ceil(meta.total * fps);
    jobs = [];
    for (let i = 0; i < n; i++) jobs.push({ t: i / fps, f: path.join(outdir, `f_${String(i).padStart(5, '0')}.png`) });
  }
  const W = Math.max(1, parseInt(workersArg || '4'));
  const pages = [first];
  for (let i = 1; i < W; i++) pages.push(await mkPage());
  let next = 0, done = 0;
  const t0 = Date.now();
  await Promise.all(pages.map(async p => {
    while (true) {
      const j = next++;
      if (j >= jobs.length) break;
      const { t, f } = jobs[j];
      await p.evaluate(tt => window.renderAt(tt), t);
      await p.screenshot({ path: f, omitBackground: true, type: 'png' });
      done++;
      if (done % 300 === 0) console.log(`${done}/${jobs.length} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }));
  console.log('rendered', jobs.length, 'frames in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  await browser.close();
})();
