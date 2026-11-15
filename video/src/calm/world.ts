import type { Brush, Rng } from "../film/paint";
import { seeded, shade } from "../film/paint";

/**
 * A brighter world for the same story: a monastery on a green hill above
 * the sea, a hall lit through stained glass, and pages with painted borders.
 */

const W = 1920;
const H = 1080;

type Ctx = CanvasRenderingContext2D;
type Stops = [number, string][];

const poly = (c: Ctx, points: [number, number][], fill: string) => {
  c.fillStyle = fill;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
};

const ellipse = (
  c: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
  turn = 0,
) => {
  c.fillStyle = fill;
  c.beginPath();
  c.ellipse(x, y, rx, ry, turn, 0, Math.PI * 2);
  c.fill();
};

const blob = (
  c: Ctx,
  x: number,
  y: number,
  r: number,
  colour: string,
  mode: GlobalCompositeOperation = "source-over",
) => {
  const g = c.createRadialGradient(x, y, 0, x, y, r);

  g.addColorStop(0, colour);
  g.addColorStop(1, colour.replace(/[\d.]+\)$/, "0)"));
  c.globalCompositeOperation = mode;
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.globalCompositeOperation = "source-over";
};

const wash = (
  c: Ctx,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  stops: Stops,
) => {
  const g = c.createLinearGradient(x0, y0, x1, y1);

  stops.forEach(([at, colour]) => g.addColorStop(at, colour));

  return g;
};

/** A heap of cloud: shadow underneath, body, and light on top. */
const cloud = (
  c: Ctx,
  x: number,
  y: number,
  s: number,
  tones: [string, string, string],
  rand: Rng,
) => {
  const lumps = Array.from({ length: 11 }, (_, i) => {
    const lift = Math.sin((i / 10) * Math.PI);

    return {
      x: x + (i - 5) * 30 * s + (rand() - 0.5) * 18 * s,
      y: y - lift * 30 * s,
      r: (30 + lift * 36 + rand() * 14) * s,
    };
  });

  for (const l of lumps)
    ellipse(c, l.x, l.y + l.r * 0.42, l.r * 1.12, l.r * 0.78, tones[2]);
  for (const l of lumps) ellipse(c, l.x, l.y, l.r, l.r * 0.84, tones[1]);
  for (const l of lumps)
    ellipse(
      c,
      l.x - l.r * 0.16,
      l.y - l.r * 0.26,
      l.r * 0.7,
      l.r * 0.52,
      tones[0],
    );
};

/** A tree with a round crown, lit from the upper right. */
const tree = (
  c: Ctx,
  x: number,
  y: number,
  s: number,
  dark: string,
  light: string,
) => {
  c.fillStyle = "#6b4a2c";
  c.fillRect(x - 7 * s, y - 60 * s, 14 * s, 70 * s);
  ellipse(c, x, y - 110 * s, 70 * s, 62 * s, dark);
  ellipse(c, x - 34 * s, y - 84 * s, 46 * s, 40 * s, dark);
  ellipse(c, x + 36 * s, y - 88 * s, 44 * s, 38 * s, dark);
  ellipse(c, x + 16 * s, y - 128 * s, 44 * s, 34 * s, light);
  ellipse(c, x - 22 * s, y - 112 * s, 26 * s, 20 * s, light);
};

