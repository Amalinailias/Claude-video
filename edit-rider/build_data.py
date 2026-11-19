"""Builds gfx/data.js for video 2 (AIA rider / % of disability)."""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from timeline import build, HOOK  # noqa

words_json, out_js = sys.argv[1], sys.argv[2]
words = json.load(open(words_json))

FIX = {}
W = []
for i, w in enumerate(words):
    txt = FIX.get(i, w['w'].strip())
    W.append(dict(t=txt, s=round(w['s'] + HOOK, 3), e=round(w['e'] + HOOK, 3)))

CHUNKS = [(0, 2), (3, 6), (7, 10), (11, 13), (14, 16), (17, 19), (20, 22), (23, 23), (24, 28), (29, 31),
          (32, 36), (37, 38), (39, 41), (42, 46), (47, 51), (52, 55), (56, 58), (59, 61), (62, 63), (64, 67),
          (68, 70), (71, 74), (75, 76), (77, 79), (80, 84), (85, 88), (89, 93)]
GOLD_IDX = {6, 8, 13, 16, 19, 21, 28, 40, 41, 46, 55, 59, 61, 74, 76, 78, 82, 84, 87, 90}
CORAL_IDX = {68, 70}

chunks = []
for k, (a, b) in enumerate(CHUNKS):
    ws = []
    for i in range(a, b + 1):
        cls = 'c' if i in CORAL_IDX else ('g' if i in GOLD_IDX else '')
        ws.append(dict(i=i, t=W[i]['t'], s=W[i]['s'], e=W[i]['e'], c=cls))
    nxt = W[CHUNKS[k + 1][0]]['s'] if k + 1 < len(CHUNKS) else ws[-1]['e'] + 0.4
    end = min(nxt, ws[-1]['e'] + 0.9)
    chunks.append(dict(s=round(ws[0]['s'] - 0.04, 3), e=round(end - 0.02, 3), w=ws))

icons = {}
idir = os.path.join(HERE, 'node_modules/lucide-static/icons')
for name in ['eye', 'ear', 'hand', 'accessibility', 'calendar-days', 'percent', 'shield-check', 'scroll-text', 'circle-check',
             'message-circle', 'chevrons-down', 'briefcase', 'lightbulb', 'badge-check', 'check', 'x', 'hand-coins', 'ambulance',
             'circle-help', 'calculator', 'table-2', 'mic-off', 'footprints', 'ruler', 'user-x', 'sparkles']:
    svg = open(os.path.join(idir, name + '.svg')).read()
    svg = re.sub(r'<!--.*?-->', '', svg, flags=re.S).strip()
    svg = re.sub(r'\s+', ' ', svg)
    svg = svg.replace('width="24"', '').replace('height="24"', '').replace('stroke-width="2"', 'stroke-width="1.8"')
    icons[name] = svg

segs, speech_end = build()
end_start = W[-1]['e'] + 0.35
data = dict(hook=HOOK, words=W, chunks=chunks, icons=icons, endStart=round(end_start, 3),
            total=round(end_start + 3.4, 3), segments=segs)
with open(out_js, 'w') as f:
    f.write('window.DATA = ' + json.dumps(data, ensure_ascii=False) + ';\n')
print('total', data['total'], 'endStart', data['endStart'], 'chunks', len(chunks), 'speech_end', round(speech_end, 2))
