import type { Brush, Rng } from "./paint";
import { WORLD } from "../calm/world";
import { painterly, seeded, shade } from "./paint";

export const W = 1920;
export const H = 1080;

type Ctx = CanvasRenderingContext2D;

const poly = (c: Ctx, points: [number, number][], fill: string) => {
  c.fillStyle = fill;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
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

/** The arched window of the scriptorium. */
const arch = (c: Ctx) => {
  c.beginPath();
  c.moveTo(1190, 640);
  c.lineTo(1190, 345);
  c.arc(1380, 345, 190, Math.PI, 0);
  c.lineTo(1570, 640);
  c.closePath();
};

const cloud = (c: Ctx, x: number, y: number, scale: number, rand: Rng) => {
  for (let i = 0; i < 9; i++) {
    const cx = x + (i - 4) * 34 * scale + (rand() - 0.5) * 20;
    const cy =
      y - Math.sin((i / 8) * Math.PI) * 30 * scale + (rand() - 0.5) * 10;
    const r = (26 + rand() * 22) * scale;

    ellipse(c, cx, cy + r * 0.35, r * 1.1, r * 0.75, "#b88aa6");
    ellipse(c, cx, cy, r, r * 0.8, "#ffd9b8");
    ellipse(c, cx - r * 0.15, cy - r * 0.25, r * 0.7, r * 0.5, "#fff1dc");
  }
};

/** The scriptorium, at night with the scribe at work, or empty at dawn. */
function room(c: Ctx, dawn: boolean, rand: Rng) {
  const stone = dawn ? "#5a4636" : "#2b221b";
  const wall = c.createLinearGradient(0, 0, 0, H);

  wall.addColorStop(0, shade(stone, 0.05));
  wall.addColorStop(1, shade(stone, -0.4));
  c.fillStyle = wall;
  c.fillRect(0, 0, W, H);

  const stones = seeded(3);
  const shelves = seeded(5);

  // Courses of stone.
  for (let row = 0; row < 10; row++) {
    const offset = row % 2 ? 95 : 0;

    for (let x = -offset; x < W; x += 190) {
      c.fillStyle = shade(stone, (stones() - 0.55) * 0.22 - row * 0.02);
      c.fillRect(x + 4, row * 96 + 4, 182, 88);
    }
  }

  // The night, or the morning, through the window.
  c.save();
  arch(c);
  c.clip();

  const sky = c.createLinearGradient(0, 150, 0, 640);

  if (dawn) {
    sky.addColorStop(0, "#5f7abb");
    sky.addColorStop(0.55, "#f2a47c");
    sky.addColorStop(1, "#ffd183");
  } else {
    sky.addColorStop(0, "#0b1533");
    sky.addColorStop(1, "#2c4a80");
  }

  c.fillStyle = sky;
  c.fillRect(1180, 140, 400, 510);

  if (dawn) {
    blob(c, 1380, 560, 230, "rgba(255,236,170,0.7)", "lighter");
    ellipse(c, 1380, 556, 44, 44, "#fff3c2");
    cloud(c, 1290, 330, 1.25, rand);
    cloud(c, 1480, 430, 0.9, rand);
    cloud(c, 1260, 500, 0.7, rand);
    poly(
      c,
      [
        [1180, 600],
        [1260, 560],
        [1340, 592],
        [1430, 566],
        [1520, 596],
        [1580, 580],
        [1580, 650],
        [1180, 650],
      ],
      "#4a5878",
    );
  } else {
    blob(c, 1470, 290, 170, "rgba(240,236,214,0.42)", "lighter");
    ellipse(c, 1470, 290, 46, 46, "#f6efd6");
    ellipse(c, 1486, 280, 40, 40, "#e3dcc0");

    for (let i = 0; i < 46; i++) {
      const size = rand() < 0.2 ? 3.4 : 1.8;

      ellipse(
        c,
        1195 + rand() * 370,
        160 + rand() * 400,
        size,
        size,
        "#eef0ff",
      );
    }

    poly(
      c,
      [
        [1180, 590],
        [1250, 548],
        [1330, 584],
        [1420, 552],
        [1510, 590],
        [1580, 566],
        [1580, 650],
        [1180, 650],
      ],
      "#0a1128",
    );
  }

  c.restore();

  // The stone around the window, the bars, the sill.
  const frame = dawn ? "#3d2d20" : "#17110d";

  c.lineWidth = 30;
  c.strokeStyle = frame;
  arch(c);
  c.stroke();
  c.lineWidth = 7;
  c.strokeStyle = dawn ? "#ffd9a0" : "#5d6f9c";
  c.beginPath();
  c.moveTo(1204, 640);
  c.lineTo(1204, 345);
  c.arc(1380, 345, 176, Math.PI, Math.PI * 1.55);
  c.stroke();
  c.fillStyle = frame;
  c.fillRect(1371, 158, 18, 482);
  c.fillRect(1190, 436, 380, 16);
  poly(
    c,
    [
      [1150, 640],
      [1610, 640],
      [1630, 672],
      [1130, 672],
    ],
    dawn ? "#8a6a4c" : "#3a2f28",
  );

  // A cat on the sill.
  const fur = dawn ? "#3a2a22" : "#0c0a0a";

  ellipse(c, 1262, 610, 44, 34, fur);
  ellipse(c, 1296, 572, 24, 22, fur);
  poly(
    c,
    [
      [1278, 560],
      [1284, 532],
      [1297, 556],
    ],
    fur,
  );
  poly(
    c,
    [
      [1298, 556],
      [1312, 532],
      [1318, 562],
    ],
    fur,
  );

  // The floor, and the light that falls across it.
  const floor = dawn ? "#34261c" : "#120d0a";

  c.fillStyle = floor;
  c.fillRect(0, 862, W, 218);
  c.strokeStyle = shade(floor, -0.35);
  c.lineWidth = 4;

  for (const y of [900, 958, 1028]) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(W, y);
    c.stroke();
  }

  for (let x = -200; x < W + 400; x += 260) {
    c.beginPath();
    c.moveTo(x, 862);
    c.lineTo(x - 180, 1080);
    c.stroke();
  }

  c.globalCompositeOperation = "lighter";
  poly(
    c,
    dawn
      ? [
          [1190, 180],
          [1570, 180],
          [1500, 1080],
          [380, 1080],
        ]
      : [
          [1190, 420],
          [1570, 420],
          [1420, 1080],
          [700, 1080],
        ],
    dawn ? "rgba(255,190,120,0.13)" : "rgba(110,140,210,0.11)",
  );
  c.globalCompositeOperation = "source-over";

  // Shelves of books along the left wall.
  const wood = dawn ? "#4a321f" : "#2a1b10";

  c.fillStyle = shade(wood, -0.35);
  c.fillRect(70, 150, 470, 660);

  const spines = [
    "#6b2c1e",
    "#3f4d30",
    "#2f3f5a",
    "#7a5420",
    "#4c2336",
    "#5d4a2a",
    "#2d4a48",
  ];

  for (let shelf = 0; shelf < 4; shelf++) {
    const base = 150 + (shelf + 1) * 160;
    let x = 92;

    while (x < 505) {
      const wide = 18 + shelves() * 28;
      const tall = 82 + shelves() * 46;
      const colour = shade(
        spines[Math.floor(shelves() * spines.length)],
        dawn ? 0.12 : -0.2,
      );

      if (shelves() < 0.07) {
        ellipse(
          c,
          x + 26,
          base - 16,
          30,
          14,
          shade("#e6d5a8", dawn ? 0 : -0.35),
        );
        x += 64;
        continue;
      }

      c.fillStyle = colour;
      c.fillRect(x, base - tall, wide, tall);
      c.fillStyle = shade(colour, 0.25);
      c.fillRect(x + 2, base - tall + tall * 0.18, wide - 4, 4);
      c.fillRect(x + 2, base - tall * 0.22, wide - 4, 4);
      x += wide + 3;
    }

    c.fillStyle = shade(wood, 0.12);
    c.fillRect(70, base, 470, 14);
  }

  c.fillStyle = shade(wood, 0.05);
  c.fillRect(56, 136, 16, 688);
  c.fillRect(538, 136, 16, 688);
  c.fillRect(56, 136, 498, 16);

  // The writing desk.
  poly(
    c,
    [
      [690, 650],
      [720, 752],
      [720, 1040],
      [690, 940],
    ],
    shade(wood, -0.5),
  );
  poly(
    c,
    [
      [720, 752],
      [1200, 700],
      [1200, 1004],
      [720, 1040],
    ],
    shade(wood, -0.25),
  );
  poly(
    c,
    [
      [690, 650],
      [1140, 612],
      [1200, 700],
      [720, 752],
    ],
    dawn ? "#9a6a3c" : "#7c5029",
  );
  poly(
    c,
    [
      [690, 650],
      [1140, 612],
      [1146, 622],
      [694, 661],
    ],
    dawn ? "#c08a52" : "#a06a38",
  );

  // The sheet being written, and what has piled up by morning.
  const sheet = dawn ? "#f6ebcc" : "#efdfb4";

  if (dawn) {
    for (let i = 0; i < 16; i++) {
      poly(
        c,
        [
          [800, 668 - i * 6],
          [1030, 648 - i * 6],
          [1072, 712 - i * 6],
          [826, 736 - i * 6],
        ],
        i % 2 ? shade(sheet, -0.12) : sheet,
      );
    }
  } else {
    poly(
      c,
      [
        [800, 652],
        [1020, 634],
        [1060, 702],
        [826, 724],
      ],
      sheet,
    );
    c.strokeStyle = "rgba(60,36,18,0.55)";
    c.lineWidth = 3;

    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo(826 + i * 5, 664 + i * 11);
      c.lineTo(1000 + i * 7 - (i === 4 ? 70 : 0), 650 + i * 11);
      c.stroke();
    }
  }

  // Ink, and the candle.
  ellipse(c, 1088, 648, 22, 15, "#0f0b08");
  ellipse(c, 1088, 640, 15, 6, "#3a2c20");
  ellipse(c, 1150, 646, 36, 11, dawn ? "#a8853c" : "#8a6a2a");

  const tall = dawn ? 34 : 104;

  c.fillStyle = "#efe2bd";
  c.fillRect(1138, 642 - tall, 24, tall);
  c.fillStyle = "#cdb98a";
  c.fillRect(1154, 642 - tall, 8, tall);

  // A stool, and the scribe on it while it is still night.
  c.fillStyle = shade(wood, -0.3);
  c.fillRect(548, 900, 16, 120);
  c.fillRect(662, 900, 16, 120);
  c.fillRect(536, 884, 156, 22);

  if (!dawn) {
    const robe = "#46301f";

    // The whole figure as one shape, so the candle can light its near side.
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

    c.fillStyle = shade(robe, -0.25);
    c.fill(figure);
    c.fillStyle = robe;
    c.fill(sleeve);

    c.save();
    c.clip(figure);

    const lit = c.createLinearGradient(520, 0, 800, 0);

    lit.addColorStop(0, "rgba(214,138,72,0)");
    lit.addColorStop(0.55, "rgba(214,138,72,0.16)");
    lit.addColorStop(1, "rgba(236,160,88,0.7)");
    c.fillStyle = lit;
    c.fillRect(480, 380, 320, 640);
    c.restore();

    c.save();
    c.clip(sleeve);

    const top = c.createLinearGradient(0, 560, 0, 700);

    top.addColorStop(0, "rgba(240,166,92,0.75)");
    top.addColorStop(1, "rgba(240,166,92,0)");
    c.fillStyle = top;
    c.fillRect(660, 550, 240, 160);
    c.restore();

    // The face inside the hood, turned to the page.
    ellipse(c, 716, 482, 30, 42, "#1c130d", 0.15);
    ellipse(c, 729, 494, 14, 22, "#d39a66", 0.2);
    ellipse(c, 742, 500, 6, 8, "#e2ad78", 0.2);
    ellipse(c, 872, 682, 18, 12, "#dba876", 0.5);

    // What the flame lights.
    blob(c, 1150, 520, 250, "rgba(255,176,86,0.62)", "lighter");
    blob(c, 1150, 520, 640, "rgba(255,140,52,0.3)", "lighter");
  } else {
    blob(c, 1380, 600, 900, "rgba(255,200,130,0.22)", "lighter");
  }

  // Darker towards the corners.
  const dark = c.createRadialGradient(960, 560, 380, 960, 560, 1150);

  dark.addColorStop(0, "rgba(0,0,0,0)");
  dark.addColorStop(1, dawn ? "rgba(20,10,4,0.5)" : "rgba(0,0,0,0.72)");
  c.fillStyle = dark;
  c.fillRect(0, 0, W, H);
}

