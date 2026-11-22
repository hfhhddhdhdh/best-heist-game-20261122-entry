// The Meridian Heist — the three jobs. Layouts are my own; each level is a
// playfield of walls, patrol routes, cameras, loot, safes, start and exit.

export const LEVELS = [
  {
    name: 'Job 1 — The Gilded Gallery',
    subtitle: 'Museum',
    timeLimit: 150,
    target: 1200,
    start: { x: 60, y: 540 },
    exit: { x: 884, y: 524, w: 56, h: 56 },
    tools: { smoke: 2, emp: 1 },
    // Two interior partitions split the gallery into west / middle / east wings,
    // each with a mid-room gap so the thief can slip between them.
    walls: [
      { x: 300, y: 0, w: 24, h: 200 },
      { x: 300, y: 400, w: 24, h: 200 },
      { x: 636, y: 0, w: 24, h: 200 },
      { x: 636, y: 400, w: 24, h: 200 },
    ],
    guards: [
      { waypoints: [{ x: 120, y: 120 }, { x: 240, y: 120 }, { x: 240, y: 480 }, { x: 120, y: 480 }] },
      { waypoints: [{ x: 720, y: 120 }, { x: 840, y: 120 }, { x: 840, y: 480 }, { x: 720, y: 480 }] },
    ],
    cameras: [
      { x: 480, y: 20, baseAngle: Math.PI / 2, sweep: 0.7 },
      { x: 940, y: 300, baseAngle: Math.PI, sweep: 0.55 },
    ],
    loot: [
      { kind: 'painting', x: 150, y: 300, value: 400 },
      { kind: 'painting', x: 480, y: 100, value: 350 },
      { kind: 'painting', x: 480, y: 500, value: 450 },
      { kind: 'painting', x: 810, y: 300, value: 300 },
      { kind: 'vase', x: 480, y: 300, value: 250 },
    ],
    safes: [],
  },
  {
    name: 'Job 2 — The Meridian Vault',
    subtitle: 'Bank',
    timeLimit: 170,
    target: 2000,
    start: { x: 60, y: 60 },
    exit: { x: 882, y: 22, w: 56, h: 56 },
    tools: { smoke: 2, emp: 2 },
    // A long counter wall splits the floor with a gap in the middle; the vault
    // sits upper-right, entered through a gap at the foot of its left wall.
    walls: [
      { x: 0, y: 280, w: 380, h: 24 },
      { x: 560, y: 280, w: 140, h: 24 },
      { x: 700, y: 100, w: 236, h: 24 },
      { x: 700, y: 100, w: 24, h: 140 },
    ],
    guards: [
      { waypoints: [{ x: 120, y: 120 }, { x: 320, y: 120 }, { x: 320, y: 200 }, { x: 120, y: 200 }] },
      { waypoints: [{ x: 100, y: 420 }, { x: 520, y: 420 }, { x: 520, y: 540 }, { x: 100, y: 540 }] },
      { waypoints: [{ x: 780, y: 180 }, { x: 920, y: 180 }, { x: 920, y: 260 }, { x: 780, y: 260 }] },
    ],
    cameras: [
      { x: 480, y: 20, baseAngle: Math.PI / 2, sweep: 0.7 },
      { x: 930, y: 140, baseAngle: Math.PI, sweep: 0.5 },
      { x: 120, y: 580, baseAngle: -Math.PI / 2, sweep: 0.6 },
    ],
    loot: [
      { kind: 'gold', x: 200, y: 150, value: 400 },
      { kind: 'gold', x: 450, y: 150, value: 450 },
      { kind: 'gold', x: 200, y: 480, value: 350 },
      { kind: 'gold', x: 480, y: 480, value: 500 },
      { kind: 'vase', x: 480, y: 360, value: 300 },
    ],
    safes: [
      { x: 860, y: 160, value: 800 },
      { x: 860, y: 240, value: 800 },
    ],
  },
  {
    name: 'Job 3 — The Velvet Penthouse',
    subtitle: 'Casino',
    timeLimit: 180,
    target: 3000,
    start: { x: 60, y: 540 },
    exit: { x: 32, y: 32, w: 56, h: 56 },
    tools: { smoke: 3, emp: 2 },
    // Open casino floor: four pillars and one long bar counter to break sight lines.
    walls: [
      { x: 300, y: 200, w: 40, h: 40 },
      { x: 620, y: 200, w: 40, h: 40 },
      { x: 300, y: 380, w: 40, h: 40 },
      { x: 620, y: 380, w: 40, h: 40 },
      { x: 380, y: 120, w: 200, h: 24 },
    ],
    guards: [
      { waypoints: [{ x: 350, y: 200 }, { x: 610, y: 200 }, { x: 610, y: 400 }, { x: 350, y: 400 }] },
      { waypoints: [{ x: 120, y: 150 }, { x: 220, y: 150 }, { x: 220, y: 450 }, { x: 120, y: 450 }] },
      { waypoints: [{ x: 740, y: 150 }, { x: 880, y: 150 }, { x: 880, y: 450 }, { x: 740, y: 450 }] },
    ],
    cameras: [
      { x: 480, y: 20, baseAngle: Math.PI / 2, sweep: 0.7 },
      { x: 20, y: 300, baseAngle: 0, sweep: 0.55 },
      { x: 940, y: 300, baseAngle: Math.PI, sweep: 0.55 },
      { x: 480, y: 580, baseAngle: -Math.PI / 2, sweep: 0.6 },
    ],
    loot: [
      { kind: 'diamond', x: 480, y: 300, value: 1500 },
      { kind: 'sapphire', x: 700, y: 300, value: 600 },
      { kind: 'chips', x: 250, y: 300, value: 400 },
      { kind: 'painting', x: 480, y: 480, value: 350 },
      { kind: 'painting', x: 700, y: 480, value: 500 },
    ],
    safes: [
      { x: 880, y: 80, value: 900 },
    ],
  },
];
