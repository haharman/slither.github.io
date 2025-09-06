// MIT License
// Game core: loop, camera, rendering, HUD
import { World, WORLD_SIZE } from './world.js';
import { Snake, checkCollision } from './snake.js';
import { Bot } from './bot.js';
import { rand } from './utils.js';

export class Game {
  constructor(canvas, input, settings) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.settings = settings;
    this.world = new World();
    this.player = new Snake(rand(0, WORLD_SIZE), rand(0, WORLD_SIZE), '#ffb300');
    this.world.addSnake(this.player);
    this.bots = [];
    for (let i = 0; i < settings.botCount; i++) {
      const b = new Bot(rand(0, WORLD_SIZE), rand(0, WORLD_SIZE), `hsl(${rand(0,360)},60%,50%)`);
      this.world.addSnake(b);
      this.bots.push(b);
    }
    this.world.spawnFood(2000);
    this.camera = { x: this.player.head().x, y: this.player.head().y, scale: 1, w: canvas.width, h: canvas.height };
    this.acc = 0;
    this.last = 0;
    this.fps = 0;
    this.awaitRespawn = false;
  }

  start() {
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(t) {
    const dt = (t - this.last) / 1000 || 0;
    this.last = t;
    this.fps = 1 / dt;
    this.acc += dt;
    const step = 1 / 60;
    while (this.acc >= step) {
      this.update(step);
      this.acc -= step;
    }
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    if (!this.player.alive) {
      this.awaitRespawn = true;
      if (this.input.spawn) {
        this.respawnPlayer();
        this.input.spawn = false;
      }
      return;
    }
    // controls
    const head = this.player.head();
    const worldPos = {
      x: (this.input.x - this.camera.w / 2) / this.camera.scale + this.camera.x,
      y: (this.input.y - this.camera.h / 2) / this.camera.scale + this.camera.y
    };
    const desired = Math.atan2(worldPos.y - head.y, worldPos.x - head.x);
    this.player.setAngle(desired, dt);
    this.player.move(dt, this.input.boost);
    // bots
    for (const b of this.bots) {
      if (b.alive) b.think(this.world, dt);
      else {
        // respawn bot
        b.points = [{ x: rand(0, WORLD_SIZE), y: rand(0, WORLD_SIZE) }];
        b.alive = true;
        b.length = 200;
      }
    }
    // rebuild spatial index and collisions
    this.world.rebuildFoodTree();
    this.world.rebuildSegTree();
    for (const s of this.world.snakes) {
      if (!s.alive) continue;
      checkCollision(s, this.world);
      if (!s.alive) { this.world.dropFood(s.points); if (s === this.player) this.input.spawn = false; }
    }
    // camera follow
    this.camera.x = head.x;
    this.camera.y = head.y;
    // keep food count
    if (this.world.foods.length < 2000) this.world.spawnFood(2000 - this.world.foods.length);
  }

  respawnPlayer() {
    this.player.points = [{ x: rand(0, WORLD_SIZE), y: rand(0, WORLD_SIZE) }];
    this.player.length = 200;
    this.player.alive = true;
    this.player.score = 0;
    this.awaitRespawn = false;
  }

  render() {
    const ctx = this.ctx;
    const cam = this.camera;
    ctx.clearRect(0, 0, cam.w, cam.h);
    // background grid
    ctx.save();
    ctx.strokeStyle = '#303030';
    ctx.lineWidth = 1;
    const grid = 50 * cam.scale;
    const startX = (-cam.x % 50) * cam.scale;
    const startY = (-cam.y % 50) * cam.scale;
    for (let x = startX; x < cam.w; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cam.h);
      ctx.stroke();
    }
    for (let y = startY; y < cam.h; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cam.w, y);
      ctx.stroke();
    }
    ctx.restore();
    // foods
    for (const f of this.world.foods) {
      const x = (f.x - cam.x) * cam.scale + cam.w / 2;
      const y = (f.y - cam.y) * cam.scale + cam.h / 2;
      ctx.fillStyle = '#6fcf97';
      ctx.beginPath();
      ctx.arc(x, y, f.r * cam.scale, 0, Math.PI * 2);
      ctx.fill();
    }
    // snakes
    const step = this.settings.quality === 'low' ? 2 : 1;
    for (const s of this.world.snakes) {
      if (s.alive) s.draw(ctx, cam, step);
    }
    // fade edges
    const fade = ctx.createRadialGradient(cam.w/2, cam.h/2, cam.w/2, cam.w/2, cam.h/2, cam.w/2 + 100);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = fade;
    ctx.fillRect(0,0,cam.w,cam.h);
    // HUD
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${Math.floor(this.player.score)}`, 10, 10);
    ctx.textAlign = 'right';
    ctx.fillText(`FPS: ${this.fps.toFixed(0)} Entities: ${this.world.snakes.length + this.world.foods.length}`, cam.w - 10, 10);
    ctx.textAlign = 'center';
    if (this.awaitRespawn) {
      ctx.fillText('Tap to respawn', cam.w / 2, cam.h / 2);
    }
    // touch joystick
    if (this.input.touch) {
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.input.baseX, this.input.baseY, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.input.x, this.input.y, 20, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
