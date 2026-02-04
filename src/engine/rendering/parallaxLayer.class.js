export class ParallaxLayer {
  /**
   * Creates a new instance.
   * Updates the instance state.
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
   * Updates the instance state.
   * @param {number} cameraX Camera X.
   * @param {number} cameraY Camera Y.
   */
  update(cameraX, cameraY) {
    this.x = -cameraX * this.speedFactorX;
    this.y = -cameraY * this.speedFactorY;
  }

  /**
   * Returns canvas size.
   * Updates the instance state.
   * @returns {Object} Canvas size.
   */
  getCanvasSize() {
    return { canvasWidth: this.canvas.width, canvasHeight: this.canvas.height };
  }

  /**
   * Returns image aspect ratio.
   * Updates the instance state.
   * @returns {*} Image aspect ratio.
   */
  getImageAspectRatio() {
    return this.image.width / this.image.height;
  }

  /**
   * Returns draw size.
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
   * Updates the instance state.
   * @param {*} drawW Draw W.
   * @returns {*} Tile start X.
   */
  getTileStartX(drawW) {
    return Math.floor(this.x % drawW);
  }

  /**
   * Draws tiles.
   * Renders to the canvas context.
   * Updates the instance state.
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
   * Updates the instance state.
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
