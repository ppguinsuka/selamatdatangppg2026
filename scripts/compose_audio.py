"""Original 204s instrumental score & procedural sound-design, synthesized without third-party audio assets.
Generates MP3 with ffmpeg; WAV intermediates removed.
"""
import wave, numpy as np, math, subprocess
from pathlib import Path
P=Path(__file__).resolve().parents[1]/'public/media/audio'; P.mkdir(exist_ok=True,parents=True)
SR=22050; LENGTH=204; CHUNK=2; BPM=93; beat=60/BPM
# section timing is intentionally identical to scene data.
sections=[(0,15,.67),(15,50,.64),(50,95,.72),(95,116,.69),(116,149,.76),(149,194,1.0),(194,204,.75)]
# Am7, Fmaj7, Cadd9, Gsus4 original instrumental chord design
roots=[45,41,48,43]; semitones=[0,4,7,11]
rng=np.random.default_rng(2026)

def smoothstep(x):
 x=np.clip(x,0,1);return x*x*(3-2*x)

def freq(midi):return 440*2**((midi-69)/12)

def envelope(t):
    a=np.zeros_like(t)
    for st,en,val in sections:
      mask=(t>=st)&(t<en)
      a[mask]=val
    # short intro and finish envelopes
    a*=smoothstep(t/4)*smoothstep((LENGTH-t)/3)
    return a

def original_score(t):
    amp=envelope(t)
    progression=np.floor(t/(8*beat)).astype('int32')%4
    roots_arr=np.take(roots,progression)
    chord=np.zeros_like(t)
    # independent phase layers are continuous; slight harmonic motion from LFO
    for delta,gain in zip(semitones,[.25,.18,.15,.09]):
      pitch=440*2**(((roots_arr+delta)-69)/12)
      p=2*np.pi*t*pitch
      chord+=gain*(np.sin(p)+.15*np.sin(p*1.005)+.08*np.sin(2*p))
    pad=chord*(.45+.12*np.sin(2*np.pi*t/14))
    # Rhythmic arpeggio, soft plucky bells
    substep=beat/2
    idx=np.floor(t/substep).astype('int32')
    phase=(t%substep)/substep
    arpdelta=np.take([0,7,4,11,7,4,12,11],idx%8)
    arpitch=440*2**(((roots_arr+arpdelta+12)-69)/12)
    bell=np.sin(2*np.pi*arpitch*t)*np.exp(-5.5*phase)*.19
    # syncopated bass pulses
    basspitch=440*2**(((roots_arr-12)-69)/12)
    bass=np.sin(2*np.pi*basspitch*t)*np.exp(-3.5*((t%beat)/beat))*.14
    # soft beat accents with deterministic noise; avoid identical section noise by seed stream
    beatphase=(t%beat)/beat
    percuss=.075*np.sin(2*np.pi*(55*t))*np.exp(-26*beatphase)
    hiss=rng.normal(0,1,len(t))*.018*np.exp(-35*((t%(2*beat))/(2*beat)))
    # Rising melodic motif, plays differently by scene intensity
    melody=np.sin(2*np.pi*440*2**(((roots_arr+19)-69)/12)*t)*np.exp(-6*phase)*.032
    out=(pad+bell+bass+percuss+hiss+melody)*amp
    return np.tanh(out*1.35)*.62

# timed foley cues; opening and transitions; all generated from shaped noise/sine
EVENTS=[(1.1,'riser'),(4.5,'impact'),(7.2,'shimmer'),(10.6,'impact'),
        (15,'riser'),(50,'riser'),(95,'riser'),(116,'riser'),(149,'riser'),(194,'riser'),(202,'impact')]
# add per-person whooshes and title sparkles, not during overly short shots
for start, count, base in [(19,4,7),(54,5,7),(99,2,7),(119,4,7)]:
  for i in range(count):
    EVENTS.extend([(start+i*base,'whoosh'),(start+i*base+1.4,'chime')])
for tick in [153,156,160,166,172,178,184,189]: EVENTS.append((tick,'data'))

def foley(t):
    out=np.zeros_like(t)
    for st,ty in EVENTS:
      dt=t-st
      if ty=='riser':
        # rising swish starts up to 1.8 seconds before boundary
        dx=t-(st-1.9);m=(dx>0)&(dx<1.9)
        if np.any(m):
          z=dx[m]/1.9
          noise=rng.normal(0,1,len(z))
          out[m]+=(noise*.10+np.sin(2*np.pi*(180*z+650*z*z))*.095)*smoothstep(z)
      elif ty=='whoosh':
        m=(dt>=-.20)&(dt<.64)
        if np.any(m):
          z=(dt[m]+.2)/.84
          noise=rng.normal(0,1,len(z))
          out[m]+=noise*.13*np.sin(np.pi*z)**2
      elif ty=='chime':
        m=(dt>=0)&(dt<1.25)
        if np.any(m):
          z=dt[m]; env=np.exp(-3.8*z)
          out[m]+=(np.sin(2*np.pi*1046.5*z)+.5*np.sin(2*np.pi*1568*z))*env*.12
      elif ty=='impact':
        m=(dt>=0)&(dt<2.3)
        if np.any(m):
          z=dt[m]
          boom=np.sin(2*np.pi*(64-15*z)*z)*np.exp(-3*z)*.44
          noise=rng.normal(0,1,len(z))*np.exp(-17*z)*.07
          out[m]+=boom+noise
      elif ty=='shimmer':
        m=(dt>=0)&(dt<1.8)
        if np.any(m):
          z=dt[m];out[m]+=(np.sin(2*np.pi*940*z)+.5*np.sin(2*np.pi*1480*z))*np.exp(-2*z)*.09
      elif ty=='data':
        m=(dt>=0)&(dt<.17)
        if np.any(m):
          z=dt[m];out[m]+=np.sin(2*np.pi*(590+1500*z)*z)*np.exp(-25*z)*.11
    return np.tanh(out)

def write_file(name,func):
    temp=P/(name+'.wav'); final=P/(name+'.mp3')
    with wave.open(str(temp),'wb') as w:
      w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
      for sec in range(0,LENGTH,CHUNK):
        tt=np.arange(sec*SR,min(LENGTH,sec+CHUNK)*SR,dtype=np.float64)/SR
        mono=func(tt)
        # natural stereo breadth by tiny changing difference, not abrupt phase reversal
        left=mono*(.97+.02*np.sin(tt*.12))
        right=mono*(.96+.025*np.cos(tt*.10))
        stereo=np.stack([left,right],axis=1)
        w.writeframes((np.clip(stereo,-.98,.98)*32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(temp),'-c:a','libmp3lame','-b:a','192k',str(final)],check=True)
    temp.unlink()
    print(final.name,final.stat().st_size)
write_file('original-score-204s',original_score)
write_file('cinematic-sfx-204s',foley)
