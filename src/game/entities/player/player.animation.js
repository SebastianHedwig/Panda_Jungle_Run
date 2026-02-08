/**
 * Sets animation.
 * Advances animation state and sprites.
 * Updates the instance state.
 * @param {*} frames Frames.
 */
export function setAnimation(frames) {
  if (this.currentAnimation !== frames) {
    this.currentAnimation = frames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.sprite = this.currentAnimation[0];
  }
}

/**
 * Animate.
 * Advances animation state and sprites.
 * Updates the instance state.
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
