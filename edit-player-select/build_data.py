"""gfx/data.js for video 5: words from both clips mapped through the EDL; sentence-aware caption chunks."""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from timeline import build, HOOK  # noqa

tr = json.load(open(sys.argv[1])); out_js = sys.argv[2]
segs, speech_end = build()
raw = {1: [w for s in tr['a1.wav'] for w in s['words']], 2: [w for s in tr['a2.wav'] for w in s['words']]}
FX = {'simak': 'semak', 'Dr.': 'doktor', 'Pakar,': 'pakar,', 'Pakar': 'pakar', 'GL.': 'GL.', 'GL': 'GL'}
W = []
for sg in segs:
    for w in raw[sg['clip']]:
        ov = min(w['e'], sg['src_out']) - max(w['s'], sg['src_in'])
        if ov < min(0.12, 0.4 * (w['e'] - w['s'])):
            continue
        s0 = sg['out_in'] + max(w['s'], sg['src_in']) - sg['src_in']
        e0 = sg['out_in'] + min(w['e'], sg['src_out']) - sg['src_in']
        t = FX.get(w['w'].strip(), w['w'].strip())
        W.append(dict(t=t, s=round(s0, 3), e=round(max(e0, s0 + 0.05), 3)))
W.sort(key=lambda w: w['s'])
# 'tetapi' of the last take is mis-timed by the transcriber: insert it where it is spoken
t11 = next(sg for sg in segs if abs(sg['src_in'] - 132.28) < 0.01)
W.append(dict(t='tetapi', s=round(t11['out_in'] + 0.02, 3), e=round(t11['out_in'] + 0.62, 3)))
W.sort(key=lambda w: w['s'])
PUNCT = {'perubatan': 'perubatan.', 'polisi': None}
for i, w in enumerate(W):
    if w['t'] == 'perubatan': w['t'] = 'perubatan.'
    if w['t'] == 'memerlukan': w['t'] = 'memerlukan.'
    if w['t'] == 'polisi' and i + 1 < len(W) and W[i + 1]['t'] == 'tetapi': w['t'] = 'polisi,'
    if w['t'] == 'ejen' and i + 1 < len(W) and W[i + 1]['t'].lower() == 'adakah': w['t'] = 'ejen,'
KEEP = {'GL', 'GL.', 'I'}
for i, w in enumerate(W):
    start = i == 0 or W[i - 1]['t'].endswith(('.', '?', '!'))
    if w['t'] in KEEP: continue
    w['t'] = (w['t'][:1].upper() + w['t'][1:]) if start else (w['t'][:1].lower() + w['t'][1:] if not w['t'][:1].isdigit() else w['t'])

GOLD = {'hospital', 'hospital.', 'panik', 'paniklah', '3', 'tips', 'semak', 'polisi', 'ejen.', 'ejen,', 'ejen', 'bayaran', 'waiting', 'period.',
        'emergensi', 'ward', 'pakar,', 'pakar', 'GL.', 'GL', 'laporan', 'perubatan.', 'kelulusan', '2', '3', 'jam.', 'menjual', 'membantu',
        'memerlukan.', 'memerlukan', 'Share', 'save', 'pertama,', 'kedua,', 'ketiga,', 'perubatan.', 'Semak', 'Doktor'}
CORAL = {'paniklah', 'panik', 'apa.', 'busy'}
chunks, cur = [], []
for i, w in enumerate(W):
    if cur:
        prev = W[cur[-1]]
        chars = sum(len(W[k]['t']) + 1 for k in cur) + len(w['t'])
        newsent = w['t'][:1].isupper() and w['t'] not in ('GL', 'GL.')
        if len(cur) >= 4 or chars > 24 or newsent or re.search(r'[.,?!]$', prev['t']) or w['s'] - prev['e'] > 0.35:
            chunks.append(cur); cur = []
    cur.append(i)
if cur: chunks.append(cur)
CH = []
for k, idx in enumerate(chunks):
    ws = [dict(i=i, t=W[i]['t'], s=W[i]['s'], e=W[i]['e'], c=('c' if W[i]['t'] in CORAL else ('g' if W[i]['t'] in GOLD else ''))) for i in idx]
    nxt = W[chunks[k + 1][0]]['s'] if k + 1 < len(chunks) else ws[-1]['e'] + 0.4
    CH.append(dict(s=round(ws[0]['s'] - 0.04, 3), e=round(min(nxt, ws[-1]['e'] + 0.9) - 0.02, 3), w=ws))

icons = {}
idir = os.path.join(HERE, 'node_modules/lucide-static/icons')
for name in ['credit-card', 'hospital', 'file-search', 'phone-call', 'siren', 'bed', 'stethoscope', 'map-pin', 'file-text', 'building-2',
             'circle-check', 'clock', 'timer', 'user-check', 'handshake', 'share-2', 'bookmark', 'save', 'gamepad-2', 'shield-check',
             'wallet', 'calendar-clock', 'arrow-right', 'check', 'x', 'heart-handshake', 'sparkles', 'badge-check', 'zap']:
    p = os.path.join(idir, name + '.svg')
    if not os.path.exists(p):
        print('missing icon', name); continue
    svg = re.sub(r'\s+', ' ', re.sub(r'<!--.*?-->', '', open(p).read(), flags=re.S).strip())
    icons[name] = svg.replace('width="24"', '').replace('height="24"', '').replace('stroke-width="2"', 'stroke-width="2"')
end_start = speech_end + 0.05
data = dict(hook=HOOK, words=W, chunks=CH, icons=icons, endStart=round(end_start, 3), total=round(speech_end + 1.4, 3), segments=segs,
            psEnd=segs[0]['out_out'])
open(out_js, 'w').write('window.DATA = ' + json.dumps(data, ensure_ascii=False) + ';\n')
print('words', len(W), 'chunks', len(CH), 'total', data['total'], 'psEnd', data['psEnd'])
print('  '.join(f"{i}:{w['t']}@{w['s']:.2f}" for i, w in enumerate(W)))
print('segs', [(s['i'], s['out_in'], s['out_out']) for s in segs])
