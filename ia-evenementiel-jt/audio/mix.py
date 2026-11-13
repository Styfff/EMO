"""EXPO INFO « L'IA s'installe » (adapté du mix de la démo Broadcast News Package) · score + foley + voice → out/mix.wav (48 kHz stereo; mux.sh brings it to −14 LUFS)
Score: E-minor news theme, 120 BPM, beat 0 = 1.5 s (the sting stands before the grid).
Sections : sommaire + sujet 1 (plein) → sujet 2 tendu, un temps de silence à 22,0 puis le tampon à 22,5 → sujet 3 en sol majeur
→ récapitulatif → tutti en mi majeur à 40,0 sur le carton de fin.
Run: $LIB/.venv/bin/python mix.py"""
import json, os, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.environ.get('LIB', os.path.abspath(os.path.join(HERE, '../../..')))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
import sfx as X
import sampler as S

SR = X.SR
EVD = json.load(open(os.path.join(HERE, 'events.json')))
DUR, EV = EVD['dur'], EVD['ev']
N = int(DUR * SR) + SR
music = np.zeros((N, 2), np.float32); fx = np.zeros((N, 2), np.float32); vo = np.zeros((N, 2), np.float32)
tt = np.arange(N) / SR

BPM, T0 = 120, 1.5
B = 60 / BPM
def bt(k): return T0 + k * B

NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11, 'F#': 6, 'D#': 3, 'G#': 8}
# one bar = 2 s; bar k starts at 1.5 + 2k
CH = ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B',  # 1.5–17.5 sommaire, sujet 1
      'Am', 'B', 'Em', 'B',                        # 17.5–25.5 sujet 2 (tendu)
      'G', 'D', 'Em', 'C', 'G', 'D',               # 25.5–37.5 sujet 3 (élévation en majeur)
      'Em', 'C', 'B', 'B']                         # 37.5–45.5 récapitulatif → fin
def triad(ch, octv):
    q = 'm' if ch.endswith('m') else ''; root = ch.rstrip('m')
    r = 12 * (octv + 1) + NOTE[root]; return [r, r + (3 if q == 'm' else 4), r + 7]

SIL = (22.0, 22.5)          # un temps de silence avant le tampon EN TÊTE
DRONE = (99, 99)
def state(t):
    if SIL[0] <= t < SIL[1] or DRONE[0] <= t < DRONE[1]: return 'off'
    if t < 17.0: return 'full'
    if t < 25.0: return 'tense'
    if t < 36.0: return 'mid'
    if t < 40.0: return 'full'
    return 'off'

M = []
def ev(t, inst, pitch, dur, vel, pan=0, gain=1.0, **kw): M.append(dict(t=t, inst=inst, pitch=pitch, dur=dur, vel=vel, pan=pan, gain=gain, **kw))
stab = lambda t, notes, v=.9, d=.35: [ev(t, ins, n + o, d, v, pan, g) for ins, o, pan, g in [('trumpet_stac', 12, .15, .9), ('horn_stac', 0, -.2, 1.0), ('trombone_stac', -12, .05, 1.0)] for n in notes]

# —— sting ——
for i, p in enumerate([64, 67, 71, 76]): ev(i * .02, 'violins_trem', p, .42, .25 + i * .05, (i - 1.5) * .2, .5, attack=.35)
stab(.4, [64, 67, 71], .95, .5)
ev(.4, 'timpani', 'E3', 1, .95, 0, 1.3); ev(.4, 'bass_drum', None, None, .9, 0, 1.1); ev(.4, 'crash', None, None, .7, .1, .7)
for i, p in enumerate([76, 83, 79, 88]): ev(.82 + i * .1, 'glockenspiel', p, .6, .55, .3 - i * .2, .7)

