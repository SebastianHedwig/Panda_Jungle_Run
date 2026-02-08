const EXPLOSION_BASE_SIZE = 64;

export class Explosion {
  /**
   * Creates a new instance.
   * Updates the instance state.
   * @param {number} centerX Center X.
   * @param {number} centerY Center Y.
   */
  constructor(centerX, centerY) {
    this.initPosition(centerX, centerY);
    this.initAnimationState();
    this.loadFrames();
  }

  /**
   * Initializes position.
   * Updates the instance state.
   * @param {number} centerX Center X.
   * @param {number} centerY Center Y.
   */
  initPosition(centerX, centerY) {
    this.positionX = centerX;
    this.positionY = centerY;
  }

  /**
   * Initializes animation state.
   * Advances animation state and sprites.
   * Updates the instance state.
   */
  initAnimationState() {
    this.frames = [];
    this.currentFrameIndex = 0;
    this.frameTime = 0;
    this.frameDuration = 0.06;
    this.scaleFactor = 1.6;
    this.finished = false;
  }

  /**
   * Loads frames.
   * Updates the instance state.
   */
  loadFrames() {
    for (let frameIndex = 1; frameIndex <= 7; frameIndex++) {
      const img = new Image();
      img.src = `assets/img/Explosions/EXPLOSIONS${frameIndex}.png`;
      this.frames.push(img);
    }
  }

  /**
   * Updates.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  update(dt) {
    this.frameTime += dt;

    if (this.frameTime >= this.frameDuration) {
      this.frameTime = 0;
      this.currentFrameIndex++;

      if (this.currentFrameIndex >= this.frames.length) {
        this.finished = true;
        return;
      }
    }
  }

  /**
   * Renders.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
   */
  render(ctx, camera) {
    if (this.finished) return;
    const img = this.getCurrentFrame();
    if (!img) return;
    this.drawExplosion(ctx, camera, img);
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
   * Draws explosion.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
   * @param {HTMLImageElement} img Img.
   */
  drawExplosion(ctx, camera, img) {
    const { explosionWidth, explosionHeight } = this.getExplosionSize();
    ctx.drawImage(
      img,
      this.positionX - camera.x - explosionWidth / 2,
      this.positionY - camera.y - explosionHeight / 2,
      explosionWidth,
      explosionHeight
    );
  }

  /**
   * Returns explosion size.
   * Updates the instance state.
   * @returns {Object} Explosion size.
   */
  getExplosionSize() {
    const explosionWidth = EXPLOSION_BASE_SIZE * this.scaleFactor;
    const explosionHeight = explosionWidth;
    return { explosionWidth, explosionHeight };
  }
}