/** The monastery on its hill above the sea, by day or at dusk. */
function hill(c: Ctx, dusk: boolean, rand: Rng) {
  c.fillStyle = wash(
    c,
    0,
    0,
    0,
    600,
    dusk
      ? [
          [0, "#241f63"],
          [0.45, "#7d3d92"],
          [0.78, "#f0705c"],
          [1, "#ffc76e"],
        ]
      : [
          [0, "#2f84de"],
          [0.6, "#7cc4f4"],
          [1, "#d6f1f7"],
        ],
  );
  c.fillRect(0, 0, W, 620);

  if (dusk) {
    const stars = seeded(21);

    for (let i = 0; i < 90; i++) {
      const size = stars() < 0.2 ? 3.2 : 1.8;

      ellipse(c, stars() * W, stars() * 300, size, size, "#fff3d6");
    }

    blob(c, 1420, 600, 520, "rgba(255,226,140,0.85)", "lighter");
    ellipse(c, 1420, 592, 78, 78, "#fff0b0");
  } else {
    blob(c, 1560, 170, 330, "rgba(255,250,210,0.75)", "lighter");
    ellipse(c, 1560, 170, 74, 74, "#fffbe0");
  }

  const tones: [string, string, string] = dusk
    ? ["#ffd9a8", "#ff9d86", "#7c4a94"]
    : ["#ffffff", "#f0f6ff", "#c3d8f0"];

  cloud(c, 330, 250, 2.3, tones, rand);
  cloud(c, 860, 150, 1.5, tones, rand);
  cloud(c, 1240, 330, 1.2, tones, rand);
  cloud(c, 1740, 420, 1.7, tones, rand);
  cloud(c, 620, 430, 1.0, tones, rand);

  // Islands on the horizon, and the sea.
  poly(
    c,
    [
      [0, 580],
      [180, 540],
      [420, 566],
      [640, 548],
      [820, 574],
      [1100, 560],
      [1500, 578],
      [1920, 552],
      [1920, 620],
      [0, 620],
    ],
    dusk ? "#4b3a82" : "#79b0d4",
  );
  c.fillStyle = wash(
    c,
    0,
    596,
    0,
    760,
    dusk
      ? [
          [0, "#e07a6a"],
          [0.4, "#6a4a96"],
          [1, "#2f3476"],
        ]
      : [
          [0, "#8fe0e6"],
          [0.5, "#27a9c2"],
          [1, "#1d7fb0"],
        ],
  );
  c.fillRect(0, 596, W, 180);

  for (let i = 0; i < 70; i++) {
    const y = 604 + rand() * 150;

    c.fillStyle = dusk ? "rgba(255,196,120,0.5)" : "rgba(255,255,255,0.55)";
    c.fillRect(
      dusk ? 1180 + rand() * 480 : rand() * W,
      y,
      30 + rand() * 90,
      3 + (y - 600) / 40,
    );
  }

  for (const [x, y] of [
    [420, 640],
    [760, 668],
    [1700, 650],
  ] as const) {
    poly(
      c,
      [
        [x, y],
        [x + 16, y - 38],
        [x + 20, y],
      ],
      dusk ? "#ffd9a8" : "#ffffff",
    );
    poly(
      c,
      [
        [x - 14, y + 2],
        [x + 30, y + 2],
        [x + 22, y + 10],
        [x - 6, y + 10],
      ],
      dusk ? "#3a2a5a" : "#7a4a2c",
    );
  }

  // A village on the shore.
  const roofs = dusk ? ["#8a3550", "#a8475a"] : ["#e8532f", "#f0763a"];

  for (let i = 0; i < 9; i++) {
    const x = 120 + i * 34 + rand() * 10;
    const y = 690 - rand() * 26;
    const wide = 26 + rand() * 12;

    c.fillStyle = dusk ? "#7d6a9a" : "#fff6e0";
    c.fillRect(x, y, wide, 30);
    poly(
      c,
      [
        [x - 4, y],
        [x + wide / 2, y - 18],
        [x + wide + 4, y],
      ],
      roofs[i % 2],
    );

    if (dusk) {
      c.fillStyle = "#ffd96b";
      c.fillRect(x + wide / 2 - 4, y + 10, 8, 10);
    }
  }

  // The far slope and the hill the monastery stands on.
  c.fillStyle = wash(
    c,
    0,
    520,
    0,
    900,
    dusk
      ? [
          [0, "#3b6a58"],
          [1, "#24483f"],
        ]
      : [
          [0, "#7bd05a"],
          [1, "#4aa843"],
        ],
  );
  c.beginPath();
  c.moveTo(0, 730);
  c.bezierCurveTo(260, 690, 420, 700, 640, 720);
  c.bezierCurveTo(820, 660, 1020, 560, 1180, 528);
  c.bezierCurveTo(1300, 505, 1420, 512, 1500, 540);
  c.bezierCurveTo(1650, 590, 1800, 650, 1920, 690);
  c.lineTo(1920, 1080);
  c.lineTo(0, 1080);
  c.closePath();
  c.fill();

  for (let i = 0; i < 26; i++) {
    ellipse(
      c,
      500 + rand() * 1300,
      620 + rand() * 180,
      60 + rand() * 120,
      16 + rand() * 20,
      dusk ? "rgba(255,150,100,0.13)" : "rgba(190,240,120,0.3)",
    );
  }

  // The monastery: a hall, a tower, a chapel, and cypresses beside them.
  const stone = dusk ? "#8a709a" : "#f3e6c8";
  const shadow = dusk ? "#5a4678" : "#d2bf98";
  const tile = dusk ? "#8e3350" : "#e25a31";
  const pane = dusk ? "#ffd86a" : "#35568f";

  for (const [x, y, rx, ry] of [
    [1066, 480, 22, 76],
    [1492, 474, 24, 86],
    [1534, 506, 18, 60],
  ]) {
    ellipse(c, x, y, rx, ry, dusk ? "#1f3f3c" : "#2f8a44");
    ellipse(c, x + 5, y - 12, rx * 0.5, ry * 0.7, dusk ? "#2c5a50" : "#49aa55");
  }

  c.fillStyle = stone;
  c.fillRect(1094, 458, 84, 78);
  c.fillRect(1172, 404, 204, 134);
  c.fillRect(1388, 300, 62, 240);
  c.fillStyle = shadow;
  c.fillRect(1172, 404, 40, 134);
  c.fillRect(1388, 300, 16, 240);
  poly(
    c,
    [
      [1082, 460],
      [1136, 416],
      [1190, 460],
    ],
    tile,
  );
  poly(
    c,
    [
      [1156, 406],
      [1274, 330],
      [1392, 406],
    ],
    tile,
  );
  poly(
    c,
    [
      [1376, 304],
      [1419, 212],
      [1462, 304],
    ],
    tile,
  );
  poly(
    c,
    [
      [1274, 330],
      [1392, 406],
      [1340, 406],
    ],
    shade(tile, -0.2),
  );

  for (const [x, y, w, h] of [
    [1222, 446, 22, 44],
    [1268, 446, 22, 44],
    [1314, 446, 22, 44],
    [1408, 340, 22, 40],
    [1408, 420, 22, 40],
    [1126, 484, 20, 34],
  ]) {
    c.fillStyle = pane;
    c.fillRect(x, y + w / 2, w, h - w / 2);
    ellipse(c, x + w / 2, y + w / 2, w / 2, w / 2, pane);

    if (dusk)
      blob(c, x + w / 2, y + h / 2, 60, "rgba(255,214,110,0.5)", "lighter");
  }

  c.fillStyle = dusk ? "#3a2a4a" : "#7a4a2c";
  c.fillRect(1338, 492, 26, 46);
  ellipse(c, 1351, 492, 13, 13, dusk ? "#3a2a4a" : "#7a4a2c");

  // The path down from its door.
  c.fillStyle = dusk ? "#9c7f96" : "#f6e4b4";
  c.beginPath();
  c.moveTo(1340, 538);
  c.bezierCurveTo(1260, 640, 1010, 700, 900, 860);
  c.bezierCurveTo(850, 940, 870, 1010, 940, 1080);
  c.lineTo(1150, 1080);
  c.bezierCurveTo(1010, 1000, 1000, 930, 1040, 860);
  c.bezierCurveTo(1120, 720, 1300, 650, 1364, 538);
  c.closePath();
  c.fill();

  tree(
    c,
    290,
    760,
    1.5,
    dusk ? "#1f4a40" : "#2f8f45",
    dusk ? "#3a6a52" : "#5cc052",
  );
  tree(
    c,
    660,
    690,
    0.9,
    dusk ? "#1f4a40" : "#2f8f45",
    dusk ? "#3a6a52" : "#5cc052",
  );
  tree(
    c,
    1700,
    740,
    1.3,
    dusk ? "#1f4a40" : "#2f8f45",
    dusk ? "#3a6a52" : "#5cc052",
  );

  // The meadow in front, with its grass and its flowers.
  c.fillStyle = wash(
    c,
    0,
    820,
    0,
    1080,
    dusk
      ? [
          [0, "#2f6350"],
          [1, "#173a36"],
        ]
      : [
          [0, "#8fdc4f"],
          [1, "#3f9f3a"],
        ],
  );
  c.beginPath();
  c.moveTo(0, 850);
  c.bezierCurveTo(400, 800, 900, 830, 1920, 870);
  c.lineTo(1920, 1080);
  c.lineTo(0, 1080);
  c.closePath();
  c.fill();

  for (let i = 0; i < 1500; i++) {
    const x = rand() * W;
    const y = 850 + rand() * 230;
    const tall = 18 + ((y - 850) / 230) * 50 * (0.5 + rand());

    if (x > 860 && x < 1160 && y > 860) continue;

    c.strokeStyle = dusk
      ? ["#3f7a5a", "#1f4a40", "#57906a"][i % 3]
      : ["#b7f06a", "#58b63e", "#d7f58a", "#3f9a3a"][i % 4];
    c.lineWidth = 2.5 + rand() * 3;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + 6, y - tall * 0.6, x + 14 + rand() * 10, y - tall);
    c.stroke();
  }

  const petals = dusk
    ? ["#ffd0a8", "#e58aa0", "#c9a8f0", "#ffe9a8"]
    : ["#ff4f4a", "#ffd83a", "#ffffff", "#b866e0", "#3f8ff0", "#ff8ab8"];

  for (let i = 0; i < 520; i++) {
    const x = rand() * W;
    const y = 860 + rand() * 215;
    const size = 3 + ((y - 860) / 215) * 6 * (0.6 + rand());

    if (x > 850 && x < 1170 && y > 860) continue;

    ellipse(c, x, y, size, size, petals[Math.floor(rand() * petals.length)]);
  }

  blob(
    c,
    960,
    1100,
    1300,
    dusk ? "rgba(20,10,50,0.42)" : "rgba(20,60,20,0.14)",
  );
}

