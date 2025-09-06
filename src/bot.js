// MIT License
// Simple bot AI extending Snake.
import { rand, pointSegDistSq } from './utils.js';
import { Snake } from './snake.js';

export class Bot extends Snake {
  constructor(x, y, color) {
    super(x, y, color);
    this.target = null;
  }

  think(world, dt) {
    const head = this.head();
    if (!this.target || Math.hypot(this.target.x - head.x, this.target.y - head.y) < 20) {
      const foods = world.queryFoods(head.x, head.y, 300);
      this.target = foods.length ? foods[Math.floor(Math.random() * foods.length)] : { x: rand(0, world.size), y: rand(0, world.size) };
    }
    let desired = Math.atan2(this.target.y - head.y, this.target.x - head.x);
    // avoidance
    const segs = world.querySegments(head.x, head.y, 100);
    for (const s of segs) {
      if (s.snake === this) continue;
      const dist = pointSegDistSq(head.x, head.y, s.ax, s.ay, s.bx, s.by);
      if (dist < 100 * 100) {
        const mx = (s.ax + s.bx) / 2;
        const my = (s.ay + s.by) / 2;
        desired += Math.PI / 2 * Math.sign(Math.sin(desired - Math.atan2(my - head.y, mx - head.x)));
      }
    }
    this.setAngle(desired, dt);
    this.move(dt, false);
  }
}
