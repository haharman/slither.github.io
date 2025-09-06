// MIT License
// Snake entity and movement/collision helpers.
import { rand, pointSegDistSq, clamp } from './utils.js';

export class Snake {
  constructor(x, y, color = 'orange') {
    this.points = [{ x, y }];
    this.radius = 10;
    this.color = color;
    this.speed = 100; // units per second
    this.angle = rand(0, Math.PI * 2);
    this.turnRate = Math.PI;
    this.length = 200; // path length
    this.spacing = this.radius * 0.9;
    this.alive = true;
    this.score = 0;
    this.moveDist = 0;
  }

  head() {
    return this.points[0];
  }

  setAngle(target, dt) {
    let diff = ((target - this.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const maxTurn = this.turnRate / (1 + this.length * 0.0005) * dt;
    diff = clamp(diff, -maxTurn, maxTurn);
    this.angle += diff;
  }

  move(dt, boost) {
    const speed = this.speed * (boost ? 1.8 : 1);
    const vx = Math.cos(this.angle) * speed * dt;
    const vy = Math.sin(this.angle) * speed * dt;
    const head = this.head();
    head.x += vx;
    head.y += vy;
    this.moveDist += Math.hypot(vx, vy);
    if (this.moveDist > this.spacing) {
      this.points.unshift({ x: head.x, y: head.y });
      this.moveDist = 0;
    }
    const maxPoints = Math.floor(this.length / this.spacing);
    while (this.points.length > maxPoints) this.points.pop();
    if (boost) this.length = Math.max(50, this.length - dt * 60);
  }

  grow(amount) {
    this.length += amount;
    this.score += amount;
  }

  draw(ctx, camera, step = 1) {
    const pts = this.points;
    if (pts.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.radius * 2;
    ctx.beginPath();
    const sx = (pts[0].x - camera.x) * camera.scale + camera.w / 2;
    const sy = (pts[0].y - camera.y) * camera.scale + camera.h / 2;
    ctx.moveTo(sx, sy);
    for (let i = step; i < pts.length; i += step) {
      const p = pts[i];
      ctx.lineTo((p.x - camera.x) * camera.scale + camera.w / 2, (p.y - camera.y) * camera.scale + camera.h / 2);
    }
    ctx.stroke();
    // head
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius * camera.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function checkCollision(snake, world) {
  const head = snake.head();
  const r = snake.radius;
  // food
  const foods = world.queryFoods(head.x, head.y, 40);
  for (const f of foods) {
    const dx = head.x - f.x;
    const dy = head.y - f.y;
    const rr = r + f.r;
    if (dx * dx + dy * dy < rr * rr) {
      snake.grow(f.v);
      const idx = world.foods.indexOf(f);
      if (idx >= 0) world.foods.splice(idx, 1);
    }
  }
  // segments
  const segs = world.querySegments(head.x, head.y, r * 4);
  for (const s of segs) {
    if (s.snake === snake) continue;
    if (pointSegDistSq(head.x, head.y, s.ax, s.ay, s.bx, s.by) < (r + s.r) * (r + s.r)) {
      snake.alive = false;
      return;
    }
  }
}
