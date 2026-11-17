"""Horloge à foliot — score, foley and mix -> out/mix.wav (+ out/stems/).
120 BPM (one beat = one beat of the foliot), E minor, resolving to E major at 48 s.
Instruments of the style's palette: marimba, vibraphone (soft, hard, bowed), glockenspiel, glass, a round bass, a short synth kick.
Foley is synthesised and placed from events.json (window.EV): ticks of the escapement, landings, lifts, swooshes.
Run: LIB=<library> python mix.py
"""
import os, sys, json, re
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ['LIB']
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, noise, lp, hp, bp, env_exp, t_, norm, limit, creak

S.seed(12)
EVJ = json.load(open(os.path.join(HERE, 'events.json')))
DUR = EVJ['dur']; EV = EVJ['ev']
# the section times come from the single timeline (src/timeline.js)
src = open(os.path.join(HERE, 'src/timeline.js')).read()
T = {k: float(v) for k, v in re.findall(r'^\s+(\w+):\s+([\d.]+),', src[src.index('export const T'):src.index('};', src.index('export const T'))], re.M)}
BEAT, BAR = .5, 2.0
N = int((DUR + 1.5) * SR)
def buf(): return np.zeros((N, 2), np.float32)
def b(bar, beat=0): return (bar - 1) * BAR + beat * BEAT
rng = np.random.default_rng(9)
def up(p, n): return S.name(S.midi(p) + 12 * n)

# ---------------- score ----------------
# chords per bar (2 s): E minor colours; D section a rising loop; E section to the picardy E major at 48 s
CH = {
    'Em9': ['E3', 'G3', 'B3', 'D4', 'F#4'], 'Cmaj7': ['C3', 'E3', 'G3', 'B3', 'D4'], 'Am9': ['A2', 'C3', 'E3', 'G3', 'B3'],
    'B7sus': ['B2', 'E3', 'F#3', 'A3', 'C#4'], 'B7': ['B2', 'D#3', 'F#3', 'A3', 'C#4'], 'G': ['G2', 'B2', 'D3', 'F#3', 'A3'],
    'D': ['D3', 'F#3', 'A3', 'C#4', 'E4'], 'E': ['E3', 'G#3', 'B3', 'D#4', 'F#4'],
}
ROOT = {'Em9': 'E2', 'Cmaj7': 'C2', 'Am9': 'A1', 'B7sus': 'B1', 'B7': 'B1', 'G': 'G1', 'D': 'D2', 'E': 'E2'}
PROG = {1: 'Em9', 2: 'Em9', 3: 'Cmaj7',                                   # A · the weight
        4: 'Em9', 5: 'Cmaj7', 6: 'G', 7: 'D', 8: 'B7sus',                  # B · building
        9: 'Em9', 10: 'Cmaj7', 11: 'Am9', 12: 'B7', 13: 'Em9', 14: 'Cmaj7', 15: 'B7sus',   # C · running (15: ticks only)
        16: 'Em9', 17: 'Cmaj7', 18: 'G', 19: 'D', 20: 'Em9', 21: 'Cmaj7',  # D · opening while running
        22: 'Am9', 23: 'D', 24: 'B7', 25: 'E'}                             # E · settling, E major at 48 s
