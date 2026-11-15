// Makes the sound effects and the music with ElevenLabs, replacing the
// stand-ins from scripts/standin.py. The key needs the Sound Effects and
// Music permissions. Usage:
//   ELEVEN_KEY_FILE=/path/to/key node scripts/sounds.mjs [names…]
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const key = readFileSync(process.env.ELEVEN_KEY_FILE, "utf8").trim();
const only = process.argv.slice(2);

/** Each effect: what to ask for, and how long it should run. */
const EFFECTS = {
  click: ["single crisp computer mouse click, close and dry", 0.5],
  tick: ["one soft mechanical tick, like a split-flap display turning once", 0.5],
  pop: ["short soft interface pop, a bubble blip rising in pitch", 0.5],
  typing: ["fast typing on a mechanical keyboard, steady, close, dry", 5.5],
  whoosh: ["quick airy whoosh, a fast transition swoosh", 0.8],
  impact: ["deep cinematic bass impact with a short tail, trailer hit", 1.8],
  chime: ["bright soft confirmation chime, two glassy notes", 1.4],
  rewind: ["tape rewinding quickly, pitch falling, ending cleanly", 2.4],
  count: ["rapid digital counter ticking upward, many fast blips", 2.0],
  step: ["short punchy low thump with a click, a block dropping", 0.6],
  strike: ["quick paper tear swipe ending in a soft thud", 0.7],
  scan: ["short high digital scanner sweep, a shimmer rising", 0.8],
};

const MUSIC = {
  prompt:
    "Dynamic product launch advert music for a technology demo. 121 BPM, " +
    "A minor. Opens with eight seconds of a soft pulse and a rising sweep, " +
    "then drops into a confident driving beat: punchy four-on-the-floor " +
    "kick, tight claps, bright plucked synth arpeggio, warm pulsing bass. " +
    "Modern, clean and optimistic, with a short breakdown in the middle and " +
    "a lift near the end. At 74 seconds it stops on one big final hit and a " +
    "held chord that fades out. Instrumental, no vocals.",
  music_length_ms: 84000,
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
  if (only.length > 0 && !only.includes(name)) continue;

  writeFileSync(
    `public/audio/${name}.mp3`,
    await post("/v1/sound-generation?output_format=mp3_44100_128", {
      text,
      duration_seconds,
      prompt_influence: 0.6,
    }),
  );
  console.log("made", name);
}

if (only.length === 0 || only.includes("music")) {
  writeFileSync(
    "public/audio/music.mp3",
    await post("/v1/music?output_format=mp3_44100_128", MUSIC),
  );
  console.log("made music");
}

writeFileSync(
  "src/sounds.json",
  JSON.stringify(
    readdirSync("public/audio")
      .filter((file) => file.endsWith(".mp3") && !file.startsWith("vo-"))
      .map((file) => file.slice(0, -4))
      .sort(),
  ) + "\n",
);
