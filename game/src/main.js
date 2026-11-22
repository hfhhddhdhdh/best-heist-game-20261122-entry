// The Meridian Heist — game controller: state machine, loop, input, alarm,
// loot, safes, tools, scoring, screens, HUD, ?shot= staging, debug hook.

import { LEVELS } from './levels.js';
import { Guard } from './guards.js';
import { SecurityCamera } from './cameras.js';
import { Thief } from './player.js';
import { SoundEffects } from './audio.js';
import { renderGame } from './render.js';
import {
  GAME_WIDTH, GAME_HEIGHT, ALARM_MAX, ALARM_DECAY, ALARM_AFTER_HUNT,
  LOOT_GRAB_RADIUS, SAFE_CRACK_RADIUS, SAFE_CRACK_TIME, SMOKE_RADIUS,
  SMOKE_DURATION, EMP_RADIUS, EMP_CAMERA_DISABLE, EMP_GUARD_STUN,
  TIME_BONUS_PER_SECOND, START_LIVES, SNEAK_ALARM_FACTOR,
} from './config.js';
import { circleHitsRect, dist } from './geometry.js';

const $ = (id) => document.getElementById(id);

function alarmWord(alarm) {
  if (alarm >= 100) return 'MADE!';
  if (alarm >= 60) return 'Hunted';
  if (alarm >= 25) return 'Suspicious';
  return 'Calm';
}

function ratingFor(total) {
  if (total >= 9000) return 'LEGENDARY GHOST';
  if (total >= 7000) return 'MASTERMIND';
  if (total >= 5000) return 'CLEAN PROFESSIONAL';
  return 'UP-AND-COMING CREW';
}

