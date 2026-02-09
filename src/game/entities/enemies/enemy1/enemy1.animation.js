/**
 * Initializes animation state.
 * Advances animation state and sprites.
 */
export function initializeAnimationState() {
  this.currentAnimation = this.idleFrames;
  this.currentFrame = 0;
  this.frameTime = 0;
  this.frameSpeed = 0.09;
  this.sprite = this.currentAnimation[0];
}

/**
 * Sets animation.
 * Used to support animation timing.
 * Advances animation state and sprites.
 * @param {*} frames Frames.
 */
export function setAnimation(frames) {
  if (!frames || this.currentAnimation === frames) return;
  this.currentAnimation = frames;
  this.currentFrame = 0;
  this.frameTime = 0;
  this.sprite = this.currentAnimation[0];
}

/**
 * Animate.
 * Used to support animation timing.
 * Advances animation state and sprites.
 * @param {number} dt Delta time in seconds.
 */
export function animate(dt) {
  this.frameTime += dt;
  if (this.frameTime >= this.frameSpeed) {
    this.frameTime = 0;
    this.currentFrame = (this.currentFrame + 1) % this.currentAnimation.length;
    this.sprite = this.currentAnimation[this.currentFrame];
  }
}

