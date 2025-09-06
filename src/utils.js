// MIT License
// Utility helpers and simple Quadtree implementation.

export function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function pointSegDistSq(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return wx * wx + wy * wy;
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return (px - bx) * (px - bx) + (py - by) * (py - by);
  const t = c1 / c2;
  const cx = ax + t * vx;
  const cy = ay + t * vy;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy;
}

export class Quadtree {
  constructor(boundary, capacity = 8, depth = 0, maxDepth = 8) {
    this.boundary = boundary; // {x,y,w,h}
    this.capacity = capacity;
    this.depth = depth;
    this.maxDepth = maxDepth;
    this.points = [];
    this.divided = false;
  }

  subdivide() {
    const { x, y, w, h } = this.boundary;
    const hw = w / 2;
    const hh = h / 2;
    this.nw = new Quadtree({ x, y, w: hw, h: hh }, this.capacity, this.depth + 1, this.maxDepth);
    this.ne = new Quadtree({ x: x + hw, y, w: hw, h: hh }, this.capacity, this.depth + 1, this.maxDepth);
    this.sw = new Quadtree({ x, y: y + hh, w: hw, h: hh }, this.capacity, this.depth + 1, this.maxDepth);
    this.se = new Quadtree({ x: x + hw, y: y + hh, w: hw, h: hh }, this.capacity, this.depth + 1, this.maxDepth);
    this.divided = true;
  }

  insert(p) {
    if (!this.contains(this.boundary, p)) return false;
    if (this.points.length < this.capacity || this.depth >= this.maxDepth) {
      this.points.push(p);
      return true;
    }
    if (!this.divided) this.subdivide();
    return this.nw.insert(p) || this.ne.insert(p) || this.sw.insert(p) || this.se.insert(p);
  }

  query(range, found = []) {
    if (!this.intersects(this.boundary, range)) return found;
    for (const p of this.points) {
      if (this.contains(range, p)) found.push(p);
    }
    if (this.divided) {
      this.nw.query(range, found);
      this.ne.query(range, found);
      this.sw.query(range, found);
      this.se.query(range, found);
    }
    return found;
  }

  clear() {
    this.points.length = 0;
    if (this.divided) {
      this.nw.clear();
      this.ne.clear();
      this.sw.clear();
      this.se.clear();
      this.divided = false;
    }
  }

  contains(rect, p) {
    return p.x >= rect.x && p.x <= rect.x + rect.w && p.y >= rect.y && p.y <= rect.y + rect.h;
  }

  intersects(a, b) {
    return !(b.x > a.x + a.w || b.x + b.w < a.x || b.y > a.y + a.h || b.y + b.h < a.y);
  }
}