/** A sheet of parchment filling the frame, lit from the upper right. */
function parchment(c: Ctx, rand: Rng) {
  c.fillStyle = "#e6d3a3";
  c.fillRect(0, 0, W, H);

  const tones = [
    "241,227,189",
    "220,199,145",
    "210,185,127",
    "236,220,176",
    "201,173,112",
  ];

  for (let i = 0; i < 300; i++) {
    blob(
      c,
      rand() * W,
      rand() * H,
      60 + rand() * 300,
      `rgba(${tones[Math.floor(rand() * tones.length)]},${0.1 + rand() * 0.14})`,
    );
  }

  // Fibres, and old stains.
  for (let i = 0; i < 700; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const long = 20 + rand() * 90;
    const turn = (rand() - 0.5) * 0.9;

    c.strokeStyle = `rgba(130,92,44,${0.05 + rand() * 0.1})`;
    c.lineWidth = 1 + rand() * 1.6;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(
      x + (Math.cos(turn) * long) / 2,
      y + (Math.sin(turn) * long) / 2 + (rand() - 0.5) * 14,
      x + Math.cos(turn) * long,
      y + Math.sin(turn) * long,
    );
    c.stroke();
  }

  for (let i = 0; i < 6; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 40 + rand() * 120;

    blob(c, x, y, r, "rgba(140,96,44,0.12)");
    c.strokeStyle = "rgba(120,80,34,0.14)";
    c.lineWidth = 4 + rand() * 8;
    c.beginPath();
    c.ellipse(x, y, r * 0.8, r * 0.66, rand() * 3, 0, Math.PI * 2);
    c.stroke();
  }

  // Worn, browned edges.
  for (const [x0, y0, x1, y1] of [
    [0, 0, 300, 0],
    [W, 0, W - 300, 0],
    [0, 0, 0, 260],
    [0, H, 0, H - 260],
  ]) {
    const g = c.createLinearGradient(x0, y0, x1, y1);

    g.addColorStop(0, "rgba(104,66,26,0.62)");
    g.addColorStop(1, "rgba(104,66,26,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }

  blob(c, 1560, 160, 1400, "rgba(255,220,160,0.3)", "lighter");
  blob(c, 160, 1000, 1100, "rgba(50,24,6,0.36)");
}

/** The light a page is held up against. */
function glow(c: Ctx) {
  const g = c.createRadialGradient(960, 520, 0, 960, 520, 1180);

  g.addColorStop(0, "#fff8dc");
  g.addColorStop(0.16, "#ffe6a6");
  g.addColorStop(0.36, "#f3ad58");
  g.addColorStop(0.62, "#8a4a1c");
  g.addColorStop(1, "#190f09");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);

  c.globalCompositeOperation = "lighter";

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.2;
    const wide = 0.05 + (i % 3) * 0.02;

    poly(
      c,
      [
        [960, 520],
        [960 + Math.cos(a - wide) * 1500, 520 + Math.sin(a - wide) * 1500],
        [960 + Math.cos(a + wide) * 1500, 520 + Math.sin(a + wide) * 1500],
      ],
      "rgba(255,236,190,0.07)",
    );
  }

  c.globalCompositeOperation = "source-over";
}

