# Le fil — musique (valse jazz 120 BPM à 3/4, échantillons libres), bruitages procéduraux, voix, mixage → out/mix.wav
# Lancer avec la .venv de la bibliothèque : "$LIB/.venv/bin/python" audio/mix.py   (LIB = dossier de la bibliothèque Lemo-Opuscar)
import sys, os, json
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
import numpy as np, soundfile as sf, soxr
from core.audio import sampler as S
from core.audio.sfx import SR, add, bp, hp, lp, limit, compress, ding, whoosh, step, click

HERE = os.path.dirname(os.path.abspath(__file__)); PROJ = os.path.dirname(HERE)
C = json.load(open(os.path.join(PROJ, 'events.json')))
DUR = C['dur']; N = int(DUR * SR)
EV = C['ev']; ev = lambda typ: [e for e in EV if e['type'] == typ]
rng = np.random.default_rng(7); S.seed(3)
BEAT, BAR = .5, 1.5
bt = lambda bar, beat=0.: bar * BAR + beat * BEAT
hum = lambda: float(rng.normal(0, .006))
SIL0, SIL1 = 33.0, 34.5

# ================= Musique =================
mel, bass, pno, drm, col = [], [], [], [], []
CH = [('F2', ['A3', 'C4', 'E4', 'G4']), ('D2', ['F3', 'A3', 'C4', 'E4']), ('G2', ['F3', 'Bb3', 'D4', 'A4']), ('C2', ['E3', 'Bb3', 'D4', 'G4'])]
FIFTH = {'F2': 'C3', 'D2': 'A2', 'G2': 'D3', 'C2': 'G2'}
APPR = {'F2': 'C#2', 'D2': 'F#2', 'G2': 'B1', 'C2': 'E2'}
def waltz(bar, loud=1., piano=True, brushes=True, walk=True):
    root, voic = CH[bar % 4]
    if walk: bass.extend([(bt(bar) + hum(), 'jazz_bass', root, .4, .78 * loud, -.05), (bt(bar, 1) + hum(), 'jazz_bass', FIFTH[root], .36, .58 * loud, -.05), (bt(bar, 2) + hum(), 'jazz_bass', APPR[CH[(bar + 1) % 4][0]], .36, .6 * loud, -.05)])
    else: bass.append((bt(bar) + hum(), 'jazz_bass', root, 1.2, .7 * loud, -.05))
    if piano:
        for b in (1, 2):
            for i, p in enumerate(voic): pno.append((bt(bar, b) + i * .006 + hum(), 'upright', p, .26, (.34 if b == 1 else .28) * loud, .2))
    if brushes:
        for b in range(3):
            drm.append((bt(bar, b) + hum(), 'snare', None, None, (.16 if b == 0 else .1) * loud, .1))
            drm.append((bt(bar, b + 2 / 3) + hum(), 'hihat', None, None, .08 * loud, -.25))
def line(bar, notes, vel=.6, inst='clarinet', pan=-.15):
    for b, p, d in notes:
        b2 = int(b) + (2 / 3 if abs(b - int(b) - .5) < 1e-6 else b - int(b))
        mel.append(dict(t=bt(bar, b2) + hum(), inst=inst if d * BEAT > .3 else inst + '_stac', pitch=p, dur=max(.12, d * BEAT * .95), vel=vel, pan=pan))
# mesures 0–3 : balais + contrebasse discrète (le hall au crayon)
for b in range(1, 4): waltz(b, .65, piano=False)
# 4–7 : + piano ; carillon du badge à 9,0 s (mesure 6)
for b in range(4, 8): waltz(b, .8)
col += [(9.0, 'vibraphone', p, 2.2, .5, .25) for p in ['A5', 'E6']] + [(9.0, 'glockenspiel', 'C7', 1.0, .25, .3)]
# 8–12 : + clarinette, le thème (original)
TH = [[(0, 'C5', 1.5), (1.5, 'D5', .5), (2, 'E5', 1)], [(0, 'F5', 1), (1, 'E5', .5), (1.5, 'D5', .5), (2, 'C5', 1)],
      [(0, 'D5', 1.5), (1.5, 'C5', .5), (2, 'Bb4', 1)], [(0, 'A4', .5), (.5, 'Bb4', .5), (1, 'C5', .5), (1.5, 'E5', .5), (2, 'G5', 1)]]
