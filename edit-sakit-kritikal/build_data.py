"""Builds gfx/data.js for video 3: source-transcript words mapped through the EDL, auto caption chunks."""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from timeline import build, HOOK  # noqa
from edl import EDL  # noqa

src_json, out_js = sys.argv[1], sys.argv[2]
raw = [w for s in list(json.load(open(src_json)).values())[0] for w in s['words']]
segs, speech_end = build()

def to_out(ts):
    for s in segs:
        if s['src_in'] - 0.02 <= ts <= s['src_out'] + 0.02:
            return s['out_in'] + min(max(ts, s['src_in']), s['src_out']) - s['src_in']
    return None

FIX = {'when': None, 'kanser,': 'kanser,', 'ditop': 'top', 'up': 'up', 'dialisis,': 'dialisis,'}
W = []
for w in raw:
    txt = w['w'].strip()
    mid = (w['s'] + w['e']) / 2
    if to_out(mid) is None:
        continue
    if 50.5 < w['s'] < 51.0 and txt == 'when':   # ambiguous 'unpaid/annual' -> dropped from captions
        continue
    s0 = to_out(w['s']) if to_out(w['s']) is not None else to_out(mid)
    e0 = to_out(w['e']) if to_out(w['e']) is not None else to_out(mid) + 0.1
    W.append(dict(t=txt, s=round(s0, 3), e=round(max(e0, s0 + 0.05), 3), src=round(w['s'], 2)))
# small text fixes
for w in W:
    if w['t'] == 'ditop': w['t'] = 'di-top'
    if w['t'] == '100': w['t'] = 'RM100'
    if w['t'] == 'ringgit' : w['t'] = ''
W = [w for w in W if w['t']]

GOLD = {'kecil', 'nampak', 'barulah', 'medical', 'card', 'settle', 'lupa', 'sendiri', 'outpatient', 'claim', 'dialisis,', 'kanser,',
        'duit', 'treatment', 'sihat?', 'months,', 'weeks', 'recover', 'cost.', 'cost', 'Pampasan', 'pampasan', 'sakit', 'kritikal', 'kritikal.',
        'affordable.', 'serendah', 'RM100', 'coverage', 'beratus', '-ratus', 'ribu.', 'PM', 'di-top', 'up'}
CORAL = {'diberhentikan', 'kerja,', 'kerja', 'leave', 'tanpa', 'bayar.', 'bayar'}
chunks, cur = [], []
for i, w in enumerate(W):
    if cur:
        prev = W[cur[-1]]
        chars = sum(len(W[k]['t']) + 1 for k in cur) + len(w['t'])
        newsent = w['t'][0].isupper() and w['t'] not in ('I', 'PM', 'RM100', 'AIA')
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
for name in ['credit-card', 'hospital', 'house', 'receipt', 'circle-check', 'circle-x', 'x', 'check', 'droplets', 'ribbon', 'pill',
             'calendar-days', 'briefcase', 'calendar-x', 'wallet', 'hand-coins', 'shield-check', 'message-circle', 'chevrons-down',
             'sparkles', 'heart-pulse', 'trending-up', 'banknote', 'arrow-right', 'clock', 'activity', 'stethoscope', 'coins', 'user-x', 'piggy-bank']:
    p = os.path.join(idir, name + '.svg')
    if not os.path.exists(p):
        print('missing icon', name); continue
    svg = re.sub(r'\s+', ' ', re.sub(r'<!--.*?-->', '', open(p).read(), flags=re.S).strip())
    icons[name] = svg.replace('width="24"', '').replace('height="24"', '').replace('stroke-width="2"', 'stroke-width="1.8"')

end_start = W[-1]['e'] + 0.35
data = dict(hook=HOOK, words=W, chunks=CH, icons=icons, endStart=round(end_start, 3), total=round(end_start + 3.6, 3), segments=segs)
open(out_js, 'w').write('window.DATA = ' + json.dumps(data, ensure_ascii=False) + ';\n')
print('words', len(W), 'chunks', len(CH), 'total', data['total'], 'endStart', data['endStart'])
for i, w in enumerate(W):
    print(f"{i}:{w['t']}@{w['s']:.2f}", end='  ')
print()
