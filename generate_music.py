"""
McDonald's Jingle — synthesized dynamic music track (10 s, 44100 Hz, stereo).
Phases mirror the animation:
  0.0–1.2 s  : intro burst / rising arpeggio
  1.2–4.0 s  : main groove  (kick + snare + brass melody)
  4.0–6.2 s  : shine sweep  (shimmer + high melody)
  6.2–8.5 s  : sparkle pulse (full energy)
  8.5–10.0 s : radiant hold / big finale chord
"""

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter
import os

SR   = 44100
DUR  = 10.0
N    = int(SR * DUR)
BPM  = 132
BEAT = 60.0 / BPM   # 0.4545 s

rng  = np.random.default_rng(42)

# ── helpers ───────────────────────────────────────────────────────────────────

def t_arr(dur):
    return np.linspace(0, dur, int(SR * dur), endpoint=False)

def freq(note, octave):
    semis = {"C":0,"C#":1,"D":2,"D#":3,"E":4,"F":5,
             "F#":6,"G":7,"G#":8,"A":9,"A#":10,"B":11}
    return 440.0 * 2 ** ((semis[note] + (octave - 4) * 12) / 12)

def place(buf, sound, pos_s):
    s = int(pos_s * SR)
    e = min(s + len(sound), len(buf))
    buf[s:e] += sound[:e - s]

def adsr(n, a=0.01, d=0.05, s_lev=0.7, r=0.08):
    env = np.zeros(n)
    ai, di, ri = int(a*SR), int(d*SR), int(r*SR)
    si = max(0, n - ai - di - ri)
    ptr = 0
    if ai: env[ptr:ptr+ai] = np.linspace(0, 1, ai); ptr += ai
    if di: env[ptr:ptr+di] = np.linspace(1, s_lev, di); ptr += di
    if si: env[ptr:ptr+si] = s_lev; ptr += si
    if ri and ptr < n: env[ptr:ptr+min(ri,n-ptr)] = np.linspace(s_lev, 0, ri)[:n-ptr]
    return env

def lpf(signal, cutoff, order=4):
    b, a = butter(order, cutoff / (SR / 2), btype='low')
    return lfilter(b, a, signal)

def hpf(signal, cutoff, order=2):
    b, a = butter(order, cutoff / (SR / 2), btype='high')
    return lfilter(b, a, signal)

# ── instruments ───────────────────────────────────────────────────────────────

def kick(dur=0.35):
    t = t_arr(dur)
    f_env = 180 * np.exp(-t * 28) + 50
    wave  = np.sin(2*np.pi * np.cumsum(f_env) / SR)
    env   = np.exp(-t * 12)
    click = np.exp(-t * 200) * 0.4
    return (wave * env + click) * 0.85

def snare(dur=0.18):
    t   = t_arr(dur)
    tone  = np.sin(2*np.pi * 210 * t) * 0.35
    noise = hpf(rng.standard_normal(len(t)) * 0.55, 1500)
    env   = np.exp(-t * 22)
    return (tone + noise) * env * 0.70

def hihat_closed(dur=0.04):
    t = t_arr(dur)
    noise = hpf(rng.standard_normal(len(t)), 8000)
    return noise * np.exp(-t * 80) * 0.25

def hihat_open(dur=0.12):
    t = t_arr(dur)
    noise = hpf(rng.standard_normal(len(t)), 7000)
    return noise * np.exp(-t * 15) * 0.20

def brass(f, dur, amp=0.55):
    """Bright brass/horn tone — odd harmonics with bite."""
    t = t_arr(dur)
    wave = (np.sin(2*np.pi*f*t)       * 1.0 +
            np.sin(2*np.pi*f*2*t)     * 0.6 +
            np.sin(2*np.pi*f*3*t)     * 0.5 +
            np.sin(2*np.pi*f*4*t)     * 0.25+
            np.sin(2*np.pi*f*5*t)     * 0.15)
    wave = np.tanh(wave * 1.4) / 1.4          # soft clip → warmth
    env  = adsr(len(t), a=0.012, d=0.06, s_lev=0.75, r=0.08)
    return wave * env * amp