/** The writing hall by day, lit through coloured glass. */
function hall(c: Ctx, rand: Rng) {
  const glass = [
    "#2f6fd6",
    "#de4630",
    "#f2b93a",
    "#39a95c",
    "#8b4fc4",
    "#35b8c9",
  ];

  c.fillStyle = wash(c, 0, 0, 0, 860, [
    [0, "#f0dcb2"],
    [1, "#d7b888"],
  ]);
  c.fillRect(0, 0, W, 860);

  for (let row = 0; row < 9; row++) {
    const offset = row % 2 ? 95 : 0;

    for (let x = -offset; x < W; x += 190) {
      c.fillStyle = shade("#e6cfa2", (rand() - 0.5) * 0.12);
      c.fillRect(x + 4, row * 96 + 4, 182, 88);
    }
  }

  // The floor: red and cream tiles.
  c.fillStyle = "#c96a42";
  c.fillRect(0, 860, W, 220);

  for (let row = 0; row < 4; row++) {
    const y = 860 + row * 55;
    const lean = row * 46;

    for (let col = -2; col < 12; col++) {
      if ((col + row) % 2) continue;

      poly(
        c,
        [
          [col * 200 - lean, y],
          [col * 200 + 200 - lean, y],
          [col * 200 + 154 - lean, y + 55],
          [col * 200 - 46 - lean, y + 55],
        ],
        "#eedcb6",
      );
    }
  }

  // The window: an arch of small panes, with a rose at the top.
  const arch = () => {
    c.beginPath();
    c.moveTo(1150, 650);
    c.lineTo(1150, 350);
    c.arc(1350, 350, 200, Math.PI, 0);
    c.lineTo(1550, 650);
    c.closePath();
  };

  c.save();
  arch();
  c.clip();
  c.fillStyle = "#9fd4f5";
  c.fillRect(1140, 140, 420, 520);

  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 9; col++) {
      const x = 1150 + col * 50 + (row % 2 ? 25 : 0);
      const y = 150 + row * 44;

      poly(
        c,
        [
          [x, y + 22],
          [x + 25, y],
          [x + 50, y + 22],
          [x + 25, y + 44],
        ],
        shade(glass[Math.floor(rand() * glass.length)], rand() * 0.25),
      );
    }
  }

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;

    poly(
      c,
      [
        [1350, 320],
        [1350 + Math.cos(a - 0.24) * 120, 320 + Math.sin(a - 0.24) * 120],
        [1350 + Math.cos(a + 0.24) * 120, 320 + Math.sin(a + 0.24) * 120],
      ],
      glass[i % glass.length],
    );
  }

  ellipse(c, 1350, 320, 34, 34, "#fff3b8");
  blob(c, 1350, 380, 420, "rgba(255,255,230,0.08)", "lighter");
  c.restore();

  c.lineWidth = 26;
  c.strokeStyle = "#b99a6a";
  arch();
  c.stroke();
  c.fillStyle = "#b99a6a";
  c.fillRect(1340, 440, 20, 210);
  c.fillRect(1150, 440, 400, 16);
  poly(
    c,
    [
      [1110, 650],
      [1590, 650],
      [1612, 684],
      [1088, 684],
    ],
    "#cdb084",
  );

  // Coloured light across the wall, the desk and the floor.
  c.globalCompositeOperation = "source-over";

  for (let i = 0; i < 26; i++) {
    const x = 520 + rand() * 900;
    const y = 700 + rand() * 330;
    const s = 46 + rand() * 50;
    const [r, g, b] = [
      glass[i % glass.length].slice(1, 3),
      glass[i % glass.length].slice(3, 5),
      glass[i % glass.length].slice(5, 7),
    ].map((h) => parseInt(h, 16));

    poly(
      c,
      [
        [x, y],
        [x + s, y - s * 0.3],
        [x + s * 1.4, y + s * 0.2],
        [x + s * 0.4, y + s * 0.5],
      ],
      `rgba(${r},${g},${b},0.3)`,
    );
  }

  poly(
    c,
    [
      [1150, 200],
      [1550, 200],
      [1420, 1080],
      [520, 1080],
    ],
    "rgba(255,236,170,0.08)",
  );
  c.globalCompositeOperation = "source-over";

  // A tapestry, and the shelves of books.
  c.fillStyle = "#2f8a5a";
  c.fillRect(640, 150, 300, 300);
  c.fillStyle = "#f2b93a";
  c.fillRect(640, 150, 300, 18);
  c.fillRect(640, 432, 300, 18);
  ellipse(c, 790, 300, 70, 70, "#f2b93a");
  ellipse(c, 790, 300, 48, 48, "#de4630");
  ellipse(c, 790, 300, 20, 20, "#fff3b8");

  const shelves = seeded(5);
  const wood = "#9a6436";

  c.fillStyle = shade(wood, -0.45);
  c.fillRect(70, 150, 470, 660);

  const spines = [
    "#e0412f",
    "#2f6fd6",
    "#39a95c",
    "#f2b93a",
    "#8b4fc4",
    "#35b8c9",
    "#f07a3a",
    "#d94f8a",
  ];

  for (let shelf = 0; shelf < 4; shelf++) {
    const base = 150 + (shelf + 1) * 160;
    let x = 92;

    while (x < 505) {
      const wide = 18 + shelves() * 28;
      const tall = 82 + shelves() * 46;
      const colour = spines[Math.floor(shelves() * spines.length)];

      c.fillStyle = colour;
      c.fillRect(x, base - tall, wide, tall);
      c.fillStyle = "#ffe9a8";
      c.fillRect(x + 2, base - tall + tall * 0.18, wide - 4, 4);
      c.fillRect(x + 2, base - tall * 0.22, wide - 4, 4);
      x += wide + 3;
    }

    c.fillStyle = shade(wood, 0.15);
    c.fillRect(70, base, 470, 14);
  }

  c.fillStyle = wood;
  c.fillRect(56, 136, 16, 688);
  c.fillRect(538, 136, 16, 688);
  c.fillRect(56, 136, 498, 16);

  // A plant on top of the shelves.
  c.fillStyle = "#c9683f";
  c.fillRect(250, 92, 70, 46);

  for (let i = 0; i < 9; i++) {
    ellipse(
      c,
      285 + (i - 4) * 16,
      70 - Math.abs(i - 4) * -6,
      12,
      34,
      i % 2 ? "#39a95c" : "#5cc86a",
      (i - 4) * 0.28,
    );
  }

  // A rug, the stool and the desk.
  poly(
    c,
    [
      [380, 960],
      [1010, 930],
      [1060, 1050],
      [340, 1080],
    ],
    "#b8322c",
  );
  poly(
    c,
    [
      [420, 976],
      [980, 950],
      [1010, 1030],
      [400, 1056],
    ],
    "#f2b93a",
  );
  poly(
    c,
    [
      [470, 990],
      [940, 968],
      [962, 1014],
      [456, 1038],
    ],
    "#b8322c",
  );

  c.fillStyle = shade(wood, -0.2);
  c.fillRect(548, 900, 16, 120);
  c.fillRect(662, 900, 16, 120);
  c.fillRect(536, 884, 156, 22);

  poly(
    c,
    [
      [690, 650],
      [720, 752],
      [720, 1040],
      [690, 940],
    ],
    shade(wood, -0.35),
  );
  poly(
    c,
    [
      [720, 752],
      [1200, 700],
      [1200, 1004],
      [720, 1040],
    ],
    shade(wood, -0.12),
  );
  poly(
    c,
    [
      [690, 650],
      [1140, 612],
      [1200, 700],
      [720, 752],
    ],
    "#d99a54",
  );
  poly(
    c,
    [
      [690, 650],
      [1140, 612],
      [1146, 622],
      [694, 661],
    ],
    "#f0bd7a",
  );

  poly(
    c,
    [
      [800, 652],
      [1020, 634],
      [1060, 702],
      [826, 724],
    ],
    "#fff6d8",
  );
  c.strokeStyle = "rgba(70,40,20,0.6)";
  c.lineWidth = 3;

  for (let i = 0; i < 5; i++) {
    c.beginPath();
    c.moveTo(826 + i * 5, 664 + i * 11);
    c.lineTo(1000 + i * 7 - (i === 4 ? 70 : 0), 650 + i * 11);
    c.stroke();
  }

  ellipse(c, 1088, 648, 22, 15, "#1f3f8a");
  ellipse(c, 1088, 640, 15, 6, "#4f7fe0");
  ellipse(c, 1128, 660, 16, 11, "#b8322c");

  // Flowers in a jug at the corner of the desk.
  c.fillStyle = "#35b8c9";
  c.fillRect(1146, 600, 36, 54);

  for (let i = 0; i < 9; i++) {
    const x = 1164 + (i - 4) * 13;
    const y = 566 - (4 - Math.abs(i - 4)) * 9;

    c.strokeStyle = "#39a95c";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(1164, 604);
    c.lineTo(x, y);
    c.stroke();
    ellipse(
      c,
      x,
      y,
      11,
      11,
      ["#de4630", "#f2b93a", "#8b4fc4", "#ffffff", "#ff8ab8"][i % 5],
    );
  }

  // The scribe, in blue.
  const robe = "#2c56a8";
  const figure = new Path2D();

  figure.moveTo(500, 1000);
  figure.bezierCurveTo(470, 820, 520, 700, 600, 664);
  figure.lineTo(712, 690);
  figure.bezierCurveTo(772, 730, 782, 830, 770, 1000);
  figure.closePath();
  figure.moveTo(528, 730);
  figure.bezierCurveTo(500, 600, 572, 512, 652, 512);
  figure.bezierCurveTo(728, 522, 752, 620, 730, 730);
  figure.closePath();
  figure.moveTo(590, 556);
  figure.bezierCurveTo(560, 470, 610, 392, 680, 396);
  figure.bezierCurveTo(750, 402, 766, 470, 742, 532);
  figure.bezierCurveTo(700, 560, 640, 566, 590, 556);
  figure.closePath();

  const sleeve = new Path2D();

  sleeve.moveTo(676, 566);
  sleeve.bezierCurveTo(760, 560, 830, 610, 880, 664);
  sleeve.lineTo(852, 702);
  sleeve.bezierCurveTo(800, 668, 740, 650, 668, 652);
  sleeve.closePath();

  c.fillStyle = shade(robe, -0.22);
  c.fill(figure);
  c.fillStyle = robe;
  c.fill(sleeve);
  c.save();
  c.clip(figure);
  c.fillStyle = wash(c, 520, 0, 800, 0, [
    [0, "rgba(120,170,255,0)"],
    [1, "rgba(150,200,255,0.75)"],
  ]);
  c.fillRect(480, 380, 320, 640);
  c.restore();
  c.save();
  c.clip(sleeve);
  c.fillStyle = wash(c, 0, 560, 0, 700, [
    [0, "rgba(170,210,255,0.8)"],
    [1, "rgba(170,210,255,0)"],
  ]);
  c.fillRect(660, 550, 240, 160);
  c.restore();
  c.fillStyle = "#f2b93a";
  c.fillRect(540, 716, 190, 12);
  ellipse(c, 716, 482, 30, 42, "#1c2a55", 0.15);
  ellipse(c, 729, 494, 14, 22, "#f0bd8a", 0.2);
  ellipse(c, 742, 500, 6, 8, "#ffd0a0", 0.2);
  ellipse(c, 872, 682, 18, 12, "#f0bd8a", 0.5);

  // An orange cat on the sill.
  ellipse(c, 1232, 622, 46, 34, "#f08a2c");
  ellipse(c, 1268, 584, 25, 23, "#f08a2c");
  poly(
    c,
    [
      [1250, 572],
      [1256, 544],
      [1269, 568],
    ],
    "#f08a2c",
  );
  poly(
    c,
    [
      [1270, 568],
      [1284, 544],
      [1290, 574],
    ],
    "#f08a2c",
  );
  ellipse(c, 1262, 606, 14, 20, "#fff1d8");
  ellipse(c, 1220, 612, 8, 22, "#c9601c", 0.4);
  ellipse(c, 1240, 606, 7, 20, "#c9601c", 0.3);

  blob(c, 960, 520, 1500, "rgba(255,240,200,0.1)", "lighter");

  const dark = c.createRadialGradient(960, 540, 520, 960, 540, 1250);

  dark.addColorStop(0, "rgba(0,0,0,0)");
  dark.addColorStop(1, "rgba(60,30,10,0.4)");
  c.fillStyle = dark;
  c.fillRect(0, 0, W, H);
}

