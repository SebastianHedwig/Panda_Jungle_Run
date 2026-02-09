const EXPLOSION_BASE_SIZE = 64;

export class Explosion {
  /**
   * Creates a new instance.
   * Used to set up required data for collectable handling.
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
   * Used to set default state before use for camera-relative placement.
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
   * Used to advance state during the update loop for collectable handling.
   * Advances animation state and sprites.
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
   * Used to render visuals.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {Camera} camera Camera instance.
   */
  render(ctx, camera) {
    if (this.finished) return;
    const img = this.getCurrentFrame();
    if (!img) return;
    this.drawExplosion(ctx, camera, img);
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
   * Draws explosion.
   * Used to render explosion.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {Camera} camera Camera instance.
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
   * Used to provide explosion size for rendering.
   * @returns {Object} Explosion size.
   */
  getExplosionSize() {
    const explosionWidth = EXPLOSION_BASE_SIZE * this.scaleFactor;
    const explosionHeight = explosionWidth;
    return { explosionWidth, explosionHeight };
  }
}