ev = []        # (t, inst, pitch, dur, vel, pan, gain)
kick_t = []
for bar in range(1, 26):
    t0 = b(bar); c = CH[PROG[bar]]; r = ROOT[PROG[bar]]
    if bar <= 3:                                   # A: glass and a low bowed chord; one round bass note per bar
        ev.append((t0, 'vibraphone_bowed', c[1], BAR * 1.05, .30, -.25, .8))
        ev.append((t0 + .05, 'vibraphone_bowed', c[3], BAR * 1.05, .28, .25, .7))
        ev.append((t0, 'electric_bass', r, BAR * .9, .55, 0, .9))
        for k, idx in [(1.0, 4), (2.5, 2)]: ev.append((t0 + k * BEAT, 'glass', up(c[idx], 1), 1.6, .3, .3 - .2 * k, .45))
    elif bar <= 8:                                 # B: rising vibraphone arpeggios, soft pulse; stops before the silence
        for i in range(8):
            t = t0 + i * BEAT / 2
            if t >= T['lastLand'] + .05: break
            ev.append((t, 'vibraphone', up(c[[0, 1, 2, 3, 4, 3, 2, 1][i]], 1), .9, .34 + .08 * (i % 4 == 0), -.35 + .1 * i, .9))
        if t0 < T['lastLand']:
            ev.append((t0, 'electric_bass', r, BEAT * 1.8, .62, 0, 1.0)); ev.append((t0 + 2.5 * BEAT, 'electric_bass', r, BEAT * .9, .5, 0, .9))
            ev.append((t0, 'vibraphone_bowed', c[2], BAR, .26, 0, .55))
    elif bar <= 14:                                # C: marimba locked on the ticks, bass, kick on 1 and 3
        for i in range(8):
            t = t0 + i * BEAT / 2
            p = up(c[[0, 2, 4, 2, 1, 3, 4, 3][i]], 1)
            ev.append((t, 'marimba', p, .3, .36 + .16 * (i % 2 == 0), [-.3, .3][i % 2], .8))
        for k, d in [(0, 1.4), (1.5, .45), (2, .9), (3, .45), (3.5, .45)]: ev.append((t0 + k * BEAT, 'electric_bass', r, d * BEAT, .66, 0, 1.0))
        for k in (0, 2): kick_t.append((t0 + k * BEAT, .8))
        if bar % 2 == 1: ev.append((t0, 'vibraphone_bowed', c[3], BAR * 2, .28, .2, .6))
    elif bar == 15:
        pass                                       # ticks only
    elif bar <= 21:                                # D: tutti, marimba 16ths, hard vibraphone, glockenspiel answers, four on the floor
        for i in range(16):
            t = t0 + i * BEAT / 4
            p = up(c[[0, 2, 4, 2, 1, 3, 4, 3][i % 8]], 1 + (i % 8 == 2))
            ev.append((t, 'marimba', p, .25, .4 + .2 * (i % 4 == 0), [-.35, .35][i % 2], .85))
        for j, k in enumerate((0, 1.5, 3)): ev.append((t0 + k * BEAT, 'vibraphone_hard', up(c[[1, 3, 4][j]], 1), 1.2, .42, .4 - .4 * j, .55))
        for k, d in [(0, 1.4), (1.5, .45), (2, .9), (3, .45), (3.5, .45)]: ev.append((t0 + k * BEAT, 'electric_bass', r, d * BEAT, .72, 0, 1.1))
        for k in (0, 1, 2, 3): kick_t.append((t0 + k * BEAT, .9 if k % 2 == 0 else .6))
        if bar % 2 == 0:
            for k, idx in [(.5, 4), (2.5, 3)]: ev.append((t0 + k * BEAT, 'glockenspiel', up(c[idx], 2), 1.5, .38, .3, .4))
    else:                                          # E: thinning towards the picardy chord
        if bar < 25:
            for i in range(8):
                t = t0 + i * BEAT / 2
                ev.append((t, 'marimba', up(c[[0, 2, 4, 2, 1, 3, 4, 3][i]], 1), .3, .34 + .12 * (i % 2 == 0), [-.3, .3][i % 2], .9 - .12 * (bar - 22)))
            ev.append((t0, 'vibraphone_bowed', c[2], BAR * 1.05, .32, -.2, .7)); ev.append((t0, 'vibraphone_bowed', c[4], BAR * 1.05, .3, .2, .6))
            ev.append((t0, 'electric_bass', r, BAR * .8, .62, 0, 1.0))
            for k in (0, 2): kick_t.append((t0 + k * BEAT, .6))
        else:                                      # 48.0: E major
            tr = T['resolve']; kick_t.append((tr, 1.0))
            for j, p in enumerate(['E2', 'B2', 'E3', 'G#3', 'B3', 'E4', 'G#4']): ev.append((tr + j * .04, 'marimba', p, 2.5, .6, -.45 + .15 * j, .9))
            for p in ['G#3', 'B3', 'E4']: ev.append((tr, 'vibraphone_bowed', p, 3.2, .42, 0, .8))
            ev.append((tr, 'electric_bass', 'E1', 2.4, .7, 0, 1.0))
            for k, p in [(1, 'B5'), (2, 'G#5'), (3, 'E6')]: ev.append((tr + k * BEAT, 'glockenspiel', p, 2, .36, .25, .4))