for b in range(8, 13): waltz(b, .9); line(b, TH[(b - 8) % 4], .55)
# 13–17 : montée vers la poignée de main (mesure 16 = 24,0 s)
for b in range(13, 16): waltz(b, 1.0); line(b, TH[(b - 13) % 4], .62)
for i, p in enumerate(['C5', 'D5', 'E5']): col.append((20.4 + i * .3, 'marimba', p, .5, .35, .3 - i * .3))   # trois propositions
col.append((21.55, 'vibraphone', 'G5', 1.2, .45, .2))
waltz(16, 1.15); waltz(17, 1.0)
for p, v in [('C6', .55), ('A5', .5), ('F5', .5)]: col.append((24.0, 'vibraphone', p, 2.4, v, .1))
drm.append((24.0, 'bass_drum', None, None, .55, 0)); drm.append((24.0, 'sus_cymbal', None, None, .25, .2))
line(16, [(0, 'A5', 2.5)], .66); line(17, [(0, 'G5', 1), (1, 'F5', .5), (1.5, 'E5', .5), (2, 'C5', 1)], .6)
# 18–21 : la conversation, piano et clarinette seuls
for b in range(18, 22): waltz(b, .7, brushes=False, walk=False)
line(18, [(0, 'E5', 2)], .45); line(19, [(0, 'F5', 1), (1, 'E5', 1), (2, 'D5', 1)], .45); line(20, [(0, 'C5', 2.5)], .42); line(21, [(0, 'D5', 1), (1, 'E5', 1.5)], .42)
# 22 : silence (33,0–34,5)
# 23–26 : le soir, thème complet
for b in range(23, 27): waltz(b, .8 if b < 26 else 1.0); line(b, TH[(b - 23) % 4], .5 if b < 26 else .62)
for p in ['F4', 'A4', 'C5', 'E5']: col.append((34.5, 'vibraphone', p, 2.5, .22, -.1))
# 27–29 : clarinette seule, accord final tenu à 43,5
line(27, [(0, 'C5', 1.5), (1.5, 'D5', .5), (2, 'E5', 1)], .5); line(28, [(0, 'F5', 1), (1, 'E5', 1), (2, 'D5', 1)], .48)
bass.append((bt(27), 'jazz_bass', 'D2', 1.4, .5, 0)); bass.append((bt(28), 'jazz_bass', 'G2', 1.4, .5, 0))
mel.append(dict(t=43.5, inst='clarinet', pitch='C5', dur=2.6, vel=.48, pan=-.15, release=1.0))
for i, p in enumerate(['F2', 'C3', 'A3', 'E4', 'G4']): pno.append((43.5 + i * .05, 'upright', p, 2.8, .33 - i * .02, -.1 + i * .06))
bass.append((43.5, 'jazz_bass', 'F1', 2.5, .6, 0))

S.ensure(['jazz_bass', 'upright', 'clarinet', 'clarinet_stac', 'snare', 'hihat', 'vibraphone', 'glockenspiel', 'marimba', 'bass_drum', 'sus_cymbal'])
def ren(evs): return S.render(evs, dur=DUR, master=False)[:N]
M = {'mel': ren(mel), 'bass': ren(bass), 'pno': ren(pno), 'drm': ren(drm), 'col': ren(col)}
music = M['mel'] * 1.0 + M['bass'] * .95 + M['pno'] * .8 + M['drm'] * .7 + M['col'] * .85
music = S.room(music, size=.35, mix=.15)
music = np.stack([hp(music[:, c], 40) for c in range(2)], 1)

# ================= Bruitages =================
F = {k: np.zeros((N, 2), np.float32) for k in ['pen', 'wash', 'room', 'fx']}
def pen(d, v=1., bright=1.):
    n = int(max(.03, d) * SR); x = rng.standard_normal(n)
    fiber = lp(rng.standard_normal(n), 90); fiber = .55 + .45 * np.abs(fiber) / (np.abs(fiber).max() + 1e-9)
    grain = (rng.random(n) > .9975) * rng.standard_normal(n) * 4
    y = bp(x, 1600 * bright, min(7500 * bright, 9000), 2) * fiber + hp(grain, 2500)
    e = np.minimum(1, np.arange(n) / (.008 * SR)) * np.minimum(1, (n - np.arange(n)) / (.025 * SR))
    return (y * e * v * .22).astype(np.float32)
def write(t0, d, v=.8):
    t = t0
    while t < t0 + d:
        dd = .03 + rng.random() * .07; add(F['pen'], pen(dd, v * (.7 + rng.random() * .5), 1.15), t, 1, rng.uniform(-.1, .1)); t += dd + .012 + rng.random() * .03
        if rng.random() < .12: t += .08
def wet(d, v=1.):
    n = int(d * SR); x = rng.standard_normal(n); bub = lp(np.abs(rng.standard_normal(n)), 30); bub /= bub.max() + 1e-9
    tt = np.arange(n) / SR; e = (1 - np.exp(-tt / .06)) * np.exp(-tt / (d * .45))
    return (bp(x, 180, 2600, 2) * (.5 + .8 * bub) * e * v * .5).astype(np.float32)
# croquis d'ouverture : Léa (0,15–1,0), puis le hall entier au stylo (strokes du monde)
for e in ev('sketchFig'):
    t = e['t']
    while t < e['t'] + e['d']: d = .06 + rng.random() * .14; add(F['pen'], pen(d, .9), t, 1, rng.uniform(-.2, .2)); t += d + .03
for e in ev('stroke'):
    add(F['pen'], pen(e['d'], .07 + min(.1, e['L'] / 4000), 1.0), e['t'], 1, rng.uniform(-.6, .6))
