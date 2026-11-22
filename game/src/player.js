// The Meridian Heist — the thief: WASD/arrows, sneak, click-to-move, safe cracking.

import { PLAYER_RADIUS, WALK_SPEED, SNEAK_SPEED, GAME_WIDTH, GAME_HEIGHT } from './config.js';
import { dist, moveCircleOutOfWalls } from './geometry.js';

export class Thief {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = PLAYER_RADIUS;
    this.facing = -Math.PI / 2;
    this.sneaking = false;
    this.moveTarget = null;
    this.cracking = false;
    this.crackProgress = 0;
    this.moving = false;
  }

  reset(start) {
    this.x = start.x;
    this.y = start.y;
    this.facing = -Math.PI / 2;
    this.sneaking = false;
    this.moveTarget = null;
    this.cracking = false;
    this.crackProgress = 0;
    this.moving = false;
  }

  update(dt, keys, walls) {
    let dx = 0;
    let dy = 0;
    if (keys.has('arrowup') || keys.has('w')) dy -= 1;
    if (keys.has('arrowdown') || keys.has('s')) dy += 1;
    if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
    if (keys.has('arrowright') || keys.has('d')) dx += 1;
    this.sneaking = keys.has('shift');

    if (dx !== 0 || dy !== 0) {
      // Keyboard input overrides any click-to-move target.
      this.moveTarget = null;
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    } else if (this.moveTarget) {
      const tx = this.moveTarget.x - this.x;
      const ty = this.moveTarget.y - this.y;
      const d = Math.hypot(tx, ty);
      if (d < 6) {
        this.moveTarget = null;
      } else {
        dx = tx / d;
        dy = ty / d;
      }
    }

    this.moving = dx !== 0 || dy !== 0;
    if (this.moving) {
      const speed = this.sneaking ? SNEAK_SPEED : WALK_SPEED;
      this.facing = Math.atan2(dy, dx);
      const pos = moveCircleOutOfWalls(
        this.x + dx * speed * dt,
        this.y + dy * speed * dt,
        this.radius,
        walls,
        GAME_WIDTH,
        GAME_HEIGHT,
      );
      this.x = pos.x;
      this.y = pos.y;
    }
    // Cracking is driven by the game (it knows the safes); moving cancels it.
    if (this.moving) {
      this.cracking = false;
      this.crackProgress = 0;
    }
  }

  near(x, y, radius) {
    return dist(this.x, this.y, x, y) < radius;
  }
}