END = 39.95
for bar, ch in enumerate(CH):
    tb = bt(bar * 4)
    if tb >= END: break
    tri = triad(ch, 3)
    pat = [tri[0] + 12, tri[2] + 12, tri[0] + 24, tri[2] + 12]
    for k in range(8):  # spiccato violins, eighths
        t = tb + k * B / 2; st = state(t)
        if st == 'off' or t >= END: continue
        if st == 'sparse' and k % 2: continue
        v = (.42 if k % 2 == 0 else .32) * (.8 if st == 'sparse' else 1)
        ev(t, 'violins_spic', pat[k % 4] - (12 if st == 'tense' else 0), .2, v, .25, .55)
    for k in range(4):  # pizzicato bass on the beat
        t = tb + k * B; st = state(t)
        if st == 'off' or t >= END: continue
        ev(t, 'contrabass_pizz', tri[0] - 12, .4, .72 if k == 0 else .5, -.1, .9)
        if st == 'sparse' and k in (0, 2): ev(t, 'cellos_pizz', tri[1], .4, .45, .2, .5)
    st0 = state(tb + .6)
    if st0 in ('full', 'sparse', 'mid'):
        ev(tb, 'horn', tri[1], 2.0, .3, -.25, .5, attack=.25); ev(tb, 'horn', tri[2], 2.0, .28, .25, .45, attack=.25)
    if st0 == 'tense' and not (SIL[0] - 2 < tb < SIL[1]):
        ev(tb, 'violins_trem', tri[0] + 12, 2.0, .3, -.2, .45, attack=.2); ev(tb, 'violins_trem', tri[2] + 12, 2.0, .28, .2, .4, attack=.2)
    for k in range(4):  # drums
        t = tb + k * B; st = state(t)
        if st == 'off' or t >= END: continue
        if st == 'tense': ev(t, 'bass_drum', None, None, .5, 0, .7)
        elif st != 'sparse':
            if k in (0, 2): ev(t, 'bass_drum', None, None, .55, 0, .7)
            if k in (1, 3) and t > 3.4: ev(t, 'snare2', None, None, .35, .1, .35)
        elif k == 0: ev(t, 'bass_drum', None, None, .4, 0, .55)

# rundown rows
for t, n in ((3.0, 76), (3.5, 79), (4.0, 83)): ev(t, 'glockenspiel', n, .5, .5, .2, .55)
# cuts: timpani on every story change and hard cut
for t in (6.0, 12.5, 17.0, 25.0, 30.5, 36.0): ev(t, 'timpani', 'E3', 1, .7, 0, .9)
stab(6.0, [64, 67, 71], .75, .3)
# the break
stab(22.5, [52, 55, 59], 1.0, .7); ev(22.5, 'timpani', 'E2', 1.2, 1.0, 0, 1.4); ev(22.5, 'crash', None, None, .8, -.1, .8); ev(22.5, 'bass_drum', None, None, 1.0, 0, 1.2)
ev(23.0, 'tubular_bells', 'E4', 2, .45, .2, .4)
for i, n in enumerate([76, 79, 83]): ev(9.6 + i * .08, 'glockenspiel', n, .6, .45, .2, .5)
# silence 2: cellos + contrabass + horn hold E (no brass on the stamp: keep the voice clear)
ev(33.3, 'tubular_bells', 'G4', 2, .4, .2, .35)
# story 4 enters in G major: brass stab + glockenspiel
stab(25.0, [67, 71, 74], .8, .35)
for i, n in enumerate([79, 83, 86]): ev(25.15 + i * .1, 'glockenspiel', n, .6, .5, -.2 + i * .2, .55)
# recap ticks
for i, n in enumerate([76, 79, 83]): ev(37.0 + i * .5, 'glockenspiel', n, .6, .55, -.3 + i * .2, .6)
# end card: roll → E-major tutti (Picardy third)
for i in range(10): ev(39.5 + i * .05, 'timpani', 'B2', .3, .35 + i * .05, 0, .6)
for ins, ns, g in [('trumpet', [76, 80, 83], .7), ('horn', [64, 68, 71], .8), ('trombone', [52, 59], .8), ('violins', [76, 80, 83, 88], .5), ('cellos', [40, 52], .7)]:
    for n in ns: ev(40.0, ins, n, 2.6, .78, 0, g, attack=.02, release=1.0)
ev(40.0, 'timpani', 'E3', 1, 1.0, 0, 1.3); ev(40.0, 'crash', None, None, .8, 0, .8); ev(40.0, 'tubular_bells', 'E5', 3, .7, .2, .6)
ev(40.0, 'bass_drum', None, None, 1.0, 0, 1.1)
for i, p in enumerate([76, 80, 83, 88]): ev(40.35 + i * .09, 'glockenspiel', p, .8, .5, -.3 + i * .2, .55)

music += S.render(M, DUR + 1, master=False)[:N]

# Synth pulse (16th-note sawtooth, low-passed): for the full-ensemble and tense sections
def saw(f, d): t = X.t_(d); return 2 * ((t * f) % 1) - 1
pulse = np.zeros((N, 2), np.float32)
for bar, ch in enumerate(CH):
    f = 440 * 2 ** ((12 * 3 + NOTE[ch.rstrip('m')] - 69) / 12)
    for k in range(16):
        t = bt(bar * 4) + k * B / 4; st = state(t)
        if st not in ('full', 'tense', 'mid') or t >= END: continue
        x = saw(f, .11) * X.env_exp(.11, .045); x = X.lp(x, 1100 if st == 'tense' else 900)
        X.add(pulse, x.astype(np.float32), t, .16 * (1.0 if k % 4 else .6))