export class HeistGame {
  constructor() {
    this.canvas = $('game');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = $('overlay');
    this.keys = new Set();
    this.sounds = new SoundEffects();
    this.state = 'title';
    this.levelIndex = 0;
    this.level = LEVELS[0];
    this.thief = new Thief(60, 540);
    this.guards = [];
    this.cameras = [];
    this.loot = [];
    this.safes = [];
    this.smokes = [];
    this.alarm = 0;
    this.lootValue = 0;
    this.banked = 0;
    this.lives = START_LIVES;
    this.timeLeft = 150;
    this.smokeCount = 0;
    this.empCount = 0;
    this.levelTake = 0;
    this.levelLoot = 0;
    this.gameOverReason = '';
    this.frozen = false;
    this.frozenTime = 12.5;
    this.time = 0;
    this.lastTs = 0;
    this.spotted = false;

    this.bindInput();
    this.loadLevel(0);
    this.showTitle();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  get score() {
    return this.banked + this.lootValue;
  }

  loadLevel(i) {
    this.levelIndex = i;
    this.level = LEVELS[i];
    const def = this.level;
    this.thief.reset(def.start);
    this.guards = def.guards.map((g) => new Guard(g));
    this.cameras = def.cameras.map((c) => new SecurityCamera(c));
    this.loot = def.loot.map((l) => ({ ...l, taken: false }));
    this.safes = def.safes.map((s) => ({ ...s, open: false }));
    this.smokes = [];
    this.alarm = 0;
    this.lootValue = 0;
    this.timeLeft = def.timeLimit;
    this.smokeCount = def.tools.smoke;
    this.empCount = def.tools.emp;
    this.levelTake = 0;
    this.levelLoot = 0;
    this.spotted = false;
  }

  // ----- screens -----

  showOverlay(html) {
    this.overlay.innerHTML = html;
    this.overlay.style.display = 'flex';
  }

  hideOverlay() {
    this.overlay.style.display = 'none';
    this.overlay.innerHTML = '';
  }

  showTitle() {
    this.state = 'title';
    this.showOverlay(`
      <div class="panel">
        <h2>THE MERIDIAN HEIST</h2>
        <p>Three jobs. One crew. Zero witnesses.</p>
        <p class="dim">Sneak past guards and cameras, lift the loot, crack the safes,
        and reach the getaway before the alarm tops out.</p>
        <p class="dim">WASD / arrows to move &middot; Shift to sneak &middot; click the floor to walk there<br>
        Q smoke bomb &middot; E EMP burst &middot; hold F by a safe to crack it &middot; P pause</p>
        <button data-action="start" class="primary">START THE HEIST</button>
      </div>`);
  }

  showBriefing() {
    this.state = 'briefing';
    const def = this.level;
    const lootList = def.loot.map((l) => `${l.kind} $${l.value}`).join(' &middot; ');
    const safeList = def.safes.length
      ? `<p>Wall safes: ${def.safes.map((s) => '$' + s.value).join(', ')} (hold F to crack)</p>` : '';
    this.showOverlay(`
      <div class="panel">
        <h2>${def.name}</h2>
        <p>${def.subtitle} &middot; ${def.timeLimit}s on the clock &middot; target $${def.target.toLocaleString()}</p>
        <p>${lootList}</p>
        ${safeList}
        <p class="dim">Smoke bombs &times;${def.tools.smoke} &middot; EMP bursts &times;${def.tools.emp} &middot; ${this.lives} lives left</p>
        <button data-action="begin" class="primary">BEGIN ${def.name.split('—')[0].trim().toUpperCase()}</button>
      </div>`);
  }

  showPaused() {
    this.state = 'paused';
    this.showOverlay(`
      <div class="panel">
        <h2>PAUSED</h2>
        <p class="dim">The crew holds its breath.</p>
        <button data-action="resume" class="primary">RESUME</button>
        <button data-action="retry">RESTART JOB</button>
      </div>`);
  }

  showLevelComplete() {
    this.state = 'levelComplete';
    const bonus = Math.floor(this.timeLeft) * TIME_BONUS_PER_SECOND;
    const last = this.levelIndex === LEVELS.length - 1;
    this.showOverlay(`
      <div class="panel">
        <h2>JOB COMPLETE</h2>
        <p>Loot $${this.levelLoot.toLocaleString()} / $${this.level.target.toLocaleString()}</p>
        <p>Time bonus +$${bonus.toLocaleString()} (${Math.floor(this.timeLeft)}s left &times; $${TIME_BONUS_PER_SECOND})</p>
        <p>Take this job: $${this.levelTake.toLocaleString()} &middot; Total: $${this.score.toLocaleString()}</p>
        <button data-action="next" class="primary">${last ? 'SEE THE SCORE' : 'NEXT JOB'}</button>
      </div>`);
  }

  showVictory() {
    this.state = 'victory';
    this.sounds.victory();
    this.showOverlay(`
      <div class="panel">
        <h2>THE MERIDIAN HEIST — DONE</h2>
        <p>Final take: $${this.score.toLocaleString()}</p>
        <p class="big">${ratingFor(this.score)}</p>
        <button data-action="restart" class="primary">RUN IT AGAIN</button>
      </div>`);
  }

  showGameOver(reason) {
    this.state = 'gameOver';
    this.gameOverReason = reason;
    this.sounds.gameOver();
    this.showOverlay(`
      <div class="panel">
        <h2>GAME OVER</h2>
        <p>${reason}</p>
        <p class="dim">Final take: $${this.score.toLocaleString()}</p>
        <button data-action="restart" class="primary">TRY AGAIN</button>
      </div>`);
  }

  showCaught() {
    this.state = 'caught';
    this.sounds.caught();
    this.showOverlay(`
      <div class="panel">
        <h2>CAUGHT!</h2>
        <p>A guard got hands on the thief. ${this.lives} ${this.lives === 1 ? 'life' : 'lives'} left.</p>
        <button data-action="retry" class="primary">RETRY THE JOB</button>
      </div>`);
  }

  // ----- flow -----

  startRun() {
    this.banked = 0;
    this.lives = START_LIVES;
    this.loadLevel(0);
    this.showBriefing();
  }

  beginLevel() {
    this.hideOverlay();
    this.state = 'playing';
  }

  completeLevel() {
    const bonus = Math.floor(this.timeLeft) * TIME_BONUS_PER_SECOND;
    this.levelLoot = this.lootValue;
    this.levelTake = this.lootValue + bonus;
    this.banked += this.levelTake;
    this.lootValue = 0;
    this.sounds.levelComplete();
    this.showLevelComplete();
  }

  nextAfterComplete() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.showVictory();
      return;
    }
    this.loadLevel(this.levelIndex + 1);
    this.showBriefing();
  }

  retryLevel() {
    this.loadLevel(this.levelIndex);
    this.showBriefing();
  }

  // ----- tools -----

  useSmoke() {
    if (this.state !== 'playing' || this.smokeCount <= 0) return false;
    this.smokeCount -= 1;
    this.smokes.push({ x: this.thief.x, y: this.thief.y, radius: SMOKE_RADIUS, ttl: SMOKE_DURATION });
    this.sounds.smoke();
    return true;
  }

  useEmp() {
    if (this.state !== 'playing' || this.empCount <= 0) return false;
    this.empCount -= 1;
    for (const cam of this.cameras) {
      if (dist(this.thief.x, this.thief.y, cam.x, cam.y) <= EMP_RADIUS) cam.disable(EMP_CAMERA_DISABLE);
    }
    for (const guard of this.guards) {
      if (dist(this.thief.x, this.thief.y, guard.x, guard.y) <= EMP_RADIUS) guard.stun(EMP_GUARD_STUN);
    }
    this.sounds.emp();
    return true;
  }

  // ----- input -----

  bindInput() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      this.sounds.unlock();
      if (k === 'p' || k === 'escape') {
        if (this.state === 'playing') this.showPaused();
        else if (this.state === 'paused') { this.hideOverlay(); this.state = 'playing'; }
        return;
      }
      if (k === 'm') {
        this.sounds.muted = !this.sounds.muted;
        return;
      }
      if (k === 'r' && (this.state === 'playing' || this.state === 'paused')) {
        this.retryLevel();
        return;
      }
      if (k === 'q') { this.useSmoke(); return; }
      if (k === 'e') { this.useEmp(); return; }
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    this.canvas.addEventListener('pointerdown', (e) => {
      this.sounds.unlock();
      if (this.state !== 'playing') return;
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (GAME_WIDTH / rect.width);
      const y = (e.clientY - rect.top) * (GAME_HEIGHT / rect.height);
      this.thief.moveTarget = { x, y };
    });
    this.overlay.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      this.sounds.unlock();
      const action = btn.dataset.action;
      if (action === 'start') this.startRun();
      else if (action === 'begin') this.beginLevel();
      else if (action === 'next') this.nextAfterComplete();
      else if (action === 'retry') this.retryLevel();
      else if (action === 'restart') this.startRun();
      else if (action === 'resume') { this.hideOverlay(); this.state = 'playing'; }
    });
    $('btn-smoke').addEventListener('click', () => this.useSmoke());
    $('btn-emp').addEventListener('click', () => this.useEmp());
  }

  // ----- update -----

  update(dt) {
    if (this.state !== 'playing') return;

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.showGameOver('Dawn breaks — the crew ran out of time.');
      return;
    }

    this.thief.update(dt, this.keys, this.level.walls);

    // Safe cracking: hold F, standing still, within range of a closed safe.
    const nearSafe = this.safes.find(
      (s) => !s.open && this.thief.near(s.x, s.y, SAFE_CRACK_RADIUS),
    );
    if (nearSafe && this.keys.has('f') && !this.thief.moving) {
      this.thief.cracking = true;
      this.thief.crackProgress += dt / SAFE_CRACK_TIME;
      if (this.thief.crackProgress >= 1) {
        nearSafe.open = true;
        this.lootValue += nearSafe.value;
        this.thief.cracking = false;
        this.thief.crackProgress = 0;
        this.sounds.safeCracked();
      }
    } else {
      this.thief.cracking = false;
      this.thief.crackProgress = 0;
    }

    // Loot pickup.
    for (const item of this.loot) {
      if (!item.taken && this.thief.near(item.x, item.y, LOOT_GRAB_RADIUS)) {
        item.taken = true;
        this.lootValue += item.value;
        this.sounds.pickup();
      }
    }

    // Smoke clouds age out.
    for (const s of this.smokes) s.ttl -= dt;
    this.smokes = this.smokes.filter((s) => s.ttl > 0);

    // Watchers.
    let seen = false;
    let gain = 0;
    for (const guard of this.guards) {
      if (guard.canSee(this.thief, this.level.walls, this.smokes)) {
        seen = true;
        gain += guard.alarmRate * (this.thief.sneaking ? SNEAK_ALARM_FACTOR : 1);
      }
    }
    for (const cam of this.cameras) {
      if (cam.canSee(this.thief, this.level.walls, this.smokes)) {
        seen = true;
        gain += cam.alarmRate * (this.thief.sneaking ? SNEAK_ALARM_FACTOR : 1);
      }
    }
    if (seen) {
      if (!this.spotted) { this.sounds.spotted(); this.spotted = true; }
      this.alarm = Math.min(ALARM_MAX, this.alarm + gain * dt);
    } else {
      this.spotted = false;
      this.alarm = Math.max(0, this.alarm - ALARM_DECAY * dt);
    }
    if (this.alarm >= ALARM_MAX) {
      let nearest = null;
      let best = Infinity;
      for (const guard of this.guards) {
        const d = dist(guard.x, guard.y, this.thief.x, this.thief.y);
        if (d < best) { best = d; nearest = guard; }
      }
      if (nearest) nearest.hunting = true;
    }

    // Guards move / hunt; a finished hunt drops the alarm back to 55.
    for (const guard of this.guards) {
      const wasHunting = guard.hunting;
      guard.update(dt, this.thief, this.level.walls, this.smokes);
      if (wasHunting && !guard.hunting && this.alarm > ALARM_AFTER_HUNT) {
        this.alarm = ALARM_AFTER_HUNT;
      }
      if (guard.hunting && guard.catches(this.thief)) {
        this.lives -= 1;
        if (this.lives <= 0) {
          this.showGameOver('Caught with no lives left — the crew is done.');
        } else {
          this.showCaught();
        }
        return;
      }
    }
    for (const cam of this.cameras) cam.update(dt);

    // Exit: open once the take target is met.
    if (this.lootValue >= this.level.target &&
        circleHitsRect(this.thief.x, this.thief.y, this.thief.radius, this.level.exit)) {
      this.completeLevel();
    }
  }

  // ----- HUD -----

  updateHud() {
    $('hud-level').textContent = `${this.level.name} · ${this.level.subtitle}`;
    $('hud-loot').textContent = `$${this.lootValue.toLocaleString()} / $${this.level.target.toLocaleString()}`;
    const fill = $('alarm-fill');
    fill.style.width = `${this.alarm}%`;
    fill.style.background = this.alarm >= 60 ? '#e5322d' : this.alarm >= 25 ? '#e8b43c' : '#37b268';
    $('alarm-word').textContent = alarmWord(this.alarm);
    $('hud-time').textContent = `${Math.max(0, Math.ceil(this.timeLeft))}s`;
    $('hud-lives').textContent = '♥'.repeat(Math.max(0, this.lives)) + '♡'.repeat(Math.max(0, START_LIVES - this.lives));
    $('hud-score').textContent = `$${this.score.toLocaleString()}`;
    $('btn-smoke').textContent = `Smoke (Q) ×${this.smokeCount}`;
    $('btn-emp').textContent = `EMP (E) ×${this.empCount}`;
  }

  // ----- loop -----

  loop(ts) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.lastTs ? (ts - this.lastTs) / 1000 : 0.016);
    this.lastTs = ts;
    if (!this.frozen) {
      this.time += dt;
      this.update(dt);
    }
    renderGame(this.ctx, this, this.frozen ? this.frozenTime : this.time);
    this.updateHud();
  }

  // ----- debug hook for the playtest driver -----

  snapshot() {
    return {
      state: this.state,
      levelIndex: this.levelIndex,
      alarm: Math.round(this.alarm * 10) / 10,
      lootValue: this.lootValue,
      score: this.score,
      lives: this.lives,
      timeLeft: Math.round(this.timeLeft * 10) / 10,
      thief: { x: Math.round(this.thief.x), y: Math.round(this.thief.y) },
      guardsHunting: this.guards.filter((g) => g.hunting).length,
      lootTaken: this.loot.filter((l) => l.taken).length + this.safes.filter((s) => s.open).length,
      smokes: this.smokeCount,
      emps: this.empCount,
      camerasDisabled: this.cameras.filter((c) => c.disabled).length,
      guards: this.guards.map((g) => ({
        x: Math.round(g.x), y: Math.round(g.y),
        facing: Math.round(g.facing * 100) / 100, hunting: g.hunting,
      })),
    };
  }

  teleport(x, y) {
    this.thief.x = x;
    this.thief.y = y;
    this.thief.moveTarget = null;
  }

  start() {
    if (this.state === 'title') this.startRun();
  }

  begin() {
    const btn = this.overlay.querySelector('[data-action]');
    if (btn) btn.click();
  }
}

