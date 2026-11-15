import { Composition } from "remotion";

import { Calm } from "./calm/Calm";
import { FPS as CALM_FPS, TOTAL as CALM_TOTAL } from "./calm/clock";
import { FPS as FAST_FPS, TOTAL as FAST_TOTAL } from "./fast/clock";
import { Fast } from "./fast/Fast";
import { FPS as FILM_FPS, TOTAL as FILM_TOTAL } from "./film/clock";
import { Film } from "./film/Film";
import { PlateSheet } from "./film/PlateSheet";
import { NAMES, TAKES } from "./film/scenery";
import { Main } from "./Main";
import { FPS, HEIGHT, TOTAL, WIDTH } from "./timeline";

export function Root() {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={Math.round(TOTAL * FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="Calm"
        component={Calm}
        durationInFrames={Math.round(CALM_TOTAL * CALM_FPS)}
        fps={CALM_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Fast"
        component={Fast}
        durationInFrames={Math.round(FAST_TOTAL * FAST_FPS)}
        fps={FAST_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Film"
        component={Film}
        durationInFrames={Math.round(FILM_TOTAL * FILM_FPS)}
        fps={FILM_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Plates"
        component={PlateSheet}
        durationInFrames={NAMES.length * TAKES}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
}
