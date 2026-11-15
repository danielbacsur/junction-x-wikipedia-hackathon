"""Stand-in sound effects and music, synthesised locally.

They keep the film whole until ElevenLabs can make the real ones
(scripts/sounds.mjs). Writes public/audio/*.mp3 and src/sounds.json.

    python3 scripts/standin.py [--only-missing]
"""

import json
import os
import subprocess
import sys

import numpy as np

SR = 44100
OUT = "public/audio"
rng = np.random.default_rng(7)


def seconds(length):
    return np.arange(int(length * SR)) / SR


def noise(length):
    return rng.uniform(-1, 1, int(length * SR))


def band(signal, low=None, high=None):
    """Keep the frequencies between low and high."""
    spectrum = np.fft.rfft(signal)
    freqs = np.fft.rfftfreq(len(signal), 1 / SR)
    keep = np.ones_like(freqs)
    if low:
        keep *= 1 / (1 + (low / np.maximum(freqs, 1)) ** 6)
    if high:
        keep *= 1 / (1 + (freqs / high) ** 6)
    return np.fft.irfft(spectrum * keep, len(signal))


def sweep(start, end, length, curve=1.0):
    """The phase of a tone gliding from one pitch to another."""
    t = seconds(length)
    freq = start + (end - start) * (t / length) ** curve
    return 2 * np.pi * np.cumsum(freq) / SR


def fade(signal, attack=0.003, release=0.01):
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
    raw = (signal * 32767).astype("<i2").tobytes()
    subprocess.run(
        [
            "ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR),
            "-ac", "2", "-i", "-", "-b:a", "192k", f"{OUT}/{name}.mp3",
        ],
        input=raw,
        check=True,
    )


# ---------------------------------------------------------------- effects


def click(pitch=1900.0, level=1.0):
    t = seconds(0.07)
    tone = np.exp(-t * 90) * np.sin(2 * np.pi * pitch * t) * 0.6
    snap = band(noise(0.07), low=2500) * np.exp(-t * 320) * 0.6
    thock = np.exp(-t * 60) * np.sin(2 * np.pi * 170 * t) * 0.5
    return fade((tone + snap + thock) * level)


def tick():
    t = seconds(0.1)
    return fade(
        np.exp(-t * 110) * np.sin(2 * np.pi * 1350 * t) * 0.6
        + band(noise(0.1), low=3000) * np.exp(-t * 420) * 0.4
    )


def pop():
    t = seconds(0.2)
    return fade(np.exp(-t * 20) * np.sin(sweep(360, 980, 0.2, 0.6)))


def typing(length=5.2):
    out = np.zeros(int(length * SR))
    at = 0.02
    while at < length - 0.1:
        key = click(rng.uniform(1500, 2600), rng.uniform(0.55, 1.0))
        start = int(at * SR)
        out[start : start + len(key)] += key
        at += rng.uniform(0.055, 0.125)
    return out


def whoosh(length=0.6, rising=True):
    t = seconds(length)
    n = noise(length)
    low = band(n, 250, 1400)
    high = band(n, 1400, 8000)
    mix = t / length if rising else 1 - t / length
    shape = np.sin(np.pi * (t / length) ** 0.8) ** 2
    return fade((low * (1 - mix) + high * mix) * shape, 0.02, 0.05)


def impact(length=1.5):
    t = seconds(length)
    sub = np.sin(sweep(95, 40, length, 0.25)) * np.exp(-t * 3.4)
    thud = band(noise(length), high=900) * np.exp(-t * 16) * 0.9
    air = band(noise(length), 1500, 7000) * np.exp(-t * 5) * 0.12
    return fade(sub + thud + air, 0.001, 0.2)


def chime(length=1.2):
    t = seconds(length)
    parts = [(1046.5, 0.5, 4.5), (1568.0, 0.3, 5.5), (2093.0, 0.18, 7.5), (3136.0, 0.07, 10)]
    out = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in parts)
    return fade(out, 0.004, 0.1)


def rewind(length=2.4):
    t = seconds(length)
    phase = sweep(1100, 190, length, 0.7)
    tone = np.sign(np.sin(phase)) * 0.25 + np.sin(phase) * 0.5
    flutter = 0.75 + 0.25 * np.sin(2 * np.pi * 26 * t)
    hiss = band(noise(length), 900, 6000) * 0.5
    shape = np.minimum(1, t / 0.25) * np.minimum(1, (length - t) / 0.5)
    return fade(band((tone + hiss) * flutter, 150, 5000) * shape, 0.02, 0.1)


def count(length=1.9, rate=27.0):
    out = np.zeros(int(length * SR))
    at = 0.0
    while at < length - 0.06:
        t = seconds(0.045)
        pitch = 950 + 600 * (at / length)
        blip = np.exp(-t * 150) * np.sin(2 * np.pi * pitch * t)
        start = int(at * SR)
        out[start : start + len(blip)] += fade(blip, 0.001, 0.005)
        at += 1 / rate
    return out


