import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from edl import EDL
try:
    from edl import SPEED_AFTER_HOOK, HOOK_SEGS
except ImportError:
    SPEED_AFTER_HOOK, HOOK_SEGS = 1.0, 0
HOOK = 0.0
def build():
    segs=[]; t=HOOK
    for i,e in enumerate(EDL):
        c,a,b,z,n = e[:5]; o = e[5] if len(e) > 5 else {}
        sp = SPEED_AFTER_HOOK if i >= HOOK_SEGS else 1.0
        d = (b - a) / sp
        segs.append(dict(i=i,clip=c,src_in=a,src_out=b,zoom=z,note=n,out_in=round(t,4),out_out=round(t+d,4),speed=sp,
                         face=o.get("face"), ps=bool(o.get("ps")), mute=bool(o.get("mute")))); t+=d
    return segs, t
if __name__=='__main__':
    s,e=build(); print('speech ends at', round(e,2)); [print(x['i'], x['out_in'], x['out_out']) for x in s]