music += pulse
music = S.room(music, .35, .14)

# —— Ambience bed ——
amb = np.zeros((N, 2), np.float32)
def bed(a, b, x, g):
    n0, n1 = int(a * SR), min(N, int(b * SR)); seg = x[:n1 - n0] * g
    fade = np.minimum(1, np.minimum(np.arange(len(seg)) / (.3 * SR), (len(seg) - np.arange(len(seg))) / (.3 * SR)))
    amb[n0:n1] += (seg * fade)[:, None]
amb_dc = X.lp(X.brown(7.8), 400) + np.sin(2 * np.pi * 120 * X.t_(7.8)) * .05   # server-room fans + mains hum
bed(5.8, 12.6, X.norm(amb_dc, .5), .06)


# —— Sound effects ——
def market(d):  # trading-screen ticks: random short clicks, band-passed
    out = np.zeros(int(d * SR), np.float32); rng = np.random.default_rng(7); t = 0
    while t < d - .05:
        c = X.bp(X.click(1.6 + rng.random() * .6, .4), 1500, 6000); s = int(t * SR); out[s:s + len(c)] += c[:len(out) - s] * (.4 + rng.random() * .4); t += .08 + rng.random() * .14
    return out
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'swish': X.add(fx, X.whoosh(.32, .7), t, .6, -.4)
    elif ty == 'whoosh': X.add(fx, X.whoosh(.38, .8), t - .1, .55, .3)
    elif ty == 'glint': X.add(fx, X.ding(.4), t, .25, .4)
    elif ty == 'hit': X.add(fx, X.thump(.9, 60), t, .65)
    elif ty == 'tab': X.add(fx, X.thump(.6, 90), t, .4); X.add(fx, X.whoosh(.15, .4), t - .05, .25, -.3)
    elif ty == 'slide': X.add(fx, X.whoosh(.2, .5), t, .3, -.4)
    elif ty == 'row': X.add(fx, X.click(.8, .9), t, .4, .3); X.add(fx, X.thump(.5, 110), t, .35)
    elif ty == 'blip': X.add(fx, X.ding(.5), t, .2, .3)
    elif ty == 'slam': X.add(fx, X.thump(.8, 75), t, .55); X.add(fx, X.whoosh(.18, .6), t - .1, .35, .4)
    elif ty == 'stamp': X.add(fx, X.thump(.9, 90), t, .6); X.add(fx, X.clack(.7, .8), t, .4)
    elif ty == 'stamp_l': X.add(fx, X.thump(.6, 110), t, .4); X.add(fx, X.clack(.9, .6), t, .3)
    elif ty == 'stamp_big': X.add(fx, X.thump(1.0, 70), t, .5); X.add(fx, X.lp(X.clack(.6, 1.0), 2500), t, .25)
    elif ty == 'key': X.add(fx, X.clack(1.3 + X._rng.random() * .3, .6), t, .22, -.2)
    elif ty == 'card': X.add(fx, X.thump(.7, 65), t, .55); X.add(fx, X.whoosh(.2, .5), t - .08, .3)
    elif ty == 'flap':
        for i in range(3): X.add(fx, X.click(1.1 + i * .15, .7), t + i * .05, .3, .2)
    elif ty == 'swap': X.add(fx, X.whoosh(.16, .4), t, .22, -.5)
    elif ty == 'ding': X.add(fx, X.ding(.9), t, .4, .3)
    elif ty == 'market': X.add(fx, market(e['dur']), t, .12, .3)
    elif ty == 'draw': X.add(fx, (X.bp(X.noise(.5), 3000, 7000) * np.sin(np.pi * X.t_(.5) / .5)).astype(np.float32), t, .05, -.2)
    elif ty == 'drop':
        tt2 = X.t_(.22); f = 330 * 2 ** (-e['d'] / 12); X.add(fx, (np.sin(2 * np.pi * f * tt2) * X.env_exp(.22, .06)).astype(np.float32), t, .3, .2)
    elif ty == 'boom': X.add(fx, X.thump(1.0, 42), t, .9); X.add(fx, X.lp(X.whoosh(.5, .9), 1200), t - .3, .4)
    elif ty == 'roll': X.add(fx, X.click(1.8, .4), t, .18, .3)
    elif ty == 'fall': X.add(fx, X.lp(X.whoosh(.45, .8), 1500), t, .4, .2); X.add(fx, X.thump(.5, 70), t + .42, .35)
    elif ty == 'tick': X.add(fx, X.click(1.5, .5), t, .2, (X._rng.random() - .5) * .8)
    elif ty == 'pulse':
        tt2 = X.t_(.3); X.add(fx, (np.sin(2 * np.pi * 880 * tt2) * X.env_exp(.3, .08)).astype(np.float32), t, .25)
    elif ty == 'zoom': X.add(fx, X.lp(X.whoosh(.7, .9), 1800), t, .45)
    elif ty == 'pop': X.add(fx, X.pop(.7), t, .35, .3)
    elif ty == 'paper':
        X.add(fx, (X.bp(X.noise(.35), 1200, 6000) * X.env_exp(.35, .12)).astype(np.float32), t, .25, .4); X.add(fx, X.whoosh(.3, .6), t, .3, .4)
    elif ty == 'check': X.add(fx, X.click(1.2, .8), t, .35, .3); X.add(fx, S.note('glockenspiel', 84, .3, .3), t + .02, .25, .3)
    elif ty == 'tick_ok': X.add(fx, X.pop(.6), t, .3); X.add(fx, S.note('glockenspiel', 84 + 3 * e.get('i', 0), .3, .3), t + .02, .25, .3)
    elif ty == 'grow': X.add(fx, X.whoosh(.25, .45), t, .22, .2); X.add(fx, X.click(1.2, .5), t + .35, .2, .2)
    elif ty == 'mark': X.add(fx, (X.bp(X.noise(.4), 2500, 7000) * np.sin(np.pi * X.t_(.4) / .4)).astype(np.float32), t, .12, .3)
    elif ty == 'type':
        for i in range(8): X.add(fx, X.clack(1.4 + X._rng.random() * .3, .5), t + i * .1, .12, .3)
    elif ty == 'quote': X.add(fx, X.thump(.6, 95), t, .4); X.add(fx, X.whoosh(.25, .5), t - .05, .25, -.2)
    elif ty == 'type':
        for i in range(8): X.add(fx, X.clack(1.4 + X._rng.random() * .3, .5), t + i * .1, .12, .3)
    elif ty == 'quote': X.add(fx, X.thump(.6, 95), t, .4); X.add(fx, X.whoosh(.25, .5), t - .05, .25, -.2)
    elif ty == 'lights':
        for i in range(4): X.add(fx, X.thump(.45, 140 - i * 15), t + i * .09, .3, -.4 + i * .27)
    elif ty == 'push': X.add(fx, X.lp(X.whoosh(.75, .9), 2500), t, .5)
    elif ty == 'pull': X.add(fx, X.lp(X.whoosh(1.0, .7), 1800)[::-1].copy(), t, .4)
    elif ty == 'bump':
        X.add(fx, X.whoosh(.3, .9), t - .05, .5, .4); X.add(fx, X.thump(.8, 80), t + .2, .5)
        for i in range(6): X.add(fx, X.click(1.0 + i * .08, .5), t + .03 * i, .15, .5 - i * .2)
