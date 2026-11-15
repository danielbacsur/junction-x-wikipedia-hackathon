// Records the narration of the film with ElevenLabs, one file a sentence,
// and writes the word timings the shots are cued from. Usage:
//   ELEVEN_KEY_FILE=/path/to/key node scripts/film-vo.mjs [ids…]
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const key = readFileSync(process.env.ELEVEN_KEY_FILE, "utf8").trim();
const VOICE = process.env.ELEVEN_VOICE ?? "pFZP5JQG7iQjIQuC4Bku";
const script = JSON.parse(readFileSync("film-script.json", "utf8"));
const only = process.argv.slice(2);
const manifestPath = "src/film/vo.json";
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
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.22,
          use_speaker_boost: true,
          speed: 0.93,
        },
      }),
    },
  );

  if (!response.ok) {
    console.error(line.id, response.status, await response.text());
    process.exit(1);
  }

  const { audio_base64, alignment } = await response.json();
  const raw = `public/film/audio/raw/${line.id}.mp3`;
  const file = `public/film/audio/${line.id}.mp3`;
  writeFileSync(raw, Buffer.from(audio_base64, "base64"));

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

  // Lift the voice to about -16 LUFS under a limiter, and trim the silence
  // the model leaves after the last word.
  const last = words.at(-1).end + 0.25;
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-i", raw, "-t", String(last), "-af",
    `volume=7dB,alimiter=limit=0.84:attack=3:release=60:level=false,afade=t=out:st=${(last - 0.12).toFixed(2)}:d=0.12`,
    "-b:a", "192k", file,
  ]);

  manifest[line.id] = { shot: line.shot, gap: line.gap, text: line.text, duration: last, words };
  console.log(line.id.padEnd(10), last.toFixed(2), "s");
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
