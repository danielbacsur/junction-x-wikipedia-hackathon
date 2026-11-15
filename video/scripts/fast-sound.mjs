// The music and sound effects of the fast cut, made with ElevenLabs.
//   ELEVEN_KEY_FILE=/path/to/key node scripts/fast-sound.mjs [names…]
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

const key = readFileSync(process.env.ELEVEN_KEY_FILE, "utf8").trim();
const only = process.argv.slice(2);
const voice = Object.keys(JSON.parse(readFileSync("src/fast/vo.json", "utf8")));

/** Each effect: what to ask for, and how long it should run. */
const EFFECTS = {
  quill: ["a quill pen scratching quickly on parchment, one fast flourish, close and dry", 1.0],
  scrape: ["a knife blade scraping dry parchment, one quick rasping stroke", 0.8],
  whoosh: ["fast airy whoosh, a quick transition swish", 0.6],
  pages: ["hundreds of loose paper pages fluttering and rushing past in a gust of wind", 3.4],
  impact: ["deep cinematic drum hit with a short tail", 1.6],
  shimmer: ["bright magical shimmer swelling up, glassy and warm", 2.6],
  stamp: ["a heavy wax seal stamped onto paper on a wooden desk, one solid thud", 0.9],
  splat: ["wet ink splattering onto paper, one quick splat", 0.7],
  tick: ["a clock ticking fast and urgently", 2.2],
  flip: ["one stiff playing card flipped over onto a wooden table", 0.5],
  thread: ["a thread pulled quickly through paper, a zipping sound rising in pitch", 1.6],
  ding: ["one small bright bell ding, clean", 1.0],
  birds: ["early morning birdsong, a few small birds chirping", 5.0],
  fire: ["a candle and a small fire crackling softly in a quiet stone room", 4.0],
};

const MUSIC = {
  prompt:
    "Cinematic underscore for an 83 second film that follows a small mystery at a " +
    "brisk pace. About 118 BPM, curious, confident and driving, never frantic. From 0 " +
    "to 9 seconds it is intimate and intriguing: a soft piano motif, pizzicato strings " +
    "and a light pulse. From 9 to 16 seconds it turns old and candlelit: harp and low " +
    "strings over the same pulse. At 16 seconds one drum hit and it opens up into a " +
    "steady investigative groove that runs to 54 seconds: a staccato string ostinato, " +
    "light percussion and claps, bright piano, adding one layer every 8 seconds. From " +
    "54 to 68 seconds the same groove with more tension and a ticking pulse. From 68 " +
    "to 74 seconds it grows to its widest. At 74 seconds one big warm chord for the " +
    "title, a confident resolved theme under the closing line, and a short tail that " +
    "ends by 83 seconds. Instrumental only, no vocals.",
  music_length_ms: 83500,
  force_instrumental: true,
};

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

for (const [name, [text, duration_seconds]] of Object.entries(EFFECTS)) {
  if (only.length > 0 ? !only.includes(name) : existsSync(`public/fast/audio/${name}.mp3`)) continue;

  writeFileSync(
    `public/fast/audio/${name}.mp3`,
    await post("/v1/sound-generation?output_format=mp3_44100_128", {
      text,
      duration_seconds,
      prompt_influence: 0.6,
    }),
  );
  console.log("made", name);
}

if (only.length > 0 ? only.includes("music") : !existsSync("public/fast/audio/music.mp3")) {
  writeFileSync(
    "public/fast/audio/music.mp3",
    await post("/v1/music?output_format=mp3_44100_128", MUSIC),
  );
  console.log("made music");
}

writeFileSync(
  "src/fast/sounds.json",
  JSON.stringify(
    readdirSync("public/fast/audio")
      .filter((file) => file.endsWith(".mp3"))
      .map((file) => file.slice(0, -4))
      .filter((name) => !voice.includes(name))
      .sort(),
  ) + "\n",
);
