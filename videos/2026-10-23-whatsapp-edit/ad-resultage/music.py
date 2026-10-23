# Original music bed for this ad, synthesized from scratch (nothing to license).
# 120 BPM, A minor (Am - F - C - G), four-on-the-floor with offbeat bass, built to the edit:
#   0.00  intro hit, filtered groove        2.00  full groove
#  17.42  break (no drums) under "and it's always the"   18.60  drop on "SALES CALLS"
#  34.46  proof build (snare roll + riser)  37.50  final hit on "17", ring out
# usage: python3 music.py assets/music.wav
import sys, json
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
DUR = json.load(open("assets/edit-decisions.json"))["duration"]
N = int(DUR * SR) + SR
BEAT = 0.5
rng = np.random.default_rng(7)
out_drums, out_bass, out_keys, out_fx = (np.zeros(N) for _ in range(4))

def lp(x, f): return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)
def add(buf, t, x, g=1.0):
    i = int(t * SR); j = min(N, i + len(x))
    if i < N: buf[i:j] += g * x[: j - i]
def tt(d): return np.arange(int(d * SR)) / SR
def note(n): return 440 * 2 ** ((n - 69) / 12)

# --- sounds ---
t = tt(0.42)
KICK = np.sin(2 * np.pi * (45 * t + (110 / 28) * (1 - np.exp(-t * 28)))) * np.exp(-t * 7.5)
KICK += 0.4 * lp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 120)
t = tt(0.22)
CLAP = bp(rng.standard_normal(len(t)), 900, 5000) * (np.exp(-t * 26) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 30) * (t > 0.012))
CLAP += 0.25 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
t = tt(0.05); HAT = hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * 90)
t = tt(0.25); OHAT = hp(rng.standard_normal(len(t)), 6500) * np.exp(-t * 14)
t = tt(1.6); CRASH = hp(rng.standard_normal(len(t)), 4500) * np.exp(-t * 2.6)
def saw(f, d, det=(0,)):
    t = tt(d); return sum(2 * ((t * f * (1 + c)) % 1) - 1 for c in det) / len(det)

CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
ROOTS = [33, 29, 36, 31]

def section(tb):
    if tb < 2.0: return "intro"
    if 17.42 <= tb < 18.6: return "break"
    if 34.46 <= tb < 37.5: return "build"
    if tb >= 37.5: return "end"
    return "full"

beats = int(DUR / BEAT) + 2
for b in range(beats):
    tb = b * BEAT; sec = section(tb); bar = (b // 4) % 4; inbar = b % 4
    if sec in ("full", "intro") or (sec == "build" and tb < 36.0):
        add(out_drums, tb, KICK, 0.95)
    if sec == "full" and inbar in (1, 3): add(out_drums, tb, CLAP, 0.55)
    if sec in ("full", "build"):
        add(out_drums, tb + 0.25, OHAT if inbar == 3 else HAT, 0.28)
        for k in (0.125, 0.375): add(out_drums, tb + k, HAT, 0.14)
    # offbeat pumping bass
    if sec in ("full", "build", "intro"):
        f = note(ROOTS[bar]); x = lp(saw(f, 0.22, (0, .006)), 700 if sec != "intro" else 380) * np.exp(-tt(0.22) * 6)
        add(out_bass, tb + 0.25, x, 0.55)
    # chord stabs: on beat 1 and the "and" of 2 and 4
    if inbar == 0 and sec != "end":
        for k in (0.0, 0.75, 1.75):
            st = tb + k; d = 0.28
            x = sum(saw(note(n + 12), d, (-.004, 0, .004)) for n in CHORDS[bar]) / 3
            x = lp(x, 2600 if sec in ("full", "build") else 1100) * np.exp(-tt(d) * 9)
            add(out_keys, st, x, 0.32)

# break: filtered pad so the drop hits
t = tt(18.6 - 17.42)
pad = sum(saw(note(n + 12), len(t) / SR, (-.006, .006)) for n in CHORDS[0]) / 3
pad = pad[: len(t)]; add(out_keys, 17.42, lp(pad, 900) * np.minimum(1, t[: len(pad)] * 4), 0.25)
# risers into the drop and into the final hit
for t0, t1 in ((16.9, 18.6), (35.9, 37.5)):
    t = tt(t1 - t0); x = hp(rng.standard_normal(len(t)), 1500) * (t / t[-1]) ** 2
    add(out_fx, t0, x, 0.22)
# snare roll in the build
for i, tb in enumerate(np.arange(36.0, 37.5, 0.0625)):
    add(out_drums, tb, CLAP, 0.12 + 0.35 * i / 24)
# impacts
for tb in (0.0, 18.6, 37.5):
    add(out_drums, tb, KICK, 1.1); add(out_fx, tb, CRASH, 0.35)
t = tt(0.9); SUB = np.sin(2 * np.pi * 42 * t) * np.exp(-t * 3)
for tb in (18.6, 37.5): add(out_bass, tb, SUB, 0.8)

mix = out_drums + out_bass * 0.9 + out_keys + out_fx
mix = mix[: int(DUR * SR)]
fade = int(0.6 * SR); mix[-fade:] *= np.linspace(1, 0, fade)
mix = np.tanh(mix * 1.1) / np.max(np.abs(np.tanh(mix * 1.1))) * 0.89
st = np.stack([mix, np.roll(mix, 9)], 1)  # small width
import wave
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype("<i2").tobytes())
print("music", round(DUR, 2), "s ->", sys.argv[1])
