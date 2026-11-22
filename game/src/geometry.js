// The Meridian Heist — small geometry helpers for walls and sight lines.

export function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function circleHitsRect(cx, cy, radius, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  return dist(cx, cy, nx, ny) < radius;
}

// Sample the segment every ~6px; blocked if any sample lands inside a wall.
export function hasLineOfSight(x1, y1, x2, y2, walls) {
  const d = dist(x1, y1, x2, y2);
  const steps = Math.max(1, Math.ceil(d / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const sx = x1 + (x2 - x1) * t;
    const sy = y1 + (y2 - y1) * t;
    for (const w of walls) {
      if (pointInRect(sx, sy, w)) return false;
    }
  }
  return true;
}

// Push a circle out of every wall rect it overlaps, then clamp to the playfield.
export function moveCircleOutOfWalls(x, y, radius, walls, width, height) {
  for (const w of walls) {
    if (!circleHitsRect(x, y, radius, w)) continue;
    const nx = Math.max(w.x, Math.min(x, w.x + w.w));
    const ny = Math.max(w.y, Math.min(y, w.y + w.h));
    let dx = x - nx;
    let dy = y - ny;
    let d = Math.hypot(dx, dy);
    if (d === 0) {
      // Centre inside the rect: push out along the smallest penetration.
      const left = x - w.x;
      const right = w.x + w.w - x;
      const top = y - w.y;
      const bottom = w.y + w.h - y;
      const m = Math.min(left, right, top, bottom);
      if (m === left) x = w.x - radius;
      else if (m === right) x = w.x + w.w + radius;
      else if (m === top) y = w.y - radius;
      else y = w.y + w.h + radius;
      continue;
    }
    dx /= d;
    dy /= d;
    x = nx + dx * radius;
    y = ny + dy * radius;
  }
  x = Math.max(radius, Math.min(width - radius, x));
  y = Math.max(radius, Math.min(height - radius, y));
  return { x, y };
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
