"""The score and the sound effects of the film, synthesised locally, and
the narrator's lines brought to one loudness.

    python3 scripts/film-sound.py [--only-missing]

Writes public/film/audio/*.mp3 and src/film/sounds.json.
"""

import json
import os
import subprocess
import sys

import numpy as np

SR = 44100
OUT = "public/film/audio"
rng = np.random.default_rng(11)


def seconds(length):
    return np.arange(int(length * SR)) / SR


def noise(length):
    return rng.uniform(-1, 1, int(length * SR))


def band(signal, low=None, high=None):
    spectrum = np.fft.rfft(signal)
    freqs = np.fft.rfftfreq(len(signal), 1 / SR)
    keep = np.ones_like(freqs)
    if low:
        keep *= 1 / (1 + (low / np.maximum(freqs, 1)) ** 6)
    if high:
        keep *= 1 / (1 + (freqs / high) ** 6)
    return np.fft.irfft(spectrum * keep, len(signal))


def fade(signal, attack=0.004, release=0.02):
    a = int(attack * SR)
    r = int(release * SR)
    signal = signal.copy()
    if a:
        signal[:a] *= np.linspace(0, 1, a)
    if r:
        signal[-r:] *= np.linspace(1, 0, r)
    return signal


def save(name, signal, peak=0.9):
    signal = np.asarray(signal, dtype=np.float64)
    if signal.ndim == 1:
        signal = np.stack([signal, signal], axis=1)
    signal = signal / max(1e-9, np.abs(signal).max()) * peak
    subprocess.run(
        [
            "ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR),
            "-ac", "2", "-i", "-", "-b:a", "192k", f"{OUT}/{name}.mp3",
        ],
        input=(signal * 32767).astype("<i2").tobytes(),
        check=True,
    )