/** A leaf of bright vellum, plain, for the loose sheets. */
function vellum(c: Ctx, rand: Rng) {
  c.fillStyle = "#fbefcc";
  c.fillRect(0, 0, W, H);

  const tones = ["255,248,224", "246,228,184", "240,218,170", "252,240,206"];

  for (let i = 0; i < 260; i++) {
    blob(
      c,
      rand() * W,
      rand() * H,
      60 + rand() * 280,
      `rgba(${tones[Math.floor(rand() * tones.length)]},${0.12 + rand() * 0.14})`,
    );
  }

  for (let i = 0; i < 420; i++) {
    const x = rand() * W;
    const y = rand() * H;

    c.strokeStyle = `rgba(190,150,90,${0.05 + rand() * 0.08})`;
    c.lineWidth = 1 + rand() * 1.4;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 20 + rand() * 80, y + (rand() - 0.5) * 20);
    c.stroke();
  }

  for (const [x0, y0, x1, y1] of [
    [0, 0, 220, 0],
    [W, 0, W - 220, 0],
    [0, 0, 0, 200],
    [0, H, 0, H - 200],
  ]) {
    c.fillStyle = wash(c, x0, y0, x1, y1, [
      [0, "rgba(206,160,90,0.5)"],
      [1, "rgba(206,160,90,0)"],
    ]);
    c.fillRect(0, 0, W, H);
  }
}

