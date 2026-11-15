// Records the narration with ElevenLabs, one file a line, and writes the
// word timings the cuts hang on. The raw takes and their timings are kept,
// so the pace can be changed later without recording again.
//   ELEVEN_KEY_FILE=/path/to/key node scripts/cut-vo.mjs [ids…]
//   TEMPO=1.08 node scripts/cut-vo.mjs --retime
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const VOICE = process.env.ELEVEN_VOICE ?? "nPczCjzI2devNBz1zQrb";
const MODEL = process.env.ELEVEN_MODEL ?? "eleven_v4";
const TEMPO = Number(process.env.TEMPO ?? 1);
const GAIN = process.env.GAIN ?? "0dB";
const script = JSON.parse(readFileSync("cut-script.json", "utf8"));
const retime = process.argv.includes("--retime");
const only = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const manifest = {};

for (const line of script) {
  const raw = `public/fast/audio/raw/${line.id}.mp3`;
  const timing = `public/fast/audio/raw/${line.id}.json`;
  const file = `public/fast/audio/${line.id}.mp3`;
  const fresh = !retime && (only.length === 0 || only.includes(line.id) || !existsSync(timing));

  if (fresh) {
    const key = readFileSync(process.env.ELEVEN_KEY_FILE, "utf8").trim();
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({ text: line.text, model_id: MODEL }),
      },
    );

    if (!response.ok) {
      console.error(line.id, response.status, await response.text());
      process.exit(1);
    }

    const { audio_base64, alignment } = await response.json();

    writeFileSync(raw, Buffer.from(audio_base64, "base64"));
    writeFileSync(timing, JSON.stringify(alignment));
  }

  const alignment = JSON.parse(readFileSync(timing, "utf8"));

  // Characters become words; a tag in square brackets is not spoken.
  const words = [];
  let word = null;
  let tag = false;
  alignment.characters.forEach((char, i) => {
    if (char === "[") tag = true;
    if (tag) {
      if (char === "]") tag = false;
      return;
    }
    if (/\s/.test(char)) {
      if (word) words.push(word);
      word = null;
      return;
    }
    word ??= { w: "", start: alignment.character_start_times_seconds[i], end: 0 };
    word.w += char;
    word.end = alignment.character_end_times_seconds[i];
  });
  if (word) words.push(word);

  // Cut the silence around the words, set the pace, and level the voice.
  const from = Math.max(0, words[0].start - 0.06);
  const to = words.at(-1).end + 0.22;
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-ss", String(from), "-t", String(to - from), "-i", raw,
    "-af", `atempo=${TEMPO},volume=${GAIN},alimiter=limit=0.9:attack=3:release=60:level=false`,
    "-b:a", "192k", file,
  ]);

  manifest[line.id] = {
    gap: line.gap,
    text: line.text,
    duration: (to - from) / TEMPO,
    words: words.map((w) => ({
      w: w.w,
      start: (w.start - from) / TEMPO,
      end: (w.end - from) / TEMPO,
    })),
  };
  console.log(line.id.padEnd(9), manifest[line.id].duration.toFixed(2), "s", (words.length / manifest[line.id].duration).toFixed(2), "w/s");
}

writeFileSync("src/fast/vo.json", JSON.stringify(manifest, null, 2) + "\n");

const spoken = Object.values(manifest).reduce((sum, line) => sum + line.duration, 0);
const count = Object.values(manifest).reduce((sum, line) => sum + line.words.length, 0);
console.log("overall", (count / spoken).toFixed(2), "w/s,", count, "words,", spoken.toFixed(1), "s of speech");