def step():
    t = seconds(0.45)
    thump = np.sin(sweep(150, 78, 0.45, 0.3)) * np.exp(-t * 13)
    snap = band(noise(0.45), low=2000) * np.exp(-t * 260) * 0.4
    return fade(thump + snap, 0.001, 0.05)


def strike():
    swipe = whoosh(0.42, rising=False)
    t = seconds(0.42)
    thud = np.sin(sweep(120, 60, 0.42, 0.3)) * np.exp(-np.maximum(0, t - 0.22) * 18)
    thud[t < 0.22] = 0
    return fade(swipe * 0.9 + thud * 0.8, 0.005, 0.05)


def scan(length=0.7):
    t = seconds(length)
    tone = np.sin(sweep(1700, 3700, length)) * (0.6 + 0.4 * np.sin(2 * np.pi * 38 * t))
    shape = np.minimum(1, t / 0.08) * np.minimum(1, (length - t) / 0.2)
    return fade(tone * shape * 0.6 + band(noise(length), 4000) * shape * 0.15)


# ------------------------------------------------------------------ music

BAR = 1.9775  # four bars bring the first downbeat onto the name
BEAT = BAR / 4
STEP = BAR / 16
LENGTH = 83.4

# One chord a bar: A minor, F, C, G. Roots for the bass, tones for the arp.
CHORDS = [
    (55.00, [440.00, 523.25, 659.25, 880.00]),
    (43.65, [440.00, 523.25, 698.46, 880.00]),
    (65.41, [392.00, 523.25, 659.25, 783.99]),
    (49.00, [392.00, 493.88, 587.33, 783.99]),
]


