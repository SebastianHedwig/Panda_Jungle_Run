import { APEX_BOOST, APEX_THRESHOLD, BASE_SPEED, GRAVITY, GRAVITY_DOWN, GRAVITY_UP, JUMP_FORCE, FACING_LEFT, FACING_RIGHT } from "../../config/config.js";

export class MovableObject {
  /**
   * Creates a new instance.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {number} width Width.
   * @param {number} height Height.
   */
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

    this.jumpForce = JUMP_FORCE;
    this.gravityUp = GRAVITY_UP;
    this.gravityDown = GRAVITY_DOWN;
    this.apexBoost = APEX_BOOST;
    this.apexThreshold = APEX_THRESHOLD;
  }

  /**
   * Move left.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  moveLeft(dt) {
    this.x -= this.speed * dt;
    this.facing = FACING_LEFT;
  }

  /**
   * Move right.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  moveRight(dt) {
    this.x += this.speed * dt;
    this.facing = FACING_RIGHT;
  }

  /**
   * Applies gravity.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  applyGravity(dt) {
    this.velocityY += this.gravity * dt;
    this.y += this.velocityY * dt;
  }

  /**
   * Jump.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   */
  jump() {
    this.velocityY = -this.jumpForce;
    this.onGround = false;
  }

  /**
   * Applies apex gravity.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  applyApexGravity(dt) {
    const isMovingUpwards = this.velocityY < 0;
    const isNearApex = Math.abs(this.velocityY) < this.apexThreshold;

    this.velocityY += (isMovingUpwards ? this.gravityUp : this.gravityDown) * dt;
    if (isMovingUpwards && isNearApex) this.velocityY *= this.apexBoost;

    this.y += this.velocityY * dt;
  }
}
