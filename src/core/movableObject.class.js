export class MovableObject {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.speed = 100;
    this.vx = 0;
    this.vy = 0;

    this.gravity = 2800;
    this.onGround = true;

    this.facing = 1;
  }

  moveLeft(dt) {
    this.x -= this.speed * dt;
    this.facing = -1;
  }

  moveRight(dt) {
    this.x += this.speed * dt;
    this.facing = 1;
  }

  applyGravity(dt) {
    this.vy += this.gravity * dt;
    this.y += this.vy * dt;
  }
}
