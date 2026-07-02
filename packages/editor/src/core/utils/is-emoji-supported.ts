const cache = new Map<string, boolean>();

const isSupported = (() => {
  let ctx: CanvasRenderingContext2D | null = null;

  try {
    ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  } catch {
    // Not in browser env
  }

  if (!ctx) {
    return () => false;
  }

  const CANVAS_HEIGHT = 25;
  const CANVAS_WIDTH = 20;
  const textSize = Math.floor(CANVAS_HEIGHT / 2);

  ctx.font = `${textSize}px Arial, Sans-Serif`;
  ctx.textBaseline = "top";
  ctx.canvas.width = CANVAS_WIDTH * 2;
  ctx.canvas.height = CANVAS_HEIGHT;

  return (unicode: string) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH * 2, CANVAS_HEIGHT);

    ctx.fillStyle = "#FF0000";
    ctx.fillText(unicode, 0, 22);

    ctx.fillStyle = "#0000FF";
    ctx.fillText(unicode, CANVAS_WIDTH, 22);

    const a = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;
    const count = a.length;
    let i = 0;

    for (; i < count && !a[i + 3]; i += 4) {
      // search first visible pixel
    }

    if (i >= count) {
      return false;
    }

    const x = CANVAS_WIDTH + ((i / 4) % CANVAS_WIDTH);
    const y = Math.floor(i / 4 / CANVAS_WIDTH);
    const b = ctx.getImageData(x, y, 1, 1).data;

    if (a[i] !== b[0] || a[i + 2] !== b[2]) {
      return false;
    }

    if (ctx.measureText(unicode).width >= CANVAS_WIDTH) {
      return false;
    }

    return true;
  };
})();

export function isEmojiSupported(unicode: string): boolean {
  if (cache.has(unicode)) {
    return cache.get(unicode) ?? false;
  }

  const supported = isSupported(unicode);
  cache.set(unicode, supported);
  return supported;
}
