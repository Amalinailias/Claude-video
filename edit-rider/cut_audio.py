import sys, numpy as np, wave
sys.path.insert(0, sys.argv[1]); from edl import EDL
def load(f):
    w=wave.open(f); return np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768.0
src={1:load(sys.argv[2]+'/a.wav')}
sr=16000; out=[]; t=0; fade=int(0.008*sr)
for c,a,b,z,n in EDL:
    seg=src[c][int(a*sr):int(b*sr)].copy(); seg[:fade]*=np.linspace(0,1,fade); seg[-fade:]*=np.linspace(1,0,fade)
    print(f"{t:6.2f} {t+b-a:6.2f}  {a:.2f}-{b:.2f}  {n}"); t+=b-a; out.append(seg)
o=np.concatenate(out); print('TOTAL', len(o)/sr)
w=wave.open(sys.argv[3],'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((o*32767).astype(np.int16).tobytes())