# B: one glockenspiel note per landing, rising with the energy (E minor pentatonic)
PENTA = ['E5', 'G5', 'A5', 'B5', 'D6', 'E6', 'G6', 'A6', 'B6', 'D7', 'E7', 'G7', 'A7', 'B7']
lands = sorted([e for e in EV if e['type'] == 'land'], key=lambda e: e['t'])
for i, e in enumerate(lands): ev.append((e['t'], 'glockenspiel', PENTA[min(i, len(PENTA) - 1)] if i < 9 else PENTA[8 - (i - 8) % 2], 1.6, .42, e['pan'] * .6, .5))

music = S.render([e for e in ev if e[0] < DUR], dur=N / SR, master=False)
music = np.asarray(music, np.float32)
music = np.pad(music, ((0, max(0, N - len(music))), (0, 0)))[:N]

def kick(v=1.0):
    d = .4; tt = t_(d); f = 52 + 85 * np.exp(-tt / .03)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env_exp(d, .13) + np.sin(2 * ph) * .3 * env_exp(d, .05) + hp(noise(d), 3000) * env_exp(d, .003) * .2
    return norm(x) * v
pulse = buf()
for t, v in kick_t: add(pulse, kick(v), t, .5)

# ---------------- foley ----------------
fol = buf()
def metal(f=2400, v=1.0, d=.9, partials=((1, 1, .35), (2.76, .5, .18), (5.4, .25, .09), (8.9, .12, .05))):
    tt = t_(d)
    x = sum(a * np.sin(2 * np.pi * f * k * tt + rng.random() * 6) * env_exp(d, tau) for k, a, tau in partials)
    return norm(x + hp(noise(d), 5000) * env_exp(d, .0015) * .6) * v
def tick(top=True, v=1.0):                     # a crown-wheel tooth dropping on a steel pallet: click + small inharmonic ring
    d = .22; tt = t_(d); f = 3150 if top else 2650
    f *= 1 + rng.normal(0, .006)
    x = hp(noise(d), 3500) * env_exp(d, .0009) * 1.1
    x += sum(a * np.sin(2 * np.pi * f * k * tt) * env_exp(d, tau) for k, a, tau in [(1, .6, .028), (1.83, .35, .016), (2.9, .2, .01)])
    x += np.sin(2 * np.pi * 760 * tt) * env_exp(d, .012) * .35          # the body of the clock answering
    return norm(x) * v
def thud(v=1.0, f=70):
    d = .45; tt = t_(d)
    return norm(np.sin(2 * np.pi * f * tt * (1 - .2 * tt)) * env_exp(d, .09) + lp(noise(d), 400) * env_exp(d, .025) * .6) * v
def swoosh(d=.8, v=1.0, rise=True):
    n = noise(d); out = np.zeros_like(n); tt = t_(d)
    for i in range(0, len(n), 480):
        hi = min(len(n), i + 480); u = i / len(n); u = u if rise else 1 - u
        f = 280 + 3000 * u ** 1.5; seg_ = bp(n[max(0, i - 2400):hi], f * .6, f * 1.4)[-(hi - i):]; out[i:hi] = seg_
    return norm(out * np.sin(np.pi * tt / d) ** 1.5) * v

HEAVY = {'drum': (1900, 64), 'wheelD': (2300, 0), 'plate': (1500, 58), 'pin1': (4200, 0), 'wheelE': (2700, 0), 'bridge': (1700, 0),
         'dial': (1300, 66), 'hand': (5200, 0), 'pin2': (4500, 0), 'crown': (2500, 0), 'cock': (3600, 0), 'verge': (3900, 0),
         'potence': (2000, 0), 'foliot': (2900, 72)}