for e in ev('write') + ev('scribble'): write(e['t'], e['d'], .9 if e['type'] == 'write' else 1.0)
for e in ev('thread'):                                            # le fil se dessine : un pinceau qui glisse
    n = int(e['d'] * SR); x = bp(rng.standard_normal(n), 300, 3000, 2); tt = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(tt / e['d'], 0, 1)) ** .6 * (.6 + .4 * np.sin(tt * 12.566))
    add(F['wash'], (x * env * .12).astype(np.float32), e['t'], 1, 0)
for e in ev('bloom'): add(F['wash'], wet(e.get('d', 1.4), e.get('v', .8)), e['t'], 1, rng.uniform(-.2, .2))
for e in ev('erase'): add(F['wash'], wet(e['d'], .5), e['t'], 1, 0)
for e in ev('swipe'): add(F['wash'], wet(.6, .7), e['t'], 1, .3)
for e in ev('badge'): add(F['fx'], ding(.35), e['t'], 1, 0)
for e in ev('tick'): add(F['fx'], pen(.12, 1.6, 1.3), e['t'], 1, .2); add(F['fx'], ding(.2), e['t'] + .1, 1, .2)
for e in ev('propose'): add(F['fx'], click(1.4, .35), e['t'], 1, .3)
for e in ev('solid'): add(F['fx'], whoosh(.3, .25), e['t'], 1, .4)
for e in ev('step'): add(F['fx'], step(.35), e['t'], 1, .0)
for e in ev('turn'): add(F['fx'], whoosh(.25, .15), e['t'], 1, .4)
for e in ev('shake'): add(F['fx'], step(.5), e['t'], 1, .1); add(F['fx'], step(.3), e['t'] + .45, 1, .1)
# ambiance : papier (au début), puis rumeur de salon qui entre une mesure avant la couleur (J-cut, 8,0 s)
tt = np.arange(N) / SR
room = bp(rng.standard_normal(N), 120, 900, 2) * (.6 + .4 * lp(np.abs(rng.standard_normal(N)), 4) / .3)
babble = sum(bp(rng.standard_normal(N), f, f * 1.6, 2) * (lp(np.abs(rng.standard_normal(N)), 6 + k) * 8) for k, f in enumerate([300, 520, 800, 1300]))
lvl = np.interp(tt, [0, 7.8, 9.2, 26.5, 27.5, 32.8, 33.0, 34.5, 36, 40, DUR], [0, 0, .5, .5, .25, .25, 0, 0, .3, .3, .2])
amb = (room * .05 + babble * .012) * lvl
F['room'] += np.stack([amb, np.roll(amb, 997)], 1).astype(np.float32)
F['room'] += np.stack([bp(rng.standard_normal(N), 200, 4000, 1) * .002] * 2, 1).astype(np.float32) * (tt < 8)[:, None]   # ton de pièce papier

# ================= Voix =================
VO = {'L1': .8, 'L2': 6.3, 'L3': 12.3, 'L4': 19.7, 'L5': 27.3, 'L6': 34.9, 'L7': 41.3}
voice = np.zeros((N, 2), np.float32); vmask = np.zeros(N)
for k, t0 in VO.items():
    x, sr = sf.read(os.path.join(HERE, 'voice', f'{k}.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = soxr.resample(x, sr, SR)
    x = compress(hp(x, 80), thr=.2, ratio=3.5); x = x / (np.sqrt((x ** 2).mean()) + 1e-9) * .1
    add(voice, x.astype(np.float32), t0, 1, 0); a = int(t0 * SR); vmask[a:a + len(x)] = 1

# ================= Mixage =================
duck = lp(np.convolve(vmask, np.ones(int(.15 * SR)) / int(.15 * SR), 'same'), 3)
music *= (1 - .62 * np.clip(duck, 0, 1))[:, None]
sil = ((tt >= SIL0) & (tt < SIL1)).astype(float); sil = lp(sil, 20)
music *= (1 - sil)[:, None]
fol = sum(np.stack([hp(F[k][:, c], 90) for c in range(2)], 1) * g for k, g in [('pen', 1.0), ('wash', .9), ('room', 1.0), ('fx', .9)])
fol *= (1 - sil * .97)[:, None]
mix = music * .9 + fol + voice
mix = np.stack([limit(mix[:, c], .95) for c in range(2)], 1).astype(np.float32)
os.makedirs(os.path.join(PROJ, 'out'), exist_ok=True)
sf.write(os.path.join(PROJ, 'out', 'mix.wav'), mix, SR)
db = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)
vm = vmask > 0
print('voix RMS dB', round(db(voice[vm]), 1), '| musique sous la voix dB', round(db(music[vm] * .9), 1), '| silence 33,2–34,3 dB', round(db(mix[int(33.2 * SR):int(34.3 * SR)]), 1))
lo = lp(mix[:, 0], 120); print('part < 120 Hz dB', round(10 * np.log10((lo ** 2).mean() / (mix[:, 0] ** 2).mean()), 1))
print('instruments:', sorted({e[1] if isinstance(e, tuple) else e['inst'] for e in mel + bass + pno + drm + col}))
