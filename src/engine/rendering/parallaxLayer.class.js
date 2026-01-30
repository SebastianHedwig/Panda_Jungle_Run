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

  render(ctx) {
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const imageAspectRatio = this.image.width / this.image.height;

    let drawW = canvasWidth;
    let drawH = canvasWidth / imageAspectRatio;

    if (drawH < canvasHeight) {
      drawH = canvasHeight;
      drawW = canvasHeight * imageAspectRatio;
    }

    const tileStartX = Math.floor(this.x % drawW); // Calculate starting X position for tiling
    ctx.drawImage(this.image, tileStartX, Math.floor(this.y), drawW, drawH); // Draw first tile
    ctx.drawImage(this.image, tileStartX + Math.floor(drawW), Math.floor(this.y), Math.floor(drawW), Math.floor(drawH)); // Draw second tile to cover gap
  }
}
