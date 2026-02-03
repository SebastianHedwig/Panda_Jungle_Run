export class ParallaxLayer {
  constructor(image, speedFactorX, speedFactorY, canvas) {
    this.image = image;
    this.speedFactorX = speedFactorX;
    this.speedFactorY = speedFactorY;
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
  }

  update(cameraX, cameraY) {
    this.x = -cameraX * this.speedFactorX;
    this.y = -cameraY * this.speedFactorY;
  }

  getCanvasSize() {
    return { canvasWidth: this.canvas.width, canvasHeight: this.canvas.height };
  }

  getImageAspectRatio() {
    return this.image.width / this.image.height;
  }

  getDrawSize(canvasWidth, canvasHeight, imageAspectRatio) {
    let drawW = canvasWidth;
    let drawH = canvasWidth / imageAspectRatio;
    if (drawH < canvasHeight) {
      drawH = canvasHeight;
      drawW = canvasHeight * imageAspectRatio;
    }
    return { drawW, drawH };
  }

  getTileStartX(drawW) {
    return Math.floor(this.x % drawW);
  }

  drawTiles(ctx, tileStartX, drawW, drawH) {
    ctx.drawImage(this.image, tileStartX, Math.floor(this.y), drawW, drawH); // Draw first tile
    ctx.drawImage(this.image, tileStartX + Math.floor(drawW), Math.floor(this.y), Math.floor(drawW), Math.floor(drawH)); // Draw second tile to cover gap
  }

  render(ctx) {
    const { canvasWidth, canvasHeight } = this.getCanvasSize();
    const imageAspectRatio = this.getImageAspectRatio();
    const { drawW, drawH } = this.getDrawSize(canvasWidth, canvasHeight, imageAspectRatio);
    const tileStartX = this.getTileStartX(drawW);
    this.drawTiles(ctx, tileStartX, drawW, drawH);
  }
}