for e in EV:
    t, ty, pan = e['t'], e['type'], e.get('pan', 0) * .7
    if ty == 'tick': add(fol, tick(e['top']), t, .62, (.12 if e['top'] else -.12))
    elif ty == 'arrive': add(fol, swoosh(.95, 1, False), t, .08, pan)
    elif ty == 'land':
        f, th = HEAVY[e['part']]
        add(fol, metal(f, 1, .9), t, .14, pan)
        if th: add(fol, thud(1, th), t, .22, pan)
    elif ty == 'lift': add(fol, swoosh(1.3, 1, True), t - .1, .1, pan)
    elif ty == 'wake': add(fol, swoosh(.5, 1, True), t, .05)
    elif ty == 'open': add(fol, thud(1.2, 60), t, .4); add(fol, metal(1600, 1, 1.6), t, .12, -.2)
    elif ty == 'resolve': add(fol, metal(1320, 1, 2.6, ((1, 1, .9), (2.76, .4, .4), (5.4, .2, .2))), t, .1)
# the weight: two creaks of the cord in the opening
for t in (2.0, 4.0): add(fol, creak(.8), t, .1, .1)
# room tone
bed = lp(np.cumsum(noise(N / SR)) * .002, 300); bed -= np.convolve(bed, np.ones(4800) / 4800, 'same'); bed = norm(bed) * .5
bedmix = (bed * .03)[:, None] * np.ones((1, 2))

# ---------------- silences (music only; ticks keep going in the second) ----------------
def gate(a, z, fade=.15):
    g = np.ones(N, np.float32); i0, i1, f = int(a * SR), int(z * SR), int(fade * SR)
    g[i0:i1] = 0; g[max(0, i0 - f):i0] *= np.linspace(1, 0, min(f, i0)); g[i1:i1 + f] *= np.linspace(0, 1, f)
    return g[:, None]
sil = gate(T['lastLand'] + .55, T['run'] - .01, .35) * gate(T['breathe'] + .05, T['open'] - .01)
music *= sil; pulse *= sil

def rms(x): return float(np.sqrt(np.mean(x ** 2)) + 1e-12)
mus = music * .9 + pulse
for c in range(2): mus[:, c] = hp(mus[:, c], 62, 4); fol[:, c] = hp(fol[:, c], 45, 2)
mix = mus * .5 + fol * .9 + bedmix
for c in range(2): mix[:, c] = limit(mix[:, c], .92)
os.makedirs(os.path.join(HERE, 'out/stems'), exist_ok=True)
end = int(DUR * SR); tail = int(.8 * SR)
mix = mix[:end]; mix[-tail:] *= np.linspace(1, 0, tail)[:, None] ** 2
sf.write(os.path.join(HERE, 'out/mix.wav'), mix, SR, subtype='PCM_24')
for nm, x in [('music', mus * .5), ('foley', fol * .9)]: sf.write(os.path.join(HERE, f'out/stems/{nm}.wav'), x[:end], SR, subtype='PCM_24')
spec = np.abs(np.fft.rfft(mix[:, 0])); fr = np.fft.rfftfreq(len(mix), 1 / SR)
low = 10 * np.log10(spec[(fr > 20) & (fr < 60)].__pow__(2).sum() / spec[fr > 20].__pow__(2).sum())
print(f'mix {DUR:.2f}s  music rms {20*np.log10(rms((mus*.5)[:end])):.1f} dBFS  foley rms {20*np.log10(rms((fol*.9)[:end])):.1f}  peak {np.abs(mix).max():.2f}  20-60 Hz {low:.1f} dB')
names = sorted({e[1] for e in ev})
open(os.path.join(HERE, 'out/instruments.txt'), 'w').write('\n'.join(names) + '\n' + '\n'.join(S.credits(names)) + '\n')
