// The Meridian Heist — all canvas drawing: floor, walls, loot, safes, exit,
// vision cones, smoke, the thief, and the red alarm vignette.

import { GAME_WIDTH, GAME_HEIGHT, PALETTE, GUARD_VISION_RANGE, CAMERA_RANGE, GUARD_HALF_ANGLE, CAMERA_HALF_ANGLE, SMOKE_RADIUS } from './config.js';
import { dist } from './geometry.js';

function drawCone(ctx, x, y, angle, halfAngle, range, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawLootShape(ctx, item, time) {
  const pulse = 1 + Math.sin(time * 3 + item.x) * 0.12;
  ctx.save();
  ctx.translate(item.x, item.y);
  // Pulsing glow ring so loot reads from across the room.
  ctx.beginPath();
  ctx.arc(0, 0, 24 * pulse, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(242, 193, 78, 0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (item.kind === 'painting') {
    ctx.fillStyle = PALETTE.lootPainting;
    ctx.fillRect(-16, -11, 32, 22);
    ctx.strokeStyle = PALETTE.lootGold;
    ctx.lineWidth = 3;
    ctx.strokeRect(-16, -11, 32, 22);
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f5e6c8';
    ctx.fill();
  } else if (item.kind === 'gold') {
    ctx.fillStyle = PALETTE.lootGold;
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(i * 11 - 5, 6 - Math.abs(i) * 2, 10, 7);
    }
    ctx.fillRect(-5, -2, 10, 7);
  } else if (item.kind === 'diamond') {
    ctx.fillStyle = PALETTE.lootGem;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(12, 0);
    ctx.lineTo(0, 14);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#dff4ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (item.kind === 'sapphire') {
    ctx.fillStyle = '#3f6fd1';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(11, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-11, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9db9f2';
    ctx.beginPath();
    ctx.arc(-3, -3, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.kind === 'chips') {
    const colors = ['#e5322d', '#f2c14e', '#37b268'];
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(-8 + i * 8, 4 - i * 5, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  } else {
    // vase
    ctx.fillStyle = PALETTE.lootVase;
    ctx.beginPath();
    ctx.ellipse(0, 2, 9, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-4, -14, 8, 6);
  }
  ctx.restore();
  // Value label, kept inside the canvas.
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  const label = '$' + item.value;
  const lx = Math.max(30, Math.min(GAME_WIDTH - 30, item.x));
  ctx.fillText(label, lx, Math.max(14, item.y - 26));
}

export function renderGame(ctx, g, time) {
  const level = g.level;
  const isBank = g.levelIndex === 1;
  const isCasino = g.levelIndex === 2;

  // Floor: checkerboard.
  const tile = 60;
  for (let ty = 0; ty < GAME_HEIGHT / tile; ty++) {
    for (let tx = 0; tx < GAME_WIDTH / tile; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(tx * tile, ty * tile, tile, tile);
    }
  }
  // Gallery / penthouse carpet runner; bank gold border.
  if (!isBank) {
    ctx.fillStyle = PALETTE.carpet;
    ctx.fillRect(0, GAME_HEIGHT / 2 - 30, GAME_WIDTH, 60);
    ctx.fillStyle = PALETTE.goldTrim;
    ctx.fillRect(0, GAME_HEIGHT / 2 - 33, GAME_WIDTH, 3);
    ctx.fillRect(0, GAME_HEIGHT / 2 + 30, GAME_WIDTH, 3);
  } else {
    ctx.strokeStyle = PALETTE.goldTrim;
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, GAME_WIDTH - 12, GAME_HEIGHT - 12);
  }

  // Exit door.
  const exit = level.exit;
  const exitOpen = g.lootValue >= level.target;
  ctx.fillStyle = exitOpen ? PALETTE.exit : PALETTE.exitLocked;
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = '#0d1322';
  ctx.lineWidth = 2;
  ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const exLabel = exitOpen ? 'GETAWAY — OPEN' : 'GETAWAY — LOCKED';
  const exLabelX = Math.max(70, Math.min(GAME_WIDTH - 70, exit.x + exit.w / 2));
  const exLabelY = Math.max(14, Math.min(GAME_HEIGHT - 8, exit.y + exit.h / 2 + 4));
  ctx.fillText(exLabel, exLabelX, exLabelY);

  // Walls with a bright top edge.
  for (const w of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 4);
    ctx.strokeStyle = PALETTE.wallEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }

  // Loot.
  for (const item of g.loot) {
    if (item.taken) continue;
    drawLootShape(ctx, item, time);
  }

  // Safes.
  for (const safe of g.safes) {
    ctx.fillStyle = safe.open ? PALETTE.safeOpen : PALETTE.safe;
    ctx.fillRect(safe.x - 18, safe.y - 14, 36, 28);
    ctx.strokeStyle = '#0d1322';
    ctx.lineWidth = 2;
    ctx.strokeRect(safe.x - 18, safe.y - 14, 36, 28);
    ctx.beginPath();
    ctx.arc(safe.x, safe.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const sLabel = safe.open ? 'OPEN' : 'SAFE $' + safe.value;
    ctx.fillText(sLabel, Math.max(40, Math.min(GAME_WIDTH - 40, safe.x)), Math.max(12, safe.y - 20));
  }

  // Vision cones (under the bodies).
  for (const guard of g.guards) {
    drawCone(ctx, guard.x, guard.y, guard.facing, GUARD_HALF_ANGLE, GUARD_VISION_RANGE,
      guard.hunting ? PALETTE.coneHunt : PALETTE.cone);
  }
  for (const cam of g.cameras) {
    if (cam.disabled) continue;
    drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_HALF_ANGLE, CAMERA_RANGE, PALETTE.cameraCone);
  }

  // Smoke clouds.
  for (const s of g.smokes) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.smoke;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s.x - 20, s.y + 10, s.radius * 0.55, 0, Math.PI * 2);
    ctx.arc(s.x + 22, s.y - 8, s.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cameras.
  for (const cam of g.cameras) {
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = cam.disabled ? '#5a6b7a' : PALETTE.camera;
    ctx.fill();
    ctx.strokeStyle = '#0d1322';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (cam.disabled) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EMP', cam.x, cam.y - 12);
    }
  }

  // Guards.
  for (const guard of g.guards) {
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
    ctx.fillStyle = guard.hunting ? PALETTE.guardHunt : PALETTE.guard;
    ctx.fill();
    ctx.strokeStyle = '#0d1322';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing dot.
    ctx.beginPath();
    ctx.arc(
      guard.x + Math.cos(guard.facing) * 8,
      guard.y + Math.sin(guard.facing) * 8,
      3, 0, Math.PI * 2,
    );
    ctx.fillStyle = '#fff';
    ctx.fill();
    if (guard.hunting) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - guard.radius - 6);
    }
  }

  // The thief: hooded circle with a facing tick.
  const t = g.thief;
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.thief;
  ctx.fill();
  ctx.strokeStyle = PALETTE.thiefHood;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.facing) * (t.radius + 5), t.y + Math.sin(t.facing) * (t.radius + 5));
  ctx.strokeStyle = PALETTE.thiefHood;
  ctx.lineWidth = 3;
  ctx.stroke();
  if (t.sneaking) {
    ctx.fillStyle = '#9aa7bd';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAKING', t.x, t.y - t.radius - 6);
  }
  // Safe-crack progress bar over the thief.
  if (t.cracking && t.crackProgress > 0) {
    const bw = 44;
    const bx = Math.max(4, Math.min(GAME_WIDTH - bw - 4, t.x - bw / 2));
    const by = Math.max(4, t.y - t.radius - 18);
    ctx.fillStyle = '#0d1322';
    ctx.fillRect(bx - 1, by - 1, bw + 2, 8);
    ctx.fillStyle = PALETTE.lootGold;
    ctx.fillRect(bx, by, bw * t.crackProgress, 6);
  }

  // Red alarm vignette once things get hot.
  if (g.alarm >= 25) {
    const strength = Math.min(0.45, (g.alarm - 25) / 100 + 0.12);
    const grad = ctx.createRadialGradient(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT * 0.35,
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT * 0.75,
    );
    grad.addColorStop(0, 'rgba(229, 50, 45, 0)');
    grad.addColorStop(1, `rgba(229, 50, 45, ${strength})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
}