function applyShot(game) {
  const shot = new URLSearchParams(window.location.search).get('shot');
  if (!shot) return;
  game.frozen = true;
  if (shot === 'heist') {
    game.loadLevel(0);
    game.state = 'playing';
    game.hideOverlay();
    game.thief.x = 470;
    game.thief.y = 320;
    game.loot[0].taken = true;
    game.lootValue = 400;
    game.alarm = 35;
    game.guards[0].x = 240; game.guards[0].y = 240; game.guards[0].facing = Math.PI / 2;
    game.guards[1].x = 720; game.guards[1].y = 360; game.guards[1].facing = -Math.PI / 2;
    game.cameras[0].angle = Math.PI / 2 + 0.3;
    game.cameras[1].angle = Math.PI - 0.25;
  } else if (shot === 'title') {
    game.loadLevel(0);
    game.showTitle();
  } else if (shot === 'alarm') {
    game.loadLevel(1);
    game.state = 'playing';
    game.hideOverlay();
    game.thief.x = 820;
    game.thief.y = 300;
    game.alarm = 82;
    const hunter = game.guards[2];
    hunter.x = 786; hunter.y = 268;
    hunter.hunting = true;
    hunter.facing = Math.atan2(300 - 268, 820 - 786);
    game.cameras[1].angle = Math.PI - 0.2;
  } else if (shot === 'getaway') {
    game.loadLevel(0);
    game.lootValue = 1200;
    game.timeLeft = 87;
    game.levelLoot = 1200;
    game.levelTake = 1200 + 87 * TIME_BONUS_PER_SECOND;
    game.banked = 87 * TIME_BONUS_PER_SECOND;
    game.state = 'levelComplete';
    game.showOverlay(`
      <div class="panel">
        <h2>JOB COMPLETE</h2>
        <p>Loot $1,200 / $1,200</p>
        <p>Time bonus +$435 (87s left &times; $5)</p>
        <p>Take this job: $1,635 &middot; Total: $1,635</p>
        <button data-action="next" class="primary">NEXT JOB</button>
      </div>`);
  }
}

function boot() {
  const game = new HeistGame();
  window.__heist = {
    game,
    snapshot: () => game.snapshot(),
    teleport: (x, y) => game.teleport(x, y),
    start: () => game.start(),
    begin: () => game.begin(),
  };
  applyShot(game);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
