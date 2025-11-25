export class Camera {
  constructor(canvas, worldWidth, worldHeight = canvas.height) {
    this.canvas = canvas;

    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.x = 0;
    this.y = 0;

    this.deadzoneWidth = canvas.width * 0.3;
    this.deadzoneHeight = canvas.height * 0.3;

    this.deadzoneX = (canvas.width - this.deadzoneWidth) / 2;
    this.deadzoneY = (canvas.height - this.deadzoneHeight) / 2;
  }

  follow(target, smoothing = 0.08) {
    const playerScreenX = target.x - this.x;
    const playerScreenY = target.y - this.y;

    if (playerScreenX < this.deadzoneX) {
      this.x -= (this.deadzoneX - playerScreenX) * smoothing;
    } else if (playerScreenX > this.deadzoneX + this.deadzoneWidth) {
      this.x += (playerScreenX - (this.deadzoneX + this.deadzoneWidth)) * smoothing;
    }

    if (playerScreenY < this.deadzoneY) {
      this.y -= (this.deadzoneY - playerScreenY) * smoothing;
    } else if (playerScreenY > this.deadzoneY + this.deadzoneHeight) {
      this.y += (playerScreenY - (this.deadzoneY + this.deadzoneHeight)) * smoothing;
    }

    if (this.x < 0) this.x = 0;
    if (this.x > this.worldWidth - this.canvas.width) {
      this.x = this.worldWidth - this.canvas.width;
    }

    if (this.y < 0) this.y = 0;
    if (this.y > this.worldHeight - this.canvas.height) {
      this.y = this.worldHeight - this.canvas.height;
    }
  }
}
