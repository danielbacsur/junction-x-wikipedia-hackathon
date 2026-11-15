import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

import { H, NAMES, TAKES, W, paintPlate } from "./scenery";

/**
 * Paints the still backgrounds of the film, one take of one plate a frame.
 * Rendered once to public/film/plates, then used as pictures.
 */
export function PlateSheet() {
  const frame = useCurrentFrame();
  const canvas = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    if (!canvas.current) return;

    paintPlate(canvas.current, NAMES[Math.floor(frame / TAKES)], frame % TAKES);
  }, [frame]);

  return (
    <AbsoluteFill>
      <canvas ref={canvas} width={W} height={H} />
    </AbsoluteFill>
  );
}
