import { ParallaxLayer } from "./parallaxLayer.class.js";

export class Background {
  constructor(canvas) {
    this.canvas = canvas;
    this.layers = [];
  }

  addLayer(image, speedX, speedY = 0) {
    this.layers.push(new ParallaxLayer(image, speedX, speedY, this.canvas));
  }

  update(cameraX, cameraY) {
    for (let layer of this.layers) {
      layer.update(cameraX, cameraY);
    }
  }

  render(ctx) {
    for (let layer of this.layers) {
      layer.render(ctx);
    }
  }
}
