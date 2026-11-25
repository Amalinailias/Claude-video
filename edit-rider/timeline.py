import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from edl import EDL
# BTS hook rebuilt from the 4K source (same footage as the user's CapCut clip, offset +0.6 s)
# (src_in, src_out, zoom, look)  look: 'bw' = film black & white, 'color'
HOOK_EDL = [
    (1.00, 4.45, 1.20, 'bw'),     # sitting -> leans toward camera
    (4.45, 5.15, 1.20, 'bw'),     # hand covers the lens (natural wipe)
    (6.25, 8.05, 1.15, 'color'),  # colour reveal: lean-in smile, thumbs up, sits back
]
HOOK = round(sum(b - a for a, b, z, l in HOOK_EDL), 4)
BW_END = round(sum(b - a for a, b, z, l in HOOK_EDL if l == 'bw'), 4)
def hook_segments():
    out, t = [], 0.0
    for a, b, z, l in HOOK_EDL:
        out.append(dict(clip=1, src_in=a, src_out=b, zoom=z, look=l, out_in=round(t, 4), out_out=round(t + b - a, 4))); t += b - a
    return out
def build():
    segs=[]; t=HOOK
    for i,(c,a,b,z,n) in enumerate(EDL):
        segs.append(dict(i=i,clip=c,src_in=a,src_out=b,zoom=z,note=n,out_in=round(t,4),out_out=round(t+b-a,4))); t+=b-a
    return segs, t
if __name__=='__main__':
    segs,end=build()
    print('hook', HOOK, 'bw_end', BW_END, 'speech ends at', round(end,2))
