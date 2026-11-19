"""Builds gfx/data.js: corrected word timings on the output timeline, caption chunks, icons."""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from timeline import build, HOOK  # noqa

words_json, out_js = sys.argv[1], sys.argv[2]
words = json.load(open(words_json))  # times relative to the cut (speech) timeline

FIX = {13: 'perceraian', 43: 'perceraian,', 23: None, 24: 'dicakap', 48: 'perselisihan', 49: 'faham,', 58: 'terabai.', 65: 'tiga',
       90: 'okay,', 167: 'benefits.', 219: 'Naja’a', 222: 'Ilias', 41: 'adalah,', 25: 'narsistik.'}

# re-map word times: original-cut timeline -> source -> current EDL (removed words get t='')
from edl_orig import EDL_ORIG
from edl import EDL as EDL_NOW
def spans(edl):
    t, out = 0.0, []
    for c, a, b, z, n in edl:
        out.append((t, t + b - a, c, a, b)); t += b - a
    return out
ORIG, NOW = spans(EDL_ORIG), spans(EDL_NOW)
def to_src(tc):
    for c0, c1, c, a, b in ORIG:
        if c0 - 1e-6 <= tc < c1 + 1e-6:
            return c, a + (tc - c0)
    return None
def to_now(src, clamp_hi=False):
    c, ts = src
    for c0, c1, cc, a, b in NOW:
        if cc == c and a - 0.02 <= ts <= b + 0.02:
            return c0 + min(max(ts, a), b) - a
    return None
for w in words:
    mid = to_src((w['s'] + w['e']) / 2)
    st, en = to_src(w['s']), to_src(w['e'])
    if mid is None or to_now(mid) is None:
        w['gone'] = True
        continue
    s0 = to_now(st) if st and to_now(st) is not None else to_now(mid)
    e0 = to_now(en) if en and to_now(en) is not None else to_now(mid) + 0.1
    w['s'], w['e'] = s0, max(e0, s0 + 0.05)
W = []
for i, w in enumerate(words):
    txt = w['w'].strip()
    if i in FIX:
        if FIX[i] is None:
            txt = ''
        else:
            txt = FIX[i]
    if w.get('gone'):
        txt = ''
    W.append(dict(t=txt, s=round(w['s'] + HOOK, 3), e=round(w['e'] + HOOK, 3)))
# merge "di" + "cakap" timing
W[24]['s'] = W[23]['s']

CHUNKS = [(0, 3), (4, 6), (7, 10), (11, 13), (14, 17), (18, 19), (20, 22), (23, 25), (26, 30), (31, 34),
          (35, 37), (38, 41), (42, 43), (44, 45), (46, 49), (50, 50), (51, 52), (53, 55), (56, 58),
          (59, 61), (62, 64), (65, 66), (67, 70), (71, 74), (75, 78), (79, 82), (83, 83), (84, 85),
          (86, 88), (89, 90), (91, 94), (95, 97), (98, 99), (100, 102), (103, 105), (106, 109),
          (110, 112), (113, 115), (116, 118), (119, 121), (122, 125), (126, 129), (130, 131),
          (132, 133), (134, 137), (138, 138), (139, 142), (143, 144), (145, 148), (149, 152),
          (153, 155), (156, 157), (158, 161), (162, 164), (165, 167), (168, 171), (172, 174),
          (175, 177), (178, 179), (180, 182), (183, 185), (186, 188), (189, 192), (193, 196),
          (197, 200), (201, 203), (204, 206), (207, 209), (210, 212), (213, 215), (216, 217),
          (218, 220), (221, 222), (223, 225), (226, 230), (231, 232)]

GOLD = {'perceraian', 'perceraian,', 'narsistik.', 'tiga', 'langkah', 'financial.', 'joint', 'loan',
        'bank.', 'business', 'attachment', 'feelings?', 'simpanan', 'bersama.', 'sendiri', 'berdikari',
        'perlindungan', 'hibah', 'Second,', 'First,', 'terakhir,', 'advisor,', 'DM', 'carry', 'on.',
        'future', 'diri', 'own', 'benefits.', 'money', 'Naja’a', 'Amalina', 'binti', 'Ilias', 'enemy'}
CORAL = {'perselisihan', 'faham,', 'gaduh,', '-tikam,', 'tikam', 'terabai.', 'enemy'}

chunks = []
for k, (a, b) in enumerate(CHUNKS):
    ws = []
    for i in range(a, b + 1):
        if not W[i]['t']:
            continue
        cls = 'c' if W[i]['t'] in CORAL else ('g' if W[i]['t'] in GOLD else '')
        ws.append(dict(i=i, t=W[i]['t'], s=W[i]['s'], e=W[i]['e'], c=cls))
    if not ws:
        continue
    start = ws[0]['s']
    nxt = next((W[i]['s'] for kk in range(k + 1, len(CHUNKS)) for i in range(CHUNKS[kk][0], CHUNKS[kk][1] + 1) if W[i]['t']), ws[-1]['e'] + 0.4)
    end = min(nxt, ws[-1]['e'] + 0.9)
    chunks.append(dict(s=round(start - 0.04, 3), e=round(end - 0.02, 3), w=ws))

# icons
icons = {}
idir = os.path.join(HERE, 'node_modules/lucide-static/icons')
for name in ['coffee', 'users', 'landmark', 'link', 'thumbs-up', 'thumbs-down', 'circle-help', 'swords',
             'check', 'x', 'piggy-bank', 'wallet', 'shield-check', 'heart', 'baby', 'repeat', 'star',
             'message-circle', 'chevrons-down', 'clock', 'trending-up', 'user-check', 'briefcase',
             'message-circle-x', 'zap', 'sparkles', 'circle-check', 'hand-coins', 'arrow-down',
             'bookmark', 'send', 'badge-check', 'user-round-pen', 'heart-crack']:
    svg = open(os.path.join(idir, name + '.svg')).read()
    svg = re.sub(r'<!--.*?-->', '', svg, flags=re.S).strip()
    svg = re.sub(r'\s+', ' ', svg)
    svg = svg.replace('width="24"', '').replace('height="24"', '').replace('stroke-width="2"', 'stroke-width="1.8"')
    icons[name] = svg

segs, speech_end = build()
end_start = W[232]['e'] + 0.35
data = dict(hook=HOOK, words=W, chunks=chunks, icons=icons, endStart=round(end_start, 3),
            total=round(end_start + 3.2, 3), segments=segs)
with open(out_js, 'w') as f:
    f.write('window.DATA = ' + json.dumps(data, ensure_ascii=False) + ';\n')
print('total', data['total'], 'endStart', data['endStart'], 'chunks', len(chunks))
