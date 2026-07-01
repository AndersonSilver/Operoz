/**
 * Jira-style smooth S-curve dependency connectors for Gantt charts.
 *
 * Uses a single cubic Bézier from source right-edge to target left-edge.
 * Control points are pulled horizontally — matching the natural "S" shape
 * visible in Jira's Timeline dependency lines.
 */

const MIN_PULL = 40; // minimum horizontal pull on control points
const PULL_RATIO = 0.5; // fraction of the horizontal gap used as pull

/**
 * Computes the horizontal control-point offset for the cubic Bézier.
 * When blocks are stacked (dx ≈ ox), we still apply a minimum pull so the
 * curve stays visible and doesn't collapse into a near-straight line.
 */
function controlPointPull(ox: number, dx: number): number {
  const gap = Math.abs(dx - ox);
  return Math.max(MIN_PULL, gap * PULL_RATIO);
}

/**
 * Forward S-curve: source right-edge → target left-edge (target to the right).
 *
 *  ╮╭──▶
 *  ╰╯
 */
function buildForwardSCurve(ox: number, oy: number, dx: number, dy: number): string {
  const pull = controlPointPull(ox, dx);
  return `M ${ox} ${oy} C ${ox + pull} ${oy}, ${dx - pull} ${dy}, ${dx} ${dy}`;
}

/**
 * Backward S-curve: target is left of (or very close to) source.
 * Routes right → below/above → left, producing a smooth U-shaped detour.
 *
 *   ──╮
 *     │
 *   ◀─╰
 */
function buildBackwardSCurve(ox: number, oy: number, dx: number, dy: number): string {
  const detour = Math.max(MIN_PULL, Math.abs(dy - oy) * 0.55);
  const midY = (oy + dy) / 2;

  // Two-segment cubic that bends out to the right then comes back left
  return [
    `M ${ox} ${oy}`,
    `C ${ox + detour} ${oy},`,
    `${ox + detour} ${midY},`,
    `${(ox + dx) / 2} ${midY}`,
    `C ${dx - detour} ${midY},`,
    `${dx - detour} ${dy},`,
    `${dx} ${dy}`,
  ].join(" ");
}

/**
 * Builds the primary finish-to-start dependency connector.
 * Exported as the canonical function for static dependency overlays.
 */
export function buildDependencyPath(ox: number, oy: number, dx: number, dy: number): string {
  if (Math.abs(dy - oy) < 1 && Math.abs(dx - ox) < 1) {
    return `M ${ox} ${oy} L ${dx} ${dy}`;
  }
  const isForward = dx >= ox - MIN_PULL * 0.5;
  return isForward ? buildForwardSCurve(ox, oy, dx, dy) : buildBackwardSCurve(ox, oy, dx, dy);
}

/**
 * Builds a connector from any drag side (used during drag preview).
 */
export function buildDependencyPathFromSide(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  side: "left" | "right"
): string {
  if (Math.abs(dy - oy) < 1 && Math.abs(dx - ox) < 1) {
    return `M ${ox} ${oy} L ${dx} ${dy}`;
  }
  if (side === "left") {
    return buildDependencyPath(dx, dy, ox, oy);
  }
  return buildDependencyPath(ox, oy, dx, dy);
}

// ─── Legacy aliases ──────────────────────────────────────────────────────────
export { buildDependencyPath as buildSmoothDependencyPath };
export { buildDependencyPathFromSide as buildSmoothDependencyPathFromSide };
