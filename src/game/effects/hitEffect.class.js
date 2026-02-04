const DEFAULT_FRAME_DURATION = 0.08;
const MAX_ANIMATION_LOOPS = 2;
const FLOAT_SPEED_PER_SECOND = -35;
const INITIAL_SCALE_FACTOR = 1.1;
const BASE_SPRITE_SIZE = 60;

export class DizzyEffect {
  /**
   * Creates a new instance.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} frames Frames.
   */
  constructor(x, y, frames) {
    this.x = x;
    this.y = y;
    this.frames = frames;

    this.currentFrameIndex = 0;
    this.frameElapsed = 0;
    this.frameDuration = DEFAULT_FRAME_DURATION;
    this.completedLoops = 0;
    this.maxLoops = MAX_ANIMATION_LOOPS;
    this.isFinished = false;

    this.floatSpeed = FLOAT_SPEED_PER_SECOND;
    this.scaleFactor = INITIAL_SCALE_FACTOR;
  }

  /**
   * Updates.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  update(dt) {
    if (this.isFinished) return;
    this.advanceFrameTime(dt);
    this.applyFloat(dt);
    this.advanceFrameIfNeeded();
  }

  /**
   * Advances frame time.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  advanceFrameTime(dt) {
    this.frameElapsed += dt;
  }

  /**
   * Applies float.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  applyFloat(dt) {
    this.y += this.floatSpeed * dt;
  }

  /**
   * Advances frame if needed.
   * Updates the instance state.
   */
  advanceFrameIfNeeded() {
    if (this.frameElapsed >= this.frameDuration) this.advanceFrame();
  }

  /**
   * Advances frame.
   * Advances animation state and sprites.
   * Updates the instance state.
   */
  advanceFrame() {
    this.frameElapsed = 0;
    this.currentFrameIndex++;
    if (this.currentFrameIndex >= this.frames.length) this.handleCompletedLoop();
  }

  /**
   * Handles completed loop.
   * Advances animation state and sprites.
   * Updates the instance state.
   */
  handleCompletedLoop() {
    this.currentFrameIndex = 0;
    this.completedLoops++;
    if (this.completedLoops >= this.maxLoops) this.isFinished = true;
  }

  /**
   * Renders.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {import("../../engine/world/camera.class.js").Camera} camera Camera instance.
   */
  render(ctx, camera) {
    if (this.isFinished) return;
    const img = this.getCurrentFrame();
    if (!img) return;
    this.drawFrame(ctx, camera, img);
  }

  /**
   * Returns current frame.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @returns {*} Current frame.
   */
  getCurrentFrame() {
    return this.frames[this.currentFrameIndex];
  }

  /**
   * Draws frame.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {import("../../engine/world/camera.class.js").Camera} camera Camera instance.
   * @param {HTMLImageElement} img Img.
   */
  drawFrame(ctx, camera, img) {
    const size = BASE_SPRITE_SIZE * this.scaleFactor;
    ctx.drawImage(img, this.x - camera.x - size / 2, this.y - camera.y - size / 2, size, size);
  }
}
