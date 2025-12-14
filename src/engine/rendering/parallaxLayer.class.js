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
    const W = this.canvas.width;
    const H = this.canvas.height;
    const aspect = this.image.width / this.image.height;

    let drawW = W;
    let drawH = W / aspect;

    if (drawH < H) {
      drawH = H;
      drawW = H * aspect;
    }

    const startX = Math.floor(this.x % drawW);
    ctx.drawImage(this.image, startX, Math.floor(this.y), drawW, drawH);
    ctx.drawImage(this.image, startX + Math.floor(drawW), Math.floor(this.y), Math.floor(drawW), Math.floor(drawH));
  }
}
