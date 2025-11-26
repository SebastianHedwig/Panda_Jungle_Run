export class Cloud {
  constructor(image, x, y, speed) {
    this.image = image;
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.scale = Math.random() * 0.3 + 0.1;
    this.parallax = Math.random() * 0.1 + 0.02;
  }

  update(dt, cameraX) {
    this.x -= this.speed * dt;
    this.screenX = this.x - cameraX * this.parallax;
  }

  render(ctx, camera) {
    const drawW = this.image.width * this.scale;
    const drawH = this.image.height * this.scale;

    ctx.drawImage(this.image, this.screenX, this.y - camera.y, drawW, drawH);
  }

  get width() {
    return this.image.width;
  }
}