def synth_lead(f, dur, amp=0.40):
    """Bright synth lead."""
    t = t_arr(dur)
    wave = (np.sin(2*np.pi*f*t)       * 1.0 +
            np.sin(2*np.pi*f*2*t)     * 0.45+
            np.sin(2*np.pi*f*3*t)     * 0.20)
    env  = adsr(len(t), a=0.008, d=0.04, s_lev=0.80, r=0.06)
    return wave * env * amp

def bass_note(f, dur, amp=0.55):
    t = t_arr(dur)
    wave = (np.sin(2*np.pi*f*t) * 0.7 +
            np.sin(2*np.pi*f*2*t)* 0.3)
    env  = adsr(len(t), a=0.010, d=0.08, s_lev=0.60, r=0.10)
    return lpf(wave * env * amp, 400)

def shimmer(f, dur, amp=0.18):
    """Bell-like shimmer for the shine phase."""
    t = t_arr(dur)
    wave = np.sin(2*np.pi*f*t) + np.sin(2*np.pi*f*4.001*t)*0.3
    env  = np.exp(-t * 6)
    return wave * env * amp

def whoosh(dur=2.2, amp=0.22):
    """Rising noise sweep for the shine phase."""
    t = t_arr(dur)
    noise  = rng.standard_normal(len(t))
    cutoff = np.linspace(200, 8000, len(t))
    out    = np.zeros(len(t))
    chunk  = 512
    for i in range(0, len(t), chunk):
        c = int(np.mean(cutoff[i:i+chunk]))
        b, a = butter(2, min(c, SR//2-100)/(SR/2), btype='low')
        out[i:i+chunk] = lfilter(b, a, noise[i:i+chunk])
    env = np.sin(np.linspace(0, np.pi, len(t))) ** 0.5
    return out * env * amp

def impact(dur=0.8, amp=0.70):
    """Big orchestral impact hit."""
    t  = t_arr(dur)
    # Low boom
    boom = np.sin(2*np.pi*60*t) * np.exp(-t*8)
    # Mid brass chord: G major (G B D)
    chord = (np.sin(2*np.pi*freq("G",3)*t) +
             np.sin(2*np.pi*freq("B",3)*t) +
             np.sin(2*np.pi*freq("D",4)*t) +
             np.sin(2*np.pi*freq("G",4)*t)) * 0.25
    # Attack transient
    click = rng.standard_normal(len(t)) * np.exp(-t*60) * 0.15
    env   = adsr(len(t), a=0.003, d=0.15, s_lev=0.5, r=0.4)
    return (boom + chord + click) * env * amp

# ── compose ───────────────────────────────────────────────────────────────────

audio = np.zeros(N)

# ----- Melody sequence -----
# G major scale notes used for the jingle
# Intro arpeggio: G4 B4 D5 G5
intro_arp = [
    (freq("G",4), 0.00, 0.18),
    (freq("B",4), 0.15, 0.18),
    (freq("D",5), 0.30, 0.18),
    (freq("G",5), 0.50, 0.35),
    (freq("D",5), 0.85, 0.25),
]
for f, t0, d in intro_arp:
    place(audio, brass(f, d, amp=0.50), t0)

# Main melody (1.2 – 4.0 s) — upbeat jingle, G major
# "da-da-da-da-daaah" energy
eighth = BEAT / 2   # 0.2273 s
melody_1 = [
    # bar 1
    (freq("G",5), 1.20, eighth*1.5),
    (freq("E",5), 1.50, eighth),
    (freq("D",5), 1.70, eighth),
    (freq("B",4), 1.90, eighth*1.5),
    (freq("G",4), 2.20, eighth),
    # bar 2
    (freq("A",4), 2.42, eighth),
    (freq("B",4), 2.63, eighth),
    (freq("D",5), 2.84, eighth*1.5),
    (freq("G",5), 3.12, eighth*2),
    # fill
    (freq("B",5), 3.55, eighth),
    (freq("G",5), 3.75, eighth*0.8),
]
for f, t0, d in melody_1:
    place(audio, brass(f, d, amp=0.52), t0)

# Bass line (1.2 – 6.2 s) every beat
for b in np.arange(1.2, 6.2, BEAT):
    # Alternate G2 / D2
    fn = freq("G",2) if (round(b/BEAT) % 2 == 0) else freq("D",2)
    place(audio, bass_note(fn, BEAT*0.8), b)

# Shine melody (4.0 – 6.2 s) — higher register synth lead
melody_2 = [
    (freq("B",5), 4.00, eighth*2),
    (freq("D",6), 4.45, eighth),
    (freq("G",6), 4.68, eighth*1.5),
    (freq("E",6), 5.00, eighth),
    (freq("D",6), 5.22, eighth*1.2),
    (freq("B",5), 5.55, eighth*1.5),
    (freq("G",5), 5.90, eighth*1.2),
]
for f, t0, d in melody_2:
    place(audio, synth_lead(f, d, amp=0.45), t0)

# Shimmer hits during shine
for t0, fn in [(4.00, freq("D",7)), (4.50, freq("G",7)),
               (5.00, freq("B",6)), (5.60, freq("G",7))]:
    place(audio, shimmer(fn, 0.8), t0)

# Whoosh sweep during shine
place(audio, whoosh(dur=2.2, amp=0.18), 4.0)

# Sparkle/pulse melody (6.2 – 8.5 s) — punchy stabs
stabs = [
    (freq("G",5), 6.20, 0.15),
    (freq("G",5), 6.42, 0.15),
    (freq("B",5), 6.64, 0.20),
    (freq("D",6), 6.90, 0.25),
    (freq("G",6), 7.18, 0.30),
    (freq("G",5), 7.55, 0.15),
    (freq("A",5), 7.75, 0.15),
    (freq("B",5), 7.95, 0.20),
    (freq("D",6), 8.18, 0.30),
]
for f, t0, d in stabs:
    place(audio, brass(f, d, amp=0.58), t0)

# Big finale impact (8.5 s)
place(audio, impact(dur=1.5, amp=0.75), 8.50)

# Finale chord shimmer (8.5 – 10.0 s)
for f_n, t0 in [(freq("G",5),8.50),(freq("B",5),8.55),(freq("D",6),8.60),(freq("G",6),8.65)]:
    place(audio, synth_lead(f_n, 1.4, amp=0.35), t0)

# ----- Rhythm track -----
# Kicks: on every beat (bars 1.2 – 8.5 s)
for b in np.arange(1.20, 8.5, BEAT):
    place(audio, kick(), b)

# Intro kick
place(audio, kick(dur=0.4), 0.0)

# Snare: beats 2 & 4
for b in np.arange(1.20 + BEAT, 8.5, BEAT):
    if round((b - 1.20) / BEAT) % 2 == 1:
        place(audio, snare(), b)

# Hi-hats: 8th notes
for b in np.arange(1.20, 8.5, BEAT/2):
    if round((b - 1.20) / (BEAT/2)) % 2 == 0:
        place(audio, hihat_closed(), b)
    else:
        place(audio, hihat_open(), b)

# Extra kicks for extra energy in sparkle phase
for b in np.arange(6.20, 8.5, BEAT/2):
    if round((b - 6.20) / (BEAT/2)) % 2 == 1:
        place(audio, kick(dur=0.25), b)

# ----- Master -----
# Normalize + soft clip
audio = audio / (np.max(np.abs(audio)) + 1e-9)
audio = np.tanh(audio * 0.88) * 0.92     # headroom

# Stereo: slight stereo width via tiny delay on right channel
delay = int(0.004 * SR)
left  = audio.copy()
right = np.zeros_like(audio)
right[delay:] = audio[:-delay] * 0.97

stereo = np.stack([left, right], axis=1)
stereo = (stereo * 32767).astype(np.int16)

out_wav = "/home/user/EMO/jingle.wav"
wavfile.write(out_wav, SR, stereo)
print(f"WAV written → {out_wav}  ({os.path.getsize(out_wav)//1024} KB)")