/** The top of the desk seen from above, lit by a candle off to one side. */
function desk(c: Ctx, rand: Rng) {
  c.fillStyle = "#3a2414";
  c.fillRect(0, 0, W, H);

  // Boards, each with its own tone and grain.
  for (let board = 0; board < 6; board++) {
    const y = board * 184 - 12;

    c.fillStyle = shade("#4a2e18", (rand() - 0.5) * 0.22);
    c.fillRect(0, y, W, 180);
    c.fillStyle = "#1c110a";
    c.fillRect(0, y + 180, W, 5);

    for (let i = 0; i < 26; i++) {
      const gy = y + 8 + rand() * 164;

      c.strokeStyle = `rgba(${rand() < 0.5 ? "24,13,6" : "110,70,36"},${0.16 + rand() * 0.22})`;
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

    for (let i = 0; i < 2; i++) {
      ellipse(
        c,
        rand() * W,
        y + 30 + rand() * 120,
        30 + rand() * 40,
        9 + rand() * 9,
        "rgba(26,14,7,0.5)",
        (rand() - 0.5) * 0.3,
      );
    }
  }

  // Things left at the edge of the desk.
  ellipse(c, 150, 150, 74, 74, "#120c08");
  ellipse(c, 150, 150, 50, 50, "#05070c");
  ellipse(c, 132, 132, 16, 10, "#3d4c66", 0.6);
  poly(
    c,
    [
      [1700, 960],
      [1900, 930],
      [1905, 962],
      [1706, 992],
    ],
    "#8f2a18",
  );
  ellipse(c, 1790, 120, 62, 62, "#9c7a30");
  ellipse(c, 1790, 120, 40, 40, "#e9dcb4");

  blob(c, 1790, 110, 1100, "rgba(255,170,80,0.5)", "lighter");
  blob(c, 1790, 110, 380, "rgba(255,214,140,0.5)", "lighter");

  const dark = c.createRadialGradient(1100, 480, 300, 1100, 480, 1400);

  dark.addColorStop(0, "rgba(0,0,0,0)");
  dark.addColorStop(1, "rgba(0,0,0,0.78)");
  c.fillStyle = dark;
  c.fillRect(0, 0, W, H);
}

export const PLATES = {
  roomNight: {
    draw: (c: Ctx, rand: Rng) => room(c, false, rand),
    brush: {
      sizes: [64, 30, 14, 7, 4],
      jitter: 0.09,
      alpha: 0.92,
      grain: 14,
      flow: (x: number, y: number) =>
        Math.sin(x * 0.004) * 0.7 + Math.cos(y * 0.006) * 0.6 + 0.3,
      care: 26,
    } satisfies Brush,
  },
  roomDawn: {
    draw: (c: Ctx, rand: Rng) => room(c, true, rand),
    brush: {
      sizes: [64, 30, 14, 7, 4],
      jitter: 0.08,
      alpha: 0.92,
      grain: 12,
      flow: (x: number, y: number) =>
        Math.sin(x * 0.004) * 0.7 + Math.cos(y * 0.006) * 0.6 + 0.3,
      care: 26,
    } satisfies Brush,
  },
  parchment: {
    draw: (c: Ctx, rand: Rng) => parchment(c, rand),
    brush: {
      sizes: [52, 24, 11],
      jitter: 0.05,
      alpha: 0.85,
      grain: 11,
      flow: (x: number, y: number) => Math.sin(y * 0.01 + x * 0.002) * 0.25,
      care: 16,
    } satisfies Brush,
  },
  glow: {
    draw: (c: Ctx) => glow(c),
    brush: {
      sizes: [84, 40, 18],
      jitter: 0.07,
      alpha: 0.9,
      grain: 10,
      flow: (x: number, y: number) =>
        Math.atan2(y - 520, x - 960) + Math.PI / 2,
      care: 18,
    } satisfies Brush,
  },
  desk: {
    draw: (c: Ctx, rand: Rng) => desk(c, rand),
    brush: {
      sizes: [58, 26, 12, 6],
      jitter: 0.08,
      alpha: 0.9,
      grain: 13,
      flow: (x: number, y: number) => Math.sin(y * 0.02 + x * 0.001) * 0.12,
      care: 22,
    } satisfies Brush,
  },
  ...WORLD,
};

export type PlateName = keyof typeof PLATES;
export const NAMES = Object.keys(PLATES) as PlateName[];

/** Each plate is painted twice, so the film can breathe between the two. */
export const TAKES = 2;

export function paintPlate(
  target: HTMLCanvasElement,
  name: PlateName,
  take: number,
) {
  const flat = document.createElement("canvas");

  flat.width = W;
  flat.height = H;

  // The drawing is the same in every take; only the brushwork differs.
  PLATES[name].draw(
    flat.getContext("2d", { willReadFrequently: true })!,
    seeded(11),
  );
  painterly(target, flat, take + 1, PLATES[name].brush);
}
