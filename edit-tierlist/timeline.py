import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from edl import EDL
HOOK = 2.0   # silent tier-list pre-roll before her first line
def build():
    segs=[]; t=HOOK
    for i,e in enumerate(EDL):
        c,a,b,z,n = e[:5]; o = e[5] if len(e) > 5 else {}
        segs.append(dict(i=i,clip=c,src_in=a,src_out=b,zoom=z,note=n,out_in=round(t,4),out_out=round(t+b-a,4),
                         mute=bool(o.get('mute')), frame=o.get('frame'))); t+=b-a
    return segs, t
if __name__=='__main__':
    print('speech ends at', round(build()[1],2))
