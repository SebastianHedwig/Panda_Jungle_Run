import {
  APEX_BOOST,
  APEX_THRESHOLD,
  GRAVITY,
  GRAVITY_DOWN,
  GRAVITY_UP,
  JUMP_FORCE,
  FACING_LEFT,
  FACING_RIGHT,
} from "../../config/config.js";

export class MovableObject {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.speed = 150;
    this.vx = 0;
    this.vy = 0;

    this.gravity = GRAVITY;
    this.onGround = true;

    this.facing = FACING_RIGHT;

    /** Jump physics defaults */
    this.jumpForce = JUMP_FORCE;
    this.gravityUp = GRAVITY_UP;
    this.gravityDown = GRAVITY_DOWN;
    this.apexBoost = APEX_BOOST;
    this.apexThreshold = APEX_THRESHOLD;
  }

  moveLeft(dt) {
    this.x -= this.speed * dt;
    this.facing = FACING_LEFT;
  }

  moveRight(dt) {
    this.x += this.speed * dt;
    this.facing = FACING_RIGHT;
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
