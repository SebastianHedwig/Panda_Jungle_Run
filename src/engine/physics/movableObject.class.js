export class MovableObject {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.speed = 150;
    this.vx = 0;
    this.vy = 0;

    this.gravity = 2800;
    this.onGround = true;

    this.facing = 1;

    /** Jump physics defaults */
    this.jumpForce = 1200;
    this.gravityUp = 2500;
    this.gravityDown = 3500;
    this.apexBoost = 0.6;
    this.apexThreshold = 120;
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

  jump() {
    this.vy = -this.jumpForce;
    this.onGround = false;
  }

  applyApexGravity(dt) {
    const up = this.vy < 0;
    const near = Math.abs(this.vy) < this.apexThreshold;

    this.vy += (up ? this.gravityUp : this.gravityDown) * dt;
    if (up && near) this.vy *= this.apexBoost;

    this.y += this.vy * dt;
  }
}