def load(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(raw, dtype="<f4").astype(np.float64)


def reverb(stereo, length=3.2, wet=0.3):
    """A hall: each side convolved with its own decaying noise."""
    n = len(stereo)
    out = np.zeros_like(stereo)
    for side in range(2):
        t = seconds(length)
        tail = np.random.default_rng(40 + side).normal(0, 1, len(t)) * np.exp(-t * 2.1)
        tail = band(tail, 380, 7000)
        size = 1 << int(np.ceil(np.log2(n + len(tail))))
        hall = np.fft.irfft(np.fft.rfft(stereo[:, side], size) * np.fft.rfft(tail, size), size)[:n]
        out[:, side] = stereo[:, side] + wet * hall / np.abs(hall).max() * np.abs(stereo[:, side]).max()
    return out


# ------------------------------------------------------------------ score

N = {
    "D2": 73.42, "F2": 87.31, "G2": 98.0, "A2": 110.0, "Bb2": 116.54, "B2": 123.47,
    "C3": 130.81, "C#3": 138.59, "D3": 146.83, "E3": 164.81, "F3": 174.61,
    "F#3": 185.0, "G3": 196.0, "A3": 220.0, "Bb3": 233.08, "B3": 246.94,
    "C4": 261.63, "C#4": 277.18, "D4": 293.66, "E4": 329.63, "F4": 349.23,
    "F#4": 369.99, "G4": 392.0, "A4": 440.0, "Bb4": 466.16, "B4": 493.88,
    "C5": 523.25, "C#5": 554.37, "D5": 587.33, "E5": 659.25, "F5": 698.46,
    "F#5": 739.99, "G5": 783.99, "A5": 880.0, "D6": 1174.66,
}

BEAT = 1.05
BAR = BEAT * 4

# One chord a bar: the night in D minor, the light and the morning in D major.
CHORDS = {
    "Dm": ("D2", ["D3", "F3", "A3", "D4", "F4", "A4"]),
    "Bb": ("Bb2", ["Bb2", "D3", "F3", "Bb3", "D4", "F4"]),
    "F": ("F2", ["F3", "A3", "C4", "F4", "A4", "C5"]),
    "C": ("C3", ["C3", "E3", "G3", "C4", "E4", "G4"]),
    "Gm": ("G2", ["G3", "Bb3", "D4", "G4", "Bb4", "D5"]),
    "A": ("A2", ["A2", "C#3", "E3", "A3", "C#4", "E4"]),
    "D": ("D2", ["D3", "F#3", "A3", "D4", "F#4", "A4"]),
    "Bm": ("B2", ["B2", "D3", "F#3", "B3", "D4", "F#4"]),
    "G": ("G2", ["G3", "B3", "D4", "G4", "B4", "D5"]),
}

BARS = [
    "Dm", "Dm", "Bb", "F", "C", "Dm", "Gm", "Dm", "Bb", "A",
    "D", "Bm", "G", "A", "D", "Bm", "G", "D", "D", "D",
]

# A slow line over the chords: (bar, beat, beats long, note).
MELODY = [
    (5, 0, 2, "A4"), (5, 2, 2, "F4"), (6, 0, 3, "G4"), (6, 3, 1, "Bb4"),
    (7, 0, 4, "A4"), (8, 0, 2, "F4"), (8, 2, 2, "D4"), (9, 0, 2, "E4"), (9, 2, 2, "A4"),
    (10, 0, 2, "F#4"), (10, 2, 2, "A4"), (11, 0, 3, "B4"), (11, 3, 1, "A4"),
    (12, 0, 2, "G4"), (12, 2, 2, "B4"), (13, 0, 2, "A4"), (13, 2, 2, "C#5"),
    (14, 0, 4, "D5"), (15, 0, 2, "B4"), (15, 2, 2, "F#4"), (16, 0, 4, "G4"),
    (17, 0, 2, "F#4"), (17, 2, 2, "A4"), (18, 0, 6, "D5"),
]


def piano(freq, length=3.2, soft=1.0):
    t = seconds(length)
    out = np.zeros(len(t))
    for n, level in enumerate([1, 0.5, 0.28, 0.14, 0.08, 0.04], start=1):
        f = freq * n * (1 + 0.0004 * n * n)
        out += level * np.sin(2 * np.pi * f * t) * np.exp(-t * (1.1 + n * 0.55))
    knock = band(noise(length), 800, 4000) * np.exp(-t * 90) * 0.06
    return fade((out + knock) * soft, 0.004, 0.2)


def pad(tones, length):
    t = seconds(length)
    out = np.zeros(len(t))
    for name in tones:
        f = N[name]
        for detune in (0.996, 1.0, 1.005):
            out += np.sin(2 * np.pi * f * detune * t) + 0.3 * np.sin(2 * np.pi * f * 2 * detune * t)
    swell = np.minimum(1, t / 1.6) * np.minimum(1, (length - t) / 1.6)
    return out * swell / (len(tones) * 3.6)


def bowed(freq, length):
    t = seconds(length)
    vibrato = 1 + 0.004 * np.sin(2 * np.pi * 5.1 * t) * np.minimum(1, t / 0.6)
    phase = 2 * np.pi * np.cumsum(freq * vibrato) / SR
    tone = sum(np.sin(phase * n) / n ** 1.4 for n in range(1, 7))
    swell = np.minimum(1, t / 0.5) * np.minimum(1, (length - t) / 0.7)
    return band(tone, 120, 3200) * swell


def music(total):
    n = int((total + 4) * SR)
    left = np.zeros(n)
    right = np.zeros(n)

    def put(signal, at, gain=1.0, pan=0.0):
        start = int(at * SR)
        if start >= n or start < 0:
            return
        end = min(n, start + len(signal))
        part = signal[: end - start] * gain
        left[start:end] += part * (1 - max(0, pan) * 0.7)
        right[start:end] += part * (1 + min(0, pan) * 0.7)

    for bar, name in enumerate(BARS):
        at = bar * BAR
        if at > total:
            break
        bass, tones = CHORDS[name]
        major = bar >= 10
        put(pad(tones[1:4], BAR + 2.4), at - 0.8, 0.34, pan=-0.2)
        put(pad(tones[2:], BAR + 2.4), at - 0.8, 0.32, pan=0.3)

        t = seconds(BAR + 1.2)
        low = np.sin(2 * np.pi * N[bass] * t) * np.minimum(1, t / 0.8) * np.minimum(1, (BAR + 1.2 - t) / 1.0)
        put(low, at - 0.3, 0.13)

        if bar < 2:
            # The night begins with single notes, far apart.
            put(piano(N[tones[5]], 4.5), at + BEAT * 1, 0.42, pan=0.3)
            put(piano(N[tones[3]], 4.5), at + BEAT * 3, 0.36, pan=-0.3)
        elif bar < 10:
            order = [0, 2, 3, 4, 5, 4, 3, 2]
            for step, tone in enumerate(order):
                level = 0.48 if step % 4 == 0 else 0.3
                put(piano(N[tones[tone]]), at + step * BEAT / 2, level, pan=(-1) ** step * 0.35)
        elif bar < 18:
            # In the light the same chords move twice as fast.
            order = [0, 2, 3, 4, 5, 4, 3, 4, 2, 3, 4, 5, 4, 3, 2, 3]
            lift = min(1.0, 0.6 + (bar - 10) * 0.07)
            for step, tone in enumerate(order):
                level = (0.42 if step % 4 == 0 else 0.24) * lift
                put(piano(N[tones[tone]] * (2 if step % 8 == 6 else 1), 2.6), at + step * BEAT / 4, level, pan=(-1) ** step * 0.4)
        else:
            put(piano(N[tones[3]], 5), at, 0.46)
            put(piano(N[tones[5]], 5), at + BEAT, 0.34, pan=0.3)

    for bar, beat, long, name in MELODY:
        put(bowed(N[name], long * BEAT + 0.5), bar * BAR + beat * BEAT, 0.3 if bar < 10 else 0.36, pan=0.15)
        put(bowed(N[name] / 2, long * BEAT + 0.5), bar * BAR + beat * BEAT, 0.1, pan=-0.2)

    # The page is held up to the light: a swell into the first major chord.
    turn = 10 * BAR
    t = seconds(3.4)
    rise = band(noise(3.4), 2500, 11000) * (t / 3.4) ** 2.6 * 0.22
    put(fade(rise, 0.05, 0.3), turn - 3.2, 1.0)
    for name, level in (("D5", 0.5), ("A5", 0.36), ("D6", 0.26), ("F#5", 0.3)):
        t = seconds(6)
        bell = np.sin(2 * np.pi * N[name] * t) * np.exp(-t * 0.9) * np.minimum(1, t / 0.02)
        put(bell, turn, level * 0.3, pan=0.2)

    mix = np.stack([left, right], axis=1)[: int((total + 0.2) * SR)]
    mix = reverb(mix)
    mix = np.stack([band(mix[:, 0], 45), band(mix[:, 1], 45)], axis=1)
    mix = np.tanh(mix / np.abs(mix).max() * 0.9) / np.tanh(0.9)
    tail = int(2.6 * SR)
    mix[-tail:] *= np.linspace(1, 0, tail)[:, None] ** 1.5
    head = int(1.0 * SR)
    mix[:head] *= np.linspace(0, 1, head)[:, None]
    return mix


# ---------------------------------------------------------------- effects


def fire(length=9.0):
    t = seconds(length)
    out = band(noise(length), 40, 420) * 0.55 * (0.8 + 0.2 * np.sin(2 * np.pi * 0.3 * t))
    at = 0.2
    while at < length - 0.2:
        size = rng.uniform(0.004, 0.02)
        crack = band(noise(0.06), rng.uniform(900, 2500), 9000) * np.exp(-seconds(0.06) / size)
        start = int(at * SR)
        out[start : start + len(crack)] += crack * rng.uniform(0.25, 0.9)
        at += rng.exponential(0.16)
    return fade(out, 0.6, 0.8)


def scratch(length=2.4):
    """A quill on parchment: short dry strokes, never quite even."""
    out = np.zeros(int(length * SR))
    hiss = band(noise(length), 1800, 7500)
    at = 0.0
    while at < length - 0.05:
        long = rng.uniform(0.05, 0.19)
        n = int(long * SR)
        t = np.arange(n) / SR
        shape = np.sin(np.pi * t / long) ** 0.7 * rng.uniform(0.45, 1.0)
        start = int(at * SR)
        end = min(len(out), start + n)
        out[start:end] += hiss[start:end] * shape[: end - start]
        at += long + rng.uniform(0.01, 0.07)
    return fade(out, 0.01, 0.05)


def scrape(length=0.78):
    t = seconds(length)
    rasp = band(noise(length), 900, 5200) * (0.55 + 0.45 * np.sign(np.sin(2 * np.pi * 64 * t)))
    shape = np.sin(np.pi * (t / length) ** 0.7) ** 1.3
    return fade(rasp * shape, 0.01, 0.06)


def page(length=0.7):
    t = seconds(length)
    rustle = band(noise(length), 700, 6500) * (0.6 + 0.4 * np.sin(2 * np.pi * 31 * t + np.sin(2 * np.pi * 7 * t) * 3))
    shape = np.sin(np.pi * (t / length) ** 0.6) ** 2
    return fade(rustle * shape, 0.01, 0.1)


def shimmer(length=3.0):
    t = seconds(length)
    out = np.zeros(len(t))
    for f, level in ((1174.66, 0.5), (1760.0, 0.4), (2349.3, 0.3), (2959.96, 0.22), (3520.0, 0.14)):
        out += level * np.sin(2 * np.pi * f * t) * (0.6 + 0.4 * np.sin(2 * np.pi * rng.uniform(3, 7) * t))
    air = band(noise(length), 6000) * 0.12
    shape = np.minimum(1, t / 0.9) * np.exp(-np.maximum(0, t - 1.0) * 1.4)
    return fade((out + air) * shape, 0.05, 0.3)


def stamp(length=0.6):
    t = seconds(length)
    f = 95 * np.exp(-t * 6) + 48
    thud = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)
    knock = band(noise(length), 300, 3000) * np.exp(-t * 60) * 0.7
    return fade(thud + knock, 0.001, 0.1)