/** A whole page with a painted border of vines, flowers and gold. */
function page(c: Ctx, rand: Rng) {
  vellum(c, rand);

  const frame = (inset: number, colour: string, wide: number) => {
    c.strokeStyle = colour;
    c.lineWidth = wide;
    c.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  };

  c.fillStyle = "#234f9e";
  c.fillRect(34, 34, W - 68, 78);
  c.fillRect(34, H - 112, W - 68, 78);
  c.fillRect(34, 34, 78, H - 68);
  c.fillRect(W - 112, 34, 78, H - 68);
  frame(34, "#e8b33a", 12);
  frame(112, "#e8b33a", 8);

  // The vine, with its leaves and flowers, all the way round.
  const blooms = ["#e2452f", "#ffd24a", "#ffffff", "#ff8ab8", "#7fd0ff"];
  const along = (side: number, t: number): [number, number] =>
    side === 0
      ? [112 + t * (W - 224), 73]
      : side === 1
        ? [W - 73, 112 + t * (H - 224)]
        : side === 2
          ? [W - 112 - t * (W - 224), H - 73]
          : [73, H - 112 - t * (H - 224)];

  for (let side = 0; side < 4; side++) {
    const steps = side % 2 ? 22 : 40;

    c.strokeStyle = "#49b85e";
    c.lineWidth = 7;
    c.beginPath();

    for (let i = 0; i <= steps; i++) {
      const [x, y] = along(side, i / steps);
      const sway = Math.sin(i * 1.3) * 18;

      if (i === 0) c.moveTo(x, y);
      else c.lineTo(side % 2 ? x + sway : x, side % 2 ? y : y + sway);
    }

    c.stroke();

    for (let i = 0; i < steps; i++) {
      const [x, y] = along(side, (i + 0.5) / steps);
      const sway = Math.sin((i + 0.5) * 1.3) * 18;
      const px = side % 2 ? x + sway : x;
      const py = side % 2 ? y : y + sway;

      ellipse(
        c,
        px + (rand() - 0.5) * 20,
        py + (rand() - 0.5) * 20,
        15,
        7,
        i % 2 ? "#63d06e" : "#2f9a4a",
        rand() * 3,
      );

      if (i % 3 === 0) {
        const bloom = blooms[Math.floor(rand() * blooms.length)];

        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2;

          ellipse(c, px + Math.cos(a) * 11, py + Math.sin(a) * 11, 8, 8, bloom);
        }

        ellipse(c, px, py, 6, 6, "#ffd24a");
      }
    }
  }

  for (const [x, y] of [
    [73, 73],
    [W - 73, 73],
    [73, H - 73],
    [W - 73, H - 73],
  ]) {
    ellipse(c, x, y, 50, 50, "#e8b33a");
    ellipse(c, x, y, 38, 38, "#c8362a");
    ellipse(c, x, y, 16, 16, "#ffe9a0");
  }

  blob(c, 1500, 220, 1200, "rgba(255,244,200,0.3)", "lighter");
}