def music():
    total = int(LENGTH * SR)
    left = np.zeros(total)
    right = np.zeros(total)
    duck = np.ones(total)

    def put(signal, at, gain=1.0, pan=0.0, delay=0.0):
        start = int(at * SR)
        if start >= total:
            return
        end = min(total, start + len(signal))
        part = signal[: end - start] * gain
        left[start:end] += part * (1 - max(0, pan))
        shifted = start + int(delay * SR)
        end2 = min(total, shifted + len(signal))
        if shifted < total:
            right[shifted:end2] += signal[: end2 - shifted] * gain * (1 + min(0, pan))

    tk = seconds(0.4)
    kick = fade(
        np.sin(sweep(150, 46, 0.4, 0.22)) * np.exp(-tk * 8)
        + band(noise(0.4), low=1500) * np.exp(-tk * 300) * 0.25,
        0.0005,
        0.03,
    )
    tc = seconds(0.22)
    clap = fade(band(noise(0.22), 900, 6500) * (np.exp(-tc * 24) + 0.5 * np.exp(-np.abs(tc - 0.012) * 400)), 0.001, 0.02)
    th = seconds(0.06)
    hat = fade(band(noise(0.06), low=7000) * np.exp(-th * 80), 0.0005, 0.005)
    to = seconds(0.24)
    open_hat = fade(band(noise(0.24), low=6000) * np.exp(-to * 16), 0.001, 0.02)

    def pluck(freq, length=0.36):
        t = seconds(length)
        tone = (
            np.sin(2 * np.pi * freq * t)
            + 0.45 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 9)
            + 0.2 * np.sin(2 * np.pi * freq * 3 * t) * np.exp(-t * 16)
        )
        return fade(tone * np.exp(-t * 11), 0.002, 0.03)

    def bass_note(freq, length):
        t = seconds(length)
        tone = sum(np.sin(2 * np.pi * freq * n * t) / n for n in range(1, 7))
        return fade(tone * (0.55 + 0.45 * np.exp(-t * 9)), 0.004, 0.03)

    def pad(tones, length):
        t = seconds(length)
        out = np.zeros(len(t))
        for f in tones:
            for detune in (0.997, 1.0, 1.004):
                out += np.sin(2 * np.pi * f / 2 * detune * t)
        swell = np.minimum(1, t / 0.5) * np.minimum(1, (length - t) / 0.4)
        return out * swell / 12

    # What plays in each bar: (kick, clap, hats, bass, arp, high arp)
    def parts(bar):
        if bar < 2:
            return (0, 0, 0, 0, 0.5, 0)
        if bar < 4:
            return (0, 0, 0.6, 0, 0.7, 0)
        if bar < 8:
            return (1, 1, 1, 1, 1, 0)
        if bar < 10:
            return (1, 0, 1, 1, 0.6, 0)
        if bar < 14:
            return (1, 1, 1, 1, 0.8, 0)
        if bar < 18:
            return (1, 1, 1, 1, 1, 0)
        if bar < 23:
            return (1, 1, 1, 1, 1, 0.7)
        if bar < 25:
            return (0, 0, 0.7, 0.6, 1, 0)
        if bar < 27:
            return (1, 0, 1, 1, 1, 0)
        if bar < 32:
            return (1, 1, 1, 1, 1, 0)
        if bar < 36:
            return (1, 1, 1, 1, 1, 0.8)
        return (0, 0, 0, 0, 0, 0)

    close = 74.73  # the last card arrives
    bars = int(LENGTH / BAR) + 1

    for bar in range(bars):
        at = bar * BAR
        root, tones = CHORDS[bar % 4]
        k, c, h, b, a, hi = parts(bar)

        if at < close:
            put(pad(tones, BAR + 0.3), at, 0.4 if bar >= 4 else 0.75, delay=0.011)

        for beat in range(4):
            when = at + beat * BEAT
            if k:
                put(kick, when, 0.95)
                start = int(when * SR)
                span = int(0.3 * SR)
                end = min(total, start + span)
                duck[start:end] = np.minimum(
                    duck[start:end], 1 - 0.65 * np.exp(-seconds(0.3)[: end - start] * 11)
                )
            if c and beat in (1, 3):
                put(clap, when, 0.5, delay=0.006)

        for step_ in range(16):
            when = at + step_ * STEP
            if h and step_ % 2 == 0:
                put(hat, when, 0.27 * h * (1.0 if step_ % 4 == 0 else 0.7), pan=0.2)
            if h and step_ % 4 == 2 and bar >= 4:
                put(open_hat, when, 0.16 * h, pan=-0.2)
            if a:
                order = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 3, 1, 2]
                accent = 1.0 if step_ % 4 == 0 else 0.62
                put(pluck(tones[order[step_]]), when, 0.25 * a * accent, pan=-0.25, delay=0.014)
                if hi and step_ % 2 == 0:
                    put(pluck(tones[order[(step_ + 5) % 16]] * 2, 0.28), when, 0.1 * hi, pan=0.3)

        if b:
            for eighth in range(8):
                when = at + eighth * BEAT / 2
                octave = 2 if eighth in (3, 6) else 1
                note = bass_note(root * octave, BEAT / 2 * 0.92)
                put(note, when, 0.19 * b)

    # A rise into the first downbeat, and one into the closing cards.
    for at, length in ((4 * BAR - 3.0, 3.0), (36 * BAR - 1.9, 1.9 + (close - 36 * BAR))):
        t = seconds(length)
        ramp_ = (t / length) ** 2.2
        rise = band(noise(length), low=1800) * ramp_ * 0.35
        rise += np.sin(sweep(220, 1900, length, 2.0)) * ramp_ * 0.12
        put(fade(rise, 0.05, 0.02), at, 1.0, delay=0.009)

    left *= duck
    right *= duck

    # The first downbeat and the last card each land on a hit and a chord.
    for at, gain in ((4 * BAR, 0.8), (close, 1.0)):
        put(impact(1.8), at, 0.9 * gain)
        put(chime(1.4), at, 0.25 * gain, delay=0.012)

    t = seconds(8.4)
    chord = np.zeros(len(t))
    for f in (110.0, 220.0, 261.63, 329.63, 392.0, 440.0, 659.25):
        for detune in (0.997, 1.0, 1.003):
            chord += np.sin(2 * np.pi * f * detune * t)
    chord *= np.minimum(1, t / 0.02) * np.exp(-t * 0.42) / 18
    put(chord, close, 1.0, delay=0.013)

    for index, when in enumerate(np.arange(close + STEP * 2, close + 5.5, STEP * 2)):
        tones = CHORDS[0][1]
        put(pluck(tones[index % 4] * (2 if index % 8 > 3 else 1), 0.5), when, 0.11 * np.exp(-index * 0.09), pan=(-1) ** index * 0.3, delay=0.02)

    mix = np.stack([left, right], axis=1)
    mix = np.tanh(mix * 1.5) / np.tanh(1.5)
    tail = int(1.6 * SR)
    mix[-tail:] *= np.linspace(1, 0, tail)[:, None]
    return mix


EFFECTS = {
    "click": click,
    "tick": tick,
    "pop": pop,
    "typing": typing,
    "whoosh": whoosh,
    "impact": impact,
    "chime": chime,
    "rewind": rewind,
    "count": count,
    "step": step,
    "strike": strike,
    "scan": scan,
}

if __name__ == "__main__":
    only_missing = "--only-missing" in sys.argv
    os.makedirs(OUT, exist_ok=True)

    for name, make in {**EFFECTS, "music": music}.items():
        if only_missing and os.path.exists(f"{OUT}/{name}.mp3"):
            continue
        save(name, make(), 0.85 if name == "music" else 0.9)
        print("made", name)

    names = sorted(
        f[:-4] for f in os.listdir(OUT) if f.endswith(".mp3") and not f.startswith("vo-")
    )
    with open("src/sounds.json", "w") as handle:
        json.dump(names, handle)
        handle.write("\n")
    print("sounds:", ", ".join(names))
