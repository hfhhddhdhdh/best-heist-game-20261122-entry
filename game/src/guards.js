// The Meridian Heist — patrolling guards that spot the thief and give chase.

import {
  GUARD_RADIUS,
  GUARD_PATROL_SPEED,
  GUARD_HUNT_SPEED,
  GUARD_VISION_RANGE,
  GUARD_HALF_ANGLE,
  GUARD_ALARM_RATE,
  GUARD_WAIT_TIME,
  HUNT_GIVE_UP_TIME,
  SNEAK_RANGE_FACTOR,
} from './config.js';
import { angleDiff, dist, hasLineOfSight, moveCircleOutOfWalls } from './geometry.js';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';

export class Guard {
  constructor(def) {
    this.waypoints = def.waypoints;
    this.x = def.waypoints[0].x;
    this.y = def.waypoints[0].y;
    this.radius = GUARD_RADIUS;
    this.wpIndex = 1 % def.waypoints.length;
    this.waitTimer = 0;
    this.facing = 0;
    this.hunting = false;
    this.lostSightTimer = 0;
    this.stunTimer = 0;
    this.patrolSpeed = GUARD_PATROL_SPEED;
    this.huntSpeed = GUARD_HUNT_SPEED;
  }

  get alarmRate() {
    return GUARD_ALARM_RATE;
  }

  stun(seconds) {
    this.stunTimer = Math.max(this.stunTimer, seconds);
    this.hunting = false;
    this.lostSightTimer = 0;
  }

  // True when the thief is inside the cone, in range, in line of sight,
  // and not hidden inside a smoke cloud. Sneaking shrinks the range.
  canSee(thief, walls, smokes) {
    if (this.stunTimer > 0) return false;
    for (const s of smokes) {
      if (dist(thief.x, thief.y, s.x, s.y) < s.radius) return false;
    }
    const range = GUARD_VISION_RANGE * (thief.sneaking ? SNEAK_RANGE_FACTOR : 1);
    const d = dist(this.x, this.y, thief.x, thief.y);
    if (d > range) return false;
    const toThief = Math.atan2(thief.y - this.y, thief.x - this.x);
    if (Math.abs(angleDiff(toThief, this.facing)) > GUARD_HALF_ANGLE) return false;
    return hasLineOfSight(this.x, this.y, thief.x, thief.y, walls);
  }

  catches(thief) {
    return dist(this.x, this.y, thief.x, thief.y) < this.radius + thief.radius - 2;
  }

  update(dt, thief, walls, smokes) {
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      return;
    }
    const sees = this.canSee(thief, walls, smokes);
    if (this.hunting) {
      if (sees) {
        this.lostSightTimer = 0;
      } else {
        this.lostSightTimer += dt;
        if (this.lostSightTimer >= HUNT_GIVE_UP_TIME) {
          this.hunting = false;
          this.lostSightTimer = 0;
          return;
        }
      }
      // Chase the thief's current position.
      const dx = thief.x - this.x;
      const dy = thief.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > 1) {
        this.facing = Math.atan2(dy, dx);
        const step = this.huntSpeed * dt;
        const pos = moveCircleOutOfWalls(
          this.x + (dx / d) * step,
          this.y + (dy / d) * step,
          this.radius,
          walls,
          GAME_WIDTH,
          GAME_HEIGHT,
        );
        this.x = pos.x;
        this.y = pos.y;
      }
      return;
    }
    // Patrol: walk the waypoint loop, pausing briefly at each point.
    if (this.waitTimer > 0) {
      this.waitTimer -= dt;
      return;
    }
    const target = this.waypoints[this.wpIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const d = Math.hypot(dx, dy);
    const step = this.patrolSpeed * dt;
    if (d <= Math.max(step, 4)) {
      this.x = target.x;
      this.y = target.y;
      this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
      this.waitTimer = GUARD_WAIT_TIME;
      return;
    }
    this.facing = Math.atan2(dy, dx);
    const pos = moveCircleOutOfWalls(
      this.x + (dx / d) * step,
      this.y + (dy / d) * step,
      this.radius,
      walls,
      GAME_WIDTH,
      GAME_HEIGHT,
    );
    this.x = pos.x;
    this.y = pos.y;
  }
}
