import { ParallaxLayer } from "./parallaxLayer.class.js";
import { Cloud } from "./cloud.class.js";
import { WORLD_WIDTH } from "../config.js";

export class Background {
  constructor(canvas) {
    this.canvas = canvas;
    this.worldWidth = WORLD_WIDTH;
    this.layers = [];
    this.clouds = [];
    this.cloudCount = Math.round(WORLD_WIDTH / 500);
  }

  addLayer(image, speedX, speedY = 0) {
    this.layers.push(new ParallaxLayer(image, speedX, speedY, this.canvas));
  }

  addCloud(image) {
    const x = Math.random() * this.worldWidth;
    const y = Math.random() * 120 + 20;
    const speed = Math.random() * 6 + 2;

    this.clouds.push(new Cloud(image, x, y, speed));
  }

  spawnClouds(image1, image2) {
    for (let i = 0; i < this.cloudCount; i++) {
      const img = Math.random() < 0.5 ? image1 : image2;
      this.addCloud(img);
    }
  }

  update(cameraX, cameraY, dt) {
    for (let layer of this.layers) {
      layer.update(cameraX, cameraY);
    }

    for (let cloud of this.clouds) {
      cloud.update(dt, cameraX);

      if (cloud.screenX < -cloud.width * cloud.scale - 200) {
        cloud.x = cameraX + this.canvas.width + Math.random() * 600;

        cloud.scale = Math.random() * 0.3 + 0.1;
        cloud.y = Math.random() * 120 + 20;
        cloud.speed = Math.random() * 6 + 2;
      }
    }
  }

  render(ctx, camera) {
    this.layers[0].render(ctx);

    for (let cloud of this.clouds) {
      cloud.render(ctx, camera);
    }

    for (let i = 1; i < this.layers.length; i++) {
      this.layers[i].render(ctx);
    }
  }
}
