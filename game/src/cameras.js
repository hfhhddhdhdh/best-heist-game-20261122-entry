// The Meridian Heist — fixed security cameras sweeping their cones.

import {
  CAMERA_RANGE,
  CAMERA_HALF_ANGLE,
  CAMERA_ALARM_RATE,
  CAMERA_SWEEP_SPEED,
  SNEAK_RANGE_FACTOR,
} from './config.js';
import { angleDiff, dist, hasLineOfSight } from './geometry.js';

export class SecurityCamera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.baseAngle = def.baseAngle;
    this.sweep = def.sweep ?? 0.6;
    this.phase = Math.random() * Math.PI * 2;
    this.time = 0;
    this.angle = def.baseAngle;
    this.disabledTimer = 0;
  }

  get alarmRate() {
    return CAMERA_ALARM_RATE;
  }

  get disabled() {
    return this.disabledTimer > 0;
  }

  disable(seconds) {
    this.disabledTimer = Math.max(this.disabledTimer, seconds);
  }

  update(dt) {
    this.time += dt;
    this.angle = this.baseAngle + Math.sin(this.time * CAMERA_SWEEP_SPEED + this.phase) * this.sweep;
    if (this.disabledTimer > 0) this.disabledTimer -= dt;
  }

  canSee(thief, walls, smokes) {
    if (this.disabled) return false;
    for (const s of smokes) {
      if (dist(thief.x, thief.y, s.x, s.y) < s.radius) return false;
    }
    const range = CAMERA_RANGE * (thief.sneaking ? SNEAK_RANGE_FACTOR : 1);
    const d = dist(this.x, this.y, thief.x, thief.y);
    if (d > range) return false;
    const toThief = Math.atan2(thief.y - this.y, thief.x - this.x);
    if (Math.abs(angleDiff(toThief, this.angle)) > CAMERA_HALF_ANGLE) return false;
    return hasLineOfSight(this.x, this.y, thief.x, thief.y, walls);
  }
}
