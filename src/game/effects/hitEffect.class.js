const DEFAULT_FRAME_DURATION = 0.08;
const MAX_ANIMATION_LOOPS = 2;
const FLOAT_SPEED_PER_SECOND = -35;
const INITIAL_SCALE_FACTOR = 1.1;
const BASE_SPRITE_SIZE = 60;

export class DizzyEffect {
  /**
   * Creates a new instance.
   * Used to set up required data for combat effects.
   * Advances animation state and sprites.
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
   * Used to advance state during the update loop for combat effects.
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
   * Used to support animation timing.
   * @param {number} dt Delta time in seconds.
   */
  advanceFrameTime(dt) {
    this.frameElapsed += dt;
  }

  /**
   * Applies float.
   * Used to keep state consistent before the next step for combat effects.
   * @param {number} dt Delta time in seconds.
   */
  applyFloat(dt) {
    this.y += this.floatSpeed * dt;
  }

  /**
   * Advances frame if needed.
   */
  advanceFrameIfNeeded() {
    if (this.frameElapsed >= this.frameDuration) this.advanceFrame();
  }

  /**
   * Advances frame.
   * Advances animation state and sprites.
   */
  advanceFrame() {
    this.frameElapsed = 0;
    this.currentFrameIndex++;
    if (this.currentFrameIndex >= this.frames.length) this.handleCompletedLoop();
  }

  /**
   * Handles completed loop.
   * Advances animation state and sprites.
   */
  handleCompletedLoop() {
    this.currentFrameIndex = 0;
    this.completedLoops++;
    if (this.completedLoops >= this.maxLoops) this.isFinished = true;
  }

  /**
   * Renders.
   * Used to render visuals.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {Camera} camera Camera instance.
   */
  render(ctx, camera) {
    if (this.isFinished) return;
    const img = this.getCurrentFrame();
    if (!img) return;
    this.drawFrame(ctx, camera, img);
  }

  /**
   * Returns current frame.
   * Used to provide current frame for animation timing.
   * Advances animation state and sprites.
   * @returns {*} Current frame.
   */
  getCurrentFrame() {
    return this.frames[this.currentFrameIndex];
  }

  /**
   * Draws frame.
   * Used to render frame.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {Camera} camera Camera instance.
   * @param {HTMLImageElement} img Img.
   */
  drawFrame(ctx, camera, img) {
    const size = BASE_SPRITE_SIZE * this.scaleFactor;
    ctx.drawImage(img, this.x - camera.x - size / 2, this.y - camera.y - size / 2, size, size);
  }
}