/** The top of the desk by day, with coloured light lying across it. */
function table(c: Ctx, rand: Rng) {
  const glass = [
    "47,111,214",
    "222,70,48",
    "242,185,58",
    "57,169,92",
    "139,79,196",
    "53,184,201",
  ];

  c.fillStyle = "#d39a56";
  c.fillRect(0, 0, W, H);

  for (let board = 0; board < 6; board++) {
    const y = board * 184 - 12;

    c.fillStyle = shade("#d8a05c", (rand() - 0.5) * 0.16);
    c.fillRect(0, y, W, 180);
    c.fillStyle = "#8a5a2c";
    c.fillRect(0, y + 180, W, 5);

    for (let i = 0; i < 22; i++) {
      const gy = y + 8 + rand() * 164;

      c.strokeStyle = `rgba(${rand() < 0.5 ? "140,90,44" : "250,214,150"},${0.16 + rand() * 0.2})`;
      c.lineWidth = 1.5 + rand() * 3;
      c.beginPath();
      c.moveTo(-20, gy);
      c.bezierCurveTo(
        500,
        gy + (rand() - 0.5) * 26,
        1300,
        gy + (rand() - 0.5) * 26,
        1960,
        gy + (rand() - 0.5) * 16,
      );
      c.stroke();
    }
  }

  // Light through the coloured glass.
  c.globalCompositeOperation = "source-over";

  for (let i = 0; i < 46; i++) {
    const x = rand() * 1100 - 80;
    const y = rand() * 620 - 60;
    const s = 70 + rand() * 90;

    poly(
      c,
      [
        [x, y],
        [x + s, y - s * 0.35],
        [x + s * 1.5, y + s * 0.2],
        [x + s * 0.5, y + s * 0.55],
      ],
      `rgba(${glass[i % glass.length]},0.36)`,
    );
  }

  blob(c, 1700, 140, 1200, "rgba(255,236,170,0.2)", "lighter");
  c.globalCompositeOperation = "source-over";

  // Things left at the edges.
  ellipse(c, 150, 150, 76, 76, "#1f3f8a");
  ellipse(c, 150, 150, 52, 52, "#0f2052");
  ellipse(c, 132, 132, 16, 10, "#7fa8ff", 0.6);
  ellipse(c, 300, 108, 50, 50, "#b8322c");
  ellipse(c, 300, 108, 34, 34, "#7a1810");
  poly(
    c,
    [
      [1640, 970],
      [1900, 930],
      [1906, 968],
      [1648, 1008],
    ],
    "#c8362a",
  );
  poly(
    c,
    [
      [1560, 1010],
      [1860, 1040],
      [1856, 1068],
      [1556, 1040],
    ],
    "#39a95c",
  );
  ellipse(c, 1800, 130, 70, 70, "#e8b33a");
  ellipse(c, 1800, 130, 48, 48, "#fff0b8");

  for (let i = 0; i < 26; i++) {
    ellipse(
      c,
      1500 + rand() * 400,
      200 + rand() * 200 - 180 + (i % 2) * 20,
      12,
      7,
      ["#de4630", "#ffd24a", "#ff8ab8", "#8b4fc4"][i % 4],
      rand() * 3,
    );
  }

  const dark = c.createRadialGradient(960, 520, 520, 960, 520, 1300);

  dark.addColorStop(0, "rgba(0,0,0,0)");
  dark.addColorStop(1, "rgba(70,30,6,0.42)");
  c.fillStyle = dark;
  c.fillRect(0, 0, W, H);
}

