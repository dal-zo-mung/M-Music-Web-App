import { describe, expect, test } from "bun:test";
import {
  startLyricsAutoScroll,
  type AnimationClock,
} from "../client/src/lib/lyricsAutoScroll";

function createClock() {
  let pending: ((time: number) => void) | undefined;
  const clock: AnimationClock = {
    request: (callback) => {
      pending = callback;
      return 1;
    },
    cancel: () => {
      pending = undefined;
    },
  };
  return {
    clock,
    tick: (time: number) => {
      const callback = pending;
      pending = undefined;
      callback?.(time);
    },
    hasFrame: () => !!pending,
  };
}

describe("lyrics auto-scroll", () => {
  test("every speed moves continuously and consistently at 60 and 120 Hz", () => {
    for (let speed = 1; speed <= 40; speed += 1) {
      for (const refreshRate of [60, 120]) {
        const frames = createClock();
        const surface = {
          scrollTop: 0,
          scrollHeight: 10000,
          clientHeight: 500,
        };
        const stop = startLyricsAutoScroll(
          surface,
          speed,
          () => {},
          frames.clock,
        );
        frames.tick(0);
        for (let frame = 1; frame <= refreshRate; frame += 1) {
          const previous = surface.scrollTop;
          frames.tick((frame * 1000) / refreshRate);
          expect(surface.scrollTop).toBeGreaterThan(previous);
        }
        expect(surface.scrollTop).toBeCloseTo(speed, 5);
        stop();
        expect(frames.hasFrame()).toBe(false);
      }
    }
  });

  test("slowest speed accumulates movement on surfaces that round scroll offsets", () => {
    const frames = createClock();
    let offset = 0;
    const surface = {
      get scrollTop() {
        return offset;
      },
      set scrollTop(value: number) {
        offset = Math.round(value);
      },
      scrollHeight: 10000,
      clientHeight: 500,
    };
    const stop = startLyricsAutoScroll(surface, 1, () => {}, frames.clock);
    for (let frame = 0; frame <= 120; frame += 1)
      frames.tick((frame * 1000) / 60);
    expect(offset).toBe(2);
    stop();
  });

  test("stops at the end and limits jumps after a background tab resumes", () => {
    const frames = createClock();
    const surface = { scrollTop: 0, scrollHeight: 110, clientHeight: 100 };
    let ended = 0;
    startLyricsAutoScroll(
      surface,
      40,
      () => {
        ended += 1;
      },
      frames.clock,
    );
    frames.tick(0);
    frames.tick(10000);
    expect(surface.scrollTop).toBeCloseTo(2.56);
    for (let frame = 1; frame < 30; frame += 1) frames.tick(10000 + frame * 16);
    expect(surface.scrollTop).toBe(10);
    expect(ended).toBe(1);
    expect(frames.hasFrame()).toBe(false);
  });

  test("a speed change starts at the current position and manual scrolling resyncs", () => {
    const frames = createClock();
    const surface = { scrollTop: 50, scrollHeight: 10000, clientHeight: 500 };
    const stop = startLyricsAutoScroll(surface, 1, () => {}, frames.clock);
    frames.tick(0);
    frames.tick(50);
    stop();
    const stopFaster = startLyricsAutoScroll(
      surface,
      40,
      () => {},
      frames.clock,
    );
    frames.tick(100);
    frames.tick(150);
    expect(surface.scrollTop).toBeCloseTo(52.05);
    surface.scrollTop = 200;
    frames.tick(200);
    expect(surface.scrollTop).toBe(202);
    stopFaster();
  });
});
