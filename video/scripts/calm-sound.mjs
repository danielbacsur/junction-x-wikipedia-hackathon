// The music and the extra ambience of the calm cut, made with ElevenLabs.
// The other effects are shared with the fast cut (public/fast/audio).
//   ELEVEN_KEY_FILE=/path/to/key node scripts/calm-sound.mjs [names…]
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const key = readFileSync(process.env.ELEVEN_KEY_FILE, "utf8").trim();
const only = process.argv.slice(2);

const post = async (path, body) => {
  const response = await fetch(`https://api.elevenlabs.io${path}`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`${path} ${response.status} ${await response.text()}`);
  }

  return Buffer.from(await response.arrayBuffer());
};

const wanted = (name) =>
  only.length > 0 ? only.includes(name) : !existsSync(`public/calm/audio/${name}.mp3`);

if (wanted("meadow")) {
  writeFileSync(
    "public/calm/audio/meadow.mp3",
    await post("/v1/sound-generation?output_format=mp3_44100_128", {
      text: "a sunny meadow by the sea: soft breeze, distant gentle waves, a few songbirds",
      duration_seconds: 9,
      prompt_influence: 0.5,
    }),
  );
  console.log("made meadow");
}

if (wanted("evening")) {
  writeFileSync(
    "public/calm/audio/evening.mp3",
    await post("/v1/sound-generation?output_format=mp3_44100_128", {
      text: "a calm summer evening outdoors: crickets, a soft breeze, one distant bird",
      duration_seconds: 9,
      prompt_influence: 0.5,
    }),
  );
  console.log("made evening");
}

if (wanted("music")) {
  writeFileSync(
    "public/calm/audio/music.mp3",
    await post("/v1/music?output_format=mp3_44100_128", {
      prompt:
        "Warm, colourful storybook orchestral music for a 76 second animated short film. " +
        "Relaxed and unhurried, about 92 BPM. It opens like a sunny morning: harp, soft " +
        "flute and gentle pizzicato strings. From 19 seconds a curious, lightly playful " +
        "passage with clarinet and glockenspiel. At 30 seconds a bright, glowing swell. " +
        "From 34 seconds a flowing, cheerful theme with strings and piano that grows " +
        "slowly warmer. At 61 seconds it broadens into a tender, hopeful full-orchestra " +
        "ending, with a soft final chord at 72 seconds. Instrumental only, no vocals, " +
        "no heavy drums.",
      music_length_ms: 76000,
      force_instrumental: true,
    }),
  );
  console.log("made music");
}
