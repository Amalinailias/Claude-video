import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from edl import EDL
HOOK = 0.0   # the hook is the first spoken line itself (tiny text -> big title)
def build():
    segs=[]; t=HOOK
    for i,(c,a,b,z,n) in enumerate(EDL):
        segs.append(dict(i=i,clip=c,src_in=a,src_out=b,zoom=z,note=n,out_in=round(t,4),out_out=round(t+b-a,4))); t+=b-a
    return segs, t
if __name__=='__main__':
    print('speech ends at', round(build()[1],2))
