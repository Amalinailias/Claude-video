import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from edl import EDL
HOOK = 4.6
def build():
    segs=[]; t=HOOK
    for i,(c,a,b,z,n) in enumerate(EDL):
        segs.append(dict(i=i,clip=c,src_in=a,src_out=b,zoom=z,note=n,out_in=round(t,4),out_out=round(t+b-a,4))); t+=b-a
    return segs, t
if __name__=='__main__':
    segs,end=build()
    json.dump(dict(hook=HOOK,segments=segs,speech_end=end),open(sys.argv[1],'w'),indent=1)
    print('speech ends at',round(end,2))