/** Open sky, the sun high in it, and cloud around the edges. */
function sky(c: Ctx, rand: Rng) {
  c.fillStyle = wash(c, 0, 0, 0, H, [
    [0, "#1f6fd6"],
    [0.55, "#56b0f2"],
    [1, "#bfe9fb"],
  ]);
  c.fillRect(0, 0, W, H);
  blob(c, 960, 60, 760, "rgba(255,250,214,0.9)", "lighter");
  c.globalCompositeOperation = "lighter";

  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI + 0.05;
    const wide = 0.035 + (i % 3) * 0.014;

    poly(
      c,
      [
        [960, 40],
        [960 + Math.cos(a - wide) * 1700, 40 + Math.sin(a - wide) * 1700],
        [960 + Math.cos(a + wide) * 1700, 40 + Math.sin(a + wide) * 1700],
      ],
      "rgba(255,246,200,0.11)",
    );
  }

  c.globalCompositeOperation = "source-over";
  ellipse(c, 960, 40, 86, 86, "#fffbe2");

  const tones: [string, string, string] = ["#ffffff", "#eef5ff", "#a9c9ee"];

  cloud(c, 240, 880, 3.0, tones, rand);
  cloud(c, 1640, 930, 3.2, tones, rand);
  cloud(c, 960, 1040, 2.6, tones, rand);
  cloud(c, 150, 330, 1.5, tones, rand);
  cloud(c, 1780, 300, 1.7, tones, rand);
}

