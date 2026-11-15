// Records the voiceover with ElevenLabs, one file per scene, and writes the
// word timings the scenes are cued from. Usage:
//   ELEVEN_KEY_FILE=/path/to/key node scripts/vo.mjs [scene ids…]
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const key = readFileSync(process.env.ELEVEN_KEY_FILE, "utf8").trim();
const VOICE = process.env.ELEVEN_VOICE ?? "nPczCjzI2devNBz1zQrb";
const script = JSON.parse(readFileSync("vo-script.json", "utf8"));
const only = process.argv.slice(2);
const manifestPath = "src/vo.json";
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, "utf8"))
  : {};

for (const [index, line] of script.entries()) {
  if (only.length > 0 && !only.includes(line.id)) continue;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: line.text,
        model_id: "eleven_multilingual_v2",
        previous_text: script[index - 1]?.text,
        next_text: script[index + 1]?.text,
        voice_settings: {
          stability: 0.42,
          similarity_boost: 0.8,
          style: 0.35,
          use_speaker_boost: true,
          speed: 1.05,
        },
      }),
    },
  );

  if (!response.ok) {
    console.error(line.id, response.status, await response.text());
    process.exit(1);
  }

  const { audio_base64, alignment } = await response.json();
  const file = `public/audio/vo-${line.id}.mp3`;
  const raw = `public/audio/raw/vo-${line.id}.mp3`;
  mkdirSync("public/audio/raw", { recursive: true });
  writeFileSync(raw, Buffer.from(audio_base64, "base64"));

  // The voice comes back quiet: lift it to about -16 LUFS under a limiter.
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-i", raw, "-af",
    "volume=7.5dB,alimiter=limit=0.84:attack=3:release=60:level=false",
    "-b:a", "192k", file,
  ]);

  // Characters become words, each with the moment it starts and ends.
  const words = [];
  let word = null;
  alignment.characters.forEach((char, i) => {
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

  const duration = Number(
    execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file,
    ]).toString(),
  );

  manifest[line.id] = { text: line.text, duration, words };
  console.log(line.id, duration.toFixed(2), "s,", words.length, "words");
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
