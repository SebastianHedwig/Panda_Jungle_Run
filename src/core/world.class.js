import { WORLD_WIDTH } from "../config.js";

export class World {
  constructor(canvas) {
    this.canvas = canvas;

    this.width = WORLD_WIDTH;
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
