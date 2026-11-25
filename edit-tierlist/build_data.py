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
def overlap(w):
    best = None
    for s in segs:
        if s.get('mute'):
            continue
        ov = min(w['e'], s['src_out']) - max(w['s'], s['src_in'])
        if ov > 0 and (best is None or ov > best[0]):
            best = (ov, s)
    return best
for w in raw:
    txt = w['w'].strip()
    mid = (w['s'] + w['e']) / 2
    ob = overlap(w)
    if ob is None or ob[0] < min(0.15, 0.4 * (w['e'] - w['s'])):
        continue
    sg = ob[1]
    if to_out(mid) is None or not (sg['src_in'] <= mid <= sg['src_out']):
        mid = min(max(mid, sg['src_in'] + 0.02), sg['src_out'] - 0.02)
    if 50.5 < w['s'] < 51.0 and txt == 'when':   # ambiguous 'unpaid/annual' -> dropped from captions
        continue
    s0 = to_out(max(w['s'], sg['src_in'])) if to_out(max(w['s'], sg['src_in'])) is not None else to_out(mid)
    e0 = to_out(min(w['e'], sg['src_out'])) if to_out(min(w['e'], sg['src_out'])) is not None else to_out(mid) + 0.1
    W.append(dict(t=txt, s=round(s0, 3), e=round(max(e0, s0 + 0.05), 3), src=round(w['s'], 2)))
# small text fixes
FX = {'ditop': 'di-top', 'dialysis,': 'dialisis,', 'cancer.': 'kanser.', 'This': 'Dia', 'pilih': 'PM', 'RM100.': 'RM100.'}
for w in W:
    w['t'] = FX.get(w['t'], w['t'])
    if w['t'] in ('ringgit', 'ringgit.'): w['t'] = ''
W = [w for w in W if w['t']]
W.sort(key=lambda w: w['s'])
MAIN_START = HOOK

GOLD = {'kecil', 'nampak', 'barulah', 'medical', 'card', 'settle', 'lupa', 'sendiri', 'outpatient', 'claim', 'dialisis,', 'kanser,',
        'duit', 'treatment', 'sihat?', 'months,', 'weeks', 'recover', 'cost.', 'cost', 'Pampasan', 'pampasan', 'sakit', 'kritikal', 'kritikal.',
        'affordable.', 'serendah', 'RM100', 'RM100.', 'dialisis,', 'kanser.', 'nampak.', 'kritikal.', 'semua.', 'sendiri.', 'duit.', 'kerja.', 'ribu', 'bawah.', 'coverage', 'beratus', '-ratus', 'ribu.', 'PM', 'di-top', 'up'}
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

end_start = max(w['e'] for w in W) + 0.35
# keep the main-content words at stable indices 0..; hook words ('Haa, nampak kan?') go at the end
order = [w for w in W if w['s'] >= MAIN_START - 0.05] + [w for w in W if w['s'] < MAIN_START - 0.05]
pos = {id(w): k for k, w in enumerate(order)}
for c in CH:
    for x in c['w']:
        pass
W = order
data = dict(hook=HOOK, words=W, chunks=CH, mainStart=MAIN_START, icons=icons, endStart=round(end_start, 3), total=round(end_start + 3.0, 3), segments=segs)
open(out_js, 'w').write('window.DATA = ' + json.dumps(data, ensure_ascii=False) + ';\n')
print('words', len(W), 'chunks', len(CH), 'total', data['total'], 'endStart', data['endStart'])
for i, w in enumerate(W):
    print(f"{i}:{w['t']}@{w['s']:.2f}", end='  ')
print()