const vivid = (sizes: number[], flow: Brush["flow"]): Brush => ({
  sizes,
  jitter: 0.1,
  alpha: 0.93,
  grain: 8,
  flow,
  care: 22,
});

const rolling = (x: number, y: number) =>
  Math.sin(x * 0.004) * 0.5 + Math.cos(y * 0.005) * 0.4;

export const WORLD = {
  hillDay: {
    draw: (c: Ctx, rand: Rng) => hill(c, false, rand),
    brush: vivid([58, 28, 13, 6, 3], rolling),
  },
  hillDusk: {
    draw: (c: Ctx, rand: Rng) => hill(c, true, rand),
    brush: vivid([58, 28, 13, 6, 3], rolling),
  },
  hall: {
    draw: (c: Ctx, rand: Rng) => hall(c, rand),
    brush: vivid(
      [58, 28, 13, 6, 3],
      (x, y) => Math.sin(x * 0.004) * 0.7 + Math.cos(y * 0.006) * 0.6 + 0.3,
    ),
  },
  vellum: {
    draw: (c: Ctx, rand: Rng) => vellum(c, rand),
    brush: {
      ...vivid([52, 24, 11], (x, y) => Math.sin(y * 0.01 + x * 0.002) * 0.25),
      care: 14,
      jitter: 0.04,
    },
  },
  page: {
    draw: (c: Ctx, rand: Rng) => page(c, rand),
    brush: {
      ...vivid(
        [46, 22, 10, 5, 3],
        (x, y) => Math.sin(y * 0.01 + x * 0.002) * 0.25,
      ),
      care: 16,
      jitter: 0.05,
    },
  },
  table: {
    draw: (c: Ctx, rand: Rng) => table(c, rand),
    brush: vivid(
      [58, 26, 12, 6],
      (x, y) => Math.sin(y * 0.02 + x * 0.001) * 0.12,
    ),
  },
  sky: {
    draw: (c: Ctx, rand: Rng) => sky(c, rand),
    brush: vivid(
      [80, 38, 16, 7],
      (x, y) => Math.atan2(y - 40, x - 960) + Math.PI / 2,
    ),
  },
};
