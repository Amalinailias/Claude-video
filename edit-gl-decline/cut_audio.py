import sys, numpy as np, wave
sys.path.insert(0, sys.argv[1]); from edl import EDL
def load(f):
    w=wave.open(f); return np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768.0
src={1:load(sys.argv[2]+'/a1.wav')}
sr=16000; out=[]; fade=int(0.008*sr)
for e in EDL:
    c,a,b = e[:3]
    seg=src[c][int(a*sr):int(b*sr)].copy(); seg[:fade]*=np.linspace(0,1,fade); seg[-fade:]*=np.linspace(1,0,fade); out.append(seg)
o=np.concatenate(out); print('TOTAL', len(o)/sr)
w=wave.open(sys.argv[3],'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((o*32767).astype(np.int16).tobytes())