def thread(length=2.0):
    t = seconds(length)
    f = 520 + 640 * (t / length) ** 1.3
    tone = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.006 * np.sin(2 * np.pi * 6 * t))) / SR)
    air = band(noise(length), 2500, 9000) * 0.3
    shape = np.minimum(1, t / 0.2) * np.minimum(1, (length - t) / 0.5)
    return fade((tone * 0.5 + air) * shape, 0.02, 0.2)


def birds(length=11.0):
    out = np.zeros(int(length * SR))
    at = 0.3
    while at < length - 0.6:
        notes = rng.integers(2, 6)
        base = rng.uniform(2600, 4600)
        when = at
        for _ in range(notes):
            long = rng.uniform(0.05, 0.11)
            t = np.arange(int(long * SR)) / SR
            f = base * (1 + rng.uniform(-0.12, 0.2) * t / long)
            chirp = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / long) ** 2
            start = int(when * SR)
            out[start : start + len(chirp)] += chirp * rng.uniform(0.3, 0.9)
            when += long + rng.uniform(0.02, 0.08)
        at = when + rng.exponential(0.9)
    return fade(out, 0.3, 1.2)


EFFECTS = {
    "fire": fire,
    "scratch": scratch,
    "scrape": scrape,
    "page": page,
    "shimmer": shimmer,
    "stamp": stamp,
    "thread": thread,
    "birds": birds,
}


