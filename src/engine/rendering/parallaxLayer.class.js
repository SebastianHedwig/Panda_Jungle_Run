export class ParallaxLayer {
  /**
   * Creates a new instance.
   * Used to set up required data for gameplay flow.
   * @param {HTMLImageElement} image Image.
   * @param {number} speedFactorX Speed factor X.
   * @param {number} speedFactorY Speed factor Y.
   * @param {HTMLCanvasElement} canvas Target canvas.
   */
  constructor(image, speedFactorX, speedFactorY, canvas) {
    this.image = image;
    this.speedFactorX = speedFactorX;
    this.speedFactorY = speedFactorY;
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
  }

  /**
   * Updates.
   * Used to advance state during the update loop for gameplay flow.
   * @param {number} cameraX Camera X.
   * @param {number} cameraY Camera Y.
   */
  update(cameraX, cameraY) {
    this.x = -cameraX * this.speedFactorX;
    this.y = -cameraY * this.speedFactorY;
  }

  /**
   * Returns canvas size.
   * Used to provide canvas size for rendering.
   * @returns {Object} Canvas size.
   */
  getCanvasSize() {
    return { canvasWidth: this.canvas.width, canvasHeight: this.canvas.height };
  }

  /**
   * Returns image aspect ratio.
   * Used to provide image aspect ratio for rendering.
   * @returns {*} Image aspect ratio.
   */
  getImageAspectRatio() {
    return this.image.width / this.image.height;
  }

  /**
   * Returns draw size.
   * Used to provide draw size for rendering.
   * Uses canvasWidth, canvasHeight, imageAspectRatio to compute the result.
   * @param {boolean} canvasWidth Canvas width.
   * @param {boolean} canvasHeight Canvas height.
   * @param {number} imageAspectRatio Image aspect ratio.
   * @returns {Object} Draw size.
   */
  getDrawSize(canvasWidth, canvasHeight, imageAspectRatio) {
    let drawW = canvasWidth;
    let drawH = canvasWidth / imageAspectRatio;
    if (drawH < canvasHeight) {
      drawH = canvasHeight;
      drawW = canvasHeight * imageAspectRatio;
    }
    return { drawW, drawH };
  }

  /**
   * Returns tile start X.
   * Used to provide tile start X for gameplay flow.
   * @param {*} drawW Draw W.
   * @returns {*} Tile start X.
   */
  getTileStartX(drawW) {
    return Math.floor(this.x % drawW);
  }

  /**
   * Draws tiles.
   * Used to render tiles.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} tileStartX Tile start X.
   * @param {*} drawW Draw W.
   * @param {*} drawH Draw H.
   */
  drawTiles(ctx, tileStartX, drawW, drawH) {
    ctx.drawImage(this.image, tileStartX, Math.floor(this.y), drawW, drawH); // Draw first tile
    ctx.drawImage(this.image, tileStartX + Math.floor(drawW), Math.floor(this.y), Math.floor(drawW), Math.floor(drawH)); // Draw second tile to cover gap
  }

  /**
   * Renders.
   * Used to render visuals.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   */
  render(ctx) {
    const { canvasWidth, canvasHeight } = this.getCanvasSize();
    const imageAspectRatio = this.getImageAspectRatio();
    const { drawW, drawH } = this.getDrawSize(canvasWidth, canvasHeight, imageAspectRatio);
    const tileStartX = this.getTileStartX(drawW);
    this.drawTiles(ctx, tileStartX, drawW, drawH);
  }
}
