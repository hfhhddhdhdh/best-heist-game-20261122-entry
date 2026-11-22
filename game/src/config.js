// The Meridian Heist — tuning constants and palette.
// All numbers live here so a level tweak never means hunting through logic.

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 600;

export const PLAYER_RADIUS = 13;
export const WALK_SPEED = 165;
export const SNEAK_SPEED = 92;
export const SNEAK_ALARM_FACTOR = 0.55;
export const SNEAK_RANGE_FACTOR = 0.7;

export const GUARD_RADIUS = 14;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_HUNT_SPEED = 128;
export const GUARD_VISION_RANGE = 178;
export const GUARD_HALF_ANGLE = (35 * Math.PI) / 180;
export const GUARD_ALARM_RATE = 46;
export const GUARD_WAIT_TIME = 0.9;

export const CAMERA_RANGE = 205;
export const CAMERA_HALF_ANGLE = (28 * Math.PI) / 180;
export const CAMERA_ALARM_RATE = 62;
export const CAMERA_SWEEP_SPEED = 0.55;

export const ALARM_DECAY = 13;
export const ALARM_MAX = 100;
export const HUNT_GIVE_UP_TIME = 1.2;
export const ALARM_AFTER_HUNT = 55;

export const LOOT_GRAB_RADIUS = 26;
export const SAFE_CRACK_RADIUS = 64;
export const SAFE_CRACK_TIME = 2.5;

export const SMOKE_RADIUS = 78;
export const SMOKE_DURATION = 6;
export const EMP_RADIUS = 270;
export const EMP_CAMERA_DISABLE = 9;
export const EMP_GUARD_STUN = 2;

export const TIME_BONUS_PER_SECOND = 5;
export const START_LIVES = 3;

export const PALETTE = {
  floorA: '#1b2740',
  floorB: '#162136',
  carpet: '#5a1f2b',
  goldTrim: '#c9a227',
  wall: '#2c3a55',
  wallTop: '#4d648f',
  wallEdge: '#0d1322',
  thief: '#e8e6df',
  thiefHood: '#23232e',
  guard: '#d97b29',
  guardHunt: '#e5322d',
  cone: 'rgba(232, 180, 60, 0.30)',
  coneHunt: 'rgba(229, 50, 45, 0.38)',
  cameraCone: 'rgba(229, 50, 45, 0.28)',
  camera: '#e5322d',
  lootGold: '#f2c14e',
  lootGem: '#59c2e8',
  lootPainting: '#c96f4a',
  lootVase: '#7fb069',
  safe: '#8a93a6',
  safeOpen: '#4d7c5a',
  exit: '#37b268',
  exitLocked: '#5a6b7a',
  smoke: 'rgba(190, 200, 215, 0.55)',
  alarm: '#e5322d',
  hud: '#0d1322',
  text: '#e8e6df',
  dim: '#9aa7bd',
};
