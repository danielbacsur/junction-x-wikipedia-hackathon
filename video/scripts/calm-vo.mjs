// Records the narration of the calm cut with ElevenLabs' v3 model, one
// file a passage, sped up a little, with the word timings the cuts hang on.
//   ELEVEN_KEY_FILE=/path/to/key node scripts/fast-vo.mjs [ids…]
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const key = readFileSync(process.env.ELEVEN_KEY_FILE, "utf8").trim();
const VOICE = process.env.ELEVEN_VOICE ?? "Xb7hH8MSUJpSbSDYk0k2";
const TEMPO = Number(process.env.TEMPO ?? 1);
const script = JSON.parse(readFileSync("calm-script.json", "utf8"));
const only = process.argv.slice(2);
const manifestPath = "src/calm/vo.json";
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, "utf8"))
  : {};

for (const line of script) {
  if (only.length > 0 && !only.includes(line.id)) continue;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: line.text,
        model_id: "eleven_v3",
        voice_settings: { stability: 0.5 },
      }),
    },
  );

  if (!response.ok) {
    console.error(line.id, response.status, await response.text());
    process.exit(1);
  }

  const { audio_base64, alignment } = await response.json();
  const raw = `public/calm/audio/raw/${line.id}.mp3`;
  const file = `public/calm/audio/${line.id}.mp3`;
  writeFileSync(raw, Buffer.from(audio_base64, "base64"));

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

  // Cut the silence before the first word and after the last, then speed up.
  const from = Math.max(0, words[0].start - 0.06);
  const to = words.at(-1).end + 0.22;
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-ss", String(from), "-t", String(to - from), "-i", raw,
    "-af", `atempo=${TEMPO}`, "-b:a", "192k", file,
  ]);

  manifest[line.id] = {
    gap: line.gap,
    text: line.text.replace(/\[[^\]]*\]\s*/g, ""),
    duration: (to - from) / TEMPO,
    words: words.map((w) => ({
      w: w.w,
      start: (w.start - from) / TEMPO,
      end: (w.end - from) / TEMPO,
    })),
  };
  console.log(line.id.padEnd(8), manifest[line.id].duration.toFixed(2), "s", (words.length / manifest[line.id].duration).toFixed(2), "w/s");
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