fx = S.room(fx, .2, .08)

# —— Narration: 24 kHz → 48 kHz, broadcast EQ + compression ——
spans = []
for e in EV:
    if e['type'] != 'vo': continue
    sr, x = wavfile.read(os.path.join(HERE, 'audio', 'voice', e['id'] + '.wav'))
    x = x.astype(np.float32) / (32768 if x.dtype == np.int16 else 1)
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr).astype(np.float32)
    x = X.hp(x, 90).astype(np.float32); x = X.compress(x / (np.abs(x).max() + 1e-9) * .8, .3, 3)
    X.add(vo, x.astype(np.float32), e['t'], 1.0, 0)
    spans.append((e['t'], e['t'] + len(x) / SR))

duck = np.ones(N, np.float32)
for a, b in spans:
    k = np.clip(np.minimum((tt - (a - .08)) / .08, ((b + .15) - tt) / .15), 0, 1)
    duck = np.minimum(duck, 1 - .55 * k)
music *= duck[:, None]
# under speech the music also loses part of the 1.2–5 kHz band, so the voice stays intelligible
cut = 1 - duck   # 0 … .55
band = np.stack([X.bp(music[:, c], 1200, 5000) for c in range(2)], 1).astype(np.float32)
music -= band * (cut / .55 * .6)[:, None]

mix = music * .9 + fx * .8 + amb * .8 + vo * 1.3
fade = np.clip((DUR - tt) / 1.0, 0, 1); mix *= fade[:, None]
mix = mix[:int(DUR * SR)]
mix = np.stack([X.limit(mix[:, 0], .95), X.limit(mix[:, 1], .95)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
wavfile.write(os.path.join(HERE, 'out', 'mix.wav'), SR, (mix * 32767).astype(np.int16))
print('mix', mix.shape, 'peak', float(np.abs(mix).max()))
print('\n'.join(S.credits(sorted({e['inst'] for e in M}))))
