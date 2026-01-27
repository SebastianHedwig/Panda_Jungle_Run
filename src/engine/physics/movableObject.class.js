import {
  APEX_BOOST,
  APEX_THRESHOLD,
  BASE_SPEED,
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

    this.speed = BASE_SPEED;
    this.velocityX = 0;
    this.velocityY = 0;

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
    this.velocityY += this.gravity * dt;
    this.y += this.velocityY * dt;
  }

  jump() {
    this.velocityY = -this.jumpForce;
    this.onGround = false;
  }

  applyApexGravity(dt) {
    const up = this.velocityY < 0;
    const near = Math.abs(this.velocityY) < this.apexThreshold;

    this.velocityY += (up ? this.gravityUp : this.gravityDown) * dt;
    if (up && near) this.velocityY *= this.apexBoost;

    this.y += this.velocityY * dt;
  }
}
