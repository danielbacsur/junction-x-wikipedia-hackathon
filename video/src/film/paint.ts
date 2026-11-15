/**
 * The painted look. A scene is first drawn flat, then repainted with
 * brush strokes that take their colour from the flat drawing and follow
 * its edges, large brushes first and small ones only where detail is
 * still missing.
 */

export type Rng = () => number;

export const seeded = (seed: number): Rng => {
  let state = (seed * 2654435761) >>> 0 || 1;

  return () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;

    return state / 4294967296;
  };
};

type Rgb = [number, number, number];

export const rgb = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

export const css = ([r, g, b]: Rgb, alpha = 1) =>
  `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`;

export const mix = (a: string, b: string, t: number): string => {
  const [x, y] = [rgb(a), rgb(b)];

  return css([
    x[0] + (y[0] - x[0]) * t,
    x[1] + (y[1] - x[1]) * t,
    x[2] + (y[2] - x[2]) * t,
  ]);
};

/** A colour made lighter (above 0) or darker (below 0). */
export const shade = (hex: string, by: number): string =>
  by >= 0 ? mix(hex, "#ffffff", by) : mix(hex, "#000000", -by);

export type Brush = {
  /** Brush widths in pixels, largest first. */
  sizes: number[];

  /** How far a stroke's colour may stray from the drawing, 0 to 1. */
  jitter: number;
  alpha: number;

  /** Strength of the canvas grain. */
  grain: number;

  /** Which way the brush moves where the drawing has no edge to follow. */
  flow: (x: number, y: number) => number;

  /** How different a spot must be before a smaller brush touches it. */
  care?: number;
};

export function painterly(
  target: HTMLCanvasElement,
  source: HTMLCanvasElement,
  seed: number,
  brush: Brush,
) {
  const W = target.width;
  const H = target.height;
  const ctx = target.getContext("2d", { willReadFrequently: true })!;
  const src = source
    .getContext("2d", { willReadFrequently: true })!
    .getImageData(0, 0, W, H).data;
  const rand = seeded(seed * 7919 + 17);

  // Brightness at a quarter of the size, to find which way edges run.
  const Q = 4;
  const w = Math.ceil(W / Q);
  const h = Math.ceil(H / Q);
  const lum = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (Math.min(H - 1, y * Q) * W + Math.min(W - 1, x * Q)) * 4;

      lum[y * w + x] = 0.3 * src[i] + 0.59 * src[i + 1] + 0.11 * src[i + 2];
    }
  }

  const edge = (x: number, y: number): [number, number] => {
    const qx = Math.min(w - 2, Math.max(1, Math.round(x / Q)));
    const qy = Math.min(h - 2, Math.max(1, Math.round(y / Q)));
    const at = (dx: number, dy: number) => lum[(qy + dy) * w + qx + dx];
    const gx =
      at(1, -1) +
      2 * at(1, 0) +
      at(1, 1) -
      at(-1, -1) -
      2 * at(-1, 0) -
      at(-1, 1);
    const gy =
      at(-1, 1) +
      2 * at(0, 1) +
      at(1, 1) -
      at(-1, -1) -
      2 * at(0, -1) -
      at(1, -1);

    return [gx, gy];
  };

  const sample = (x: number, y: number) => {
    const sx = Math.min(W - 1, Math.max(0, Math.round(x)));
    const sy = Math.min(H - 1, Math.max(0, Math.round(y)));

    return (sy * W + sx) * 4;
  };

  ctx.drawImage(source, 0, 0);
  ctx.lineCap = "round";

  brush.sizes.forEach((size, layer) => {
    const now = layer === 0 ? null : ctx.getImageData(0, 0, W, H).data;
    const step = size * 0.62;
    const spots: [number, number][] = [];

    for (let y = 0; y < H + step; y += step) {
      for (let x = 0; x < W + step; x += step) {
        spots.push([x + (rand() - 0.5) * step, y + (rand() - 0.5) * step]);
      }
    }

    for (let i = spots.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));

      [spots[i], spots[j]] = [spots[j], spots[i]];
    }

    const care =
      (brush.care ?? 30) * (layer === brush.sizes.length - 1 ? 0.7 : 1);

    for (const [x, y] of spots) {
      const i = sample(x, y);
      const r = src[i];
      const g = src[i + 1];
      const b = src[i + 2];

      if (now) {
        const off =
          Math.abs(r - now[i]) +
          Math.abs(g - now[i + 1]) +
          Math.abs(b - now[i + 2]);

        if (off < care) continue;
      }

      const [gx, gy] = edge(x, y);
      const strength = Math.hypot(gx, gy);
      const angle =
        (strength > 14 ? Math.atan2(gy, gx) + Math.PI / 2 : brush.flow(x, y)) +
        (rand() - 0.5) * 0.5;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      let reach = size * (1.3 + rand() * 2.1);

      // A stroke stops short where it would run into another colour.
      for (const way of [-1, 1]) {
        const e = sample(
          x + (way * cos * reach) / 2,
          y + (way * sin * reach) / 2,
        );
        const off =
          Math.abs(r - src[e]) +
          Math.abs(g - src[e + 1]) +
          Math.abs(b - src[e + 2]);

        if (off > 70) reach *= 0.55;
      }

      const tone = 1 + (rand() - 0.5) * brush.jitter * 2;
      const warm = (rand() - 0.5) * brush.jitter * 40;
      const dx = (cos * reach) / 2;
      const dy = (sin * reach) / 2;
      const bend = (rand() - 0.5) * size * 0.7;
      const width = size * (0.5 + rand() * 0.5);

      ctx.strokeStyle = css(
        [r * tone + warm, g * tone, b * tone - warm],
        brush.alpha,
      );
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x - dx, y - dy);
      ctx.quadraticCurveTo(x - sin * bend, y + cos * bend, x + dx, y + dy);
      ctx.stroke();

      // One lighter and one darker bristle line inside the stroke.
      for (const side of [-1, 1]) {
        const lift = side > 0 ? 1.1 : 0.9;
        const ox = -sin * width * 0.26 * side;
        const oy = cos * width * 0.26 * side;

        ctx.strokeStyle = css(
          [r * tone * lift + warm, g * tone * lift, b * tone * lift - warm],
          brush.alpha * 0.4,
        );
        ctx.lineWidth = Math.max(1, width * 0.16);
        ctx.beginPath();
        ctx.moveTo(x - dx * 0.8 + ox, y - dy * 0.8 + oy);
        ctx.quadraticCurveTo(
          x - sin * bend + ox,
          y + cos * bend + oy,
          x + dx * 0.8 + ox,
          y + dy * 0.8 + oy,
        );
        ctx.stroke();
      }
    }
  });

  // The tooth of the canvas.
  const out = ctx.getImageData(0, 0, W, H);
  const data = out.data;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const n =
        (rand() - 0.5) * brush.grain +
        Math.sin(x * 1.7) * Math.sin(y * 1.7) * brush.grain * 0.25;

      data[i] += n;
      data[i + 1] += n;
      data[i + 2] += n;
    }
  }

  ctx.putImageData(out, 0, 0);
}
