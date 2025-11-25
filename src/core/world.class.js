export class World {
  constructor(canvas, width) {
    this.canvas = canvas;
    this.width = width;
    this.left = 0;
    this.right = this.width;
    this.ground = this.canvas.height - 170;
  }

  applyWorldBounds(object) {
    if (object.y >= this.ground) {
      object.y = this.ground;
      object.vy = 0;
      object.onGround = true;
    }

    if (object.x < this.left) {
      object.x = this.left;
    }

    if (object.x > this.right - object.width) {
      object.x = this.right - object.width;
    }
  }
}
