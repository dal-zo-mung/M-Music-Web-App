export interface LyricsScrollSurface {
  scrollTop: number;
  readonly scrollHeight: number;
  readonly clientHeight: number;
}

export interface AnimationClock {
  request: (callback: (timestamp: number) => void) => number;
  cancel: (id: number) => void;
}

export function startLyricsAutoScroll(
  surface: LyricsScrollSurface,
  speed: number,
  onEnd: () => void,
  clock: AnimationClock = {
    request: (callback) => window.requestAnimationFrame(callback),
    cancel: (id) => window.cancelAnimationFrame(id),
  },
): () => void {
  const pixelsPerSecond = Math.max(1, Math.min(40, speed));
  let position = surface.scrollTop;
  let lastWrittenPosition = position;
  let previousTime: number | undefined;
  let frame: number;
  let stopped = false;

  function tick(timestamp: number): void {
    if (stopped) return;
    const maximum = Math.max(0, surface.scrollHeight - surface.clientHeight);
    // Preserve fractional movement even when a browser rounds scrollTop.
    // Resync only when the reader moves the scrollbar independently.
    if (Math.abs(surface.scrollTop - lastWrittenPosition) > 1) {
      position = surface.scrollTop;
    }
    const elapsed =
      previousTime === undefined
        ? 0
        : Math.min(64, Math.max(0, timestamp - previousTime));
    previousTime = timestamp;
    position = Math.min(maximum, position + (pixelsPerSecond * elapsed) / 1000);
    surface.scrollTop = position;
    lastWrittenPosition = surface.scrollTop;
    if (position >= maximum) {
      stopped = true;
      onEnd();
      return;
    }
    frame = clock.request(tick);
  }

  frame = clock.request(tick);
  return () => {
    stopped = true;
    clock.cancel(frame);
  };
}
