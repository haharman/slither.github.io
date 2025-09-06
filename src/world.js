// MIT License
// World management: food, snakes and spatial index.
import { Quadtree, rand } from './utils.js';

export const WORLD_SIZE = 6000;

export class World {
  constructor() {
    this.size = WORLD_SIZE;
    this.foods = [];
    this.snakes = [];
    this.foodTree = new Quadtree({ x: 0, y: 0, w: this.size, h: this.size }, 16, 0, 6);
    this.segTree = new Quadtree({ x: 0, y: 0, w: this.size, h: this.size }, 16, 0, 6);
  }

  addSnake(s) {
    this.snakes.push(s);
  }

  spawnFood(n) {
    for (let i = 0; i < n; i++) {
      this.foods.push({ x: rand(0, this.size), y: rand(0, this.size), r: 4, v: 5 });
    }
  }

  dropFood(points) {
    for (const p of points) {
      this.foods.push({ x: p.x, y: p.y, r: 4, v: 5 });
    }
  }

  rebuildFoodTree() {
    this.foodTree.clear();
    for (const f of this.foods) this.foodTree.insert(f);
  }

  rebuildSegTree() {
    this.segTree.clear();
    for (const s of this.snakes) {
      if (!s.alive) continue;
      const pts = s.points;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const minx = Math.min(a.x, b.x) - s.radius;
        const miny = Math.min(a.y, b.y) - s.radius;
        const maxx = Math.max(a.x, b.x) + s.radius;
        const maxy = Math.max(a.y, b.y) + s.radius;
        this.segTree.insert({
          x: minx,
          y: miny,
          w: maxx - minx,
          h: maxy - miny,
          ax: a.x,
          ay: a.y,
          bx: b.x,
          by: b.y,
          r: s.radius,
          snake: s
        });
      }
    }
  }

  queryFoods(x, y, r) {
    return this.foodTree.query({ x: x - r, y: y - r, w: r * 2, h: r * 2 });
  }

  querySegments(x, y, r) {
    return this.segTree.query({ x: x - r, y: y - r, w: r * 2, h: r * 2 });
  }
}