def level_voice():
    """Every line of the narrator at the same loudness."""
    lines = json.load(open("src/film/vo.json"))
    for name, spoken in lines.items():
        voice = load(f"{OUT}/raw/{name}.mp3")[: int(spoken["duration"] * SR)]
        loud = voice[np.abs(voice) > 0.02]
        voice = voice * (0.125 / np.sqrt(np.mean(loud ** 2)))
        voice = np.tanh(voice / 0.9) * 0.9
        save(name, fade(voice, 0.005, 0.12), peak=min(0.9, np.abs(voice).max()))


if __name__ == "__main__":
    only_missing = "--only-missing" in sys.argv
    os.makedirs(OUT, exist_ok=True)
    level_voice()

    lines = json.load(open("src/film/vo.json"))
    total = 1.7 + sum(v["duration"] + v["gap"] for v in lines.values())

    for name, make in {**EFFECTS, "music": lambda: music(total)}.items():
        if only_missing and os.path.exists(f"{OUT}/{name}.mp3"):
            continue
        save(name, make(), 0.85 if name == "music" else 0.9)
        print("made", name)

    names = sorted(
        f[:-4] for f in os.listdir(OUT) if f.endswith(".mp3") and f[:-4] not in lines
    )
    with open("src/film/sounds.json", "w") as handle:
        json.dump(names, handle)
        handle.write("\n")
    print("sounds:", ", ".join(names))
