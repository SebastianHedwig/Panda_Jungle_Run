const CLOUD_SCALE_MIN = 0.1;
const CLOUD_SCALE_MAX = 0.4;
const CLOUD_PARALLAX_MIN = 0.02;
const CLOUD_PARALLAX_MAX = 0.12;

export class Cloud {
  /**
   * Creates a new instance.
   * Used to set up required data for gameplay flow.
   * Introduces randomness into the outcome.
   * @param {HTMLImageElement} image Image.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {number} horizontalSpeed Horizontal speed.
   */
  constructor(image, x, y, horizontalSpeed) {
    this.image = image;
    this.x = x;
    this.y = y;
    this.horizontalSpeed = horizontalSpeed;
    this.scale = Math.random() * (CLOUD_SCALE_MAX - CLOUD_SCALE_MIN) + CLOUD_SCALE_MIN;
    this.parallax = Math.random() * (CLOUD_PARALLAX_MAX - CLOUD_PARALLAX_MIN) + CLOUD_PARALLAX_MIN;
  }

  /**
   * Updates.
   * Used to advance state during the update loop for gameplay flow.
   * @param {number} dt Delta time in seconds.
   * @param {number} cameraX Camera X.
   */
  update(dt, cameraX) {
    this.x -= this.horizontalSpeed * dt;
    this.screenX = this.x - cameraX * this.parallax;
  }

  /**
   * Renders.
   * Used to render visuals.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {Camera} camera Camera instance.
   */
  render(ctx, camera) {
    const drawW = this.image.width * this.scale;
    const drawH = this.image.height * this.scale;

    ctx.drawImage(this.image, this.screenX, this.y - camera.y, drawW, drawH);
  }

  /**
   * Width.
   * Used to support gameplay flow.
   * @returns {*} Result value.
   */
  get width() {
    return this.image.width;
  }
}
