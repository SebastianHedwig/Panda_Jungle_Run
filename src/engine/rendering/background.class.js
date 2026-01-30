import { ParallaxLayer } from "./parallaxLayer.class.js";
import { Cloud } from "./cloud.class.js";
import { WORLD_WIDTH } from "../../config/config.js";

const CLOUD_COUNT_DIVISOR = 500;
const CLOUD_Y_MIN = 20;
const CLOUD_Y_RANGE = 120;
const CLOUD_SPEED_MIN = 2;
const CLOUD_SPEED_RANGE = 6; // results in max 8
const CLOUD_OFFSCREEN_PADDING = 200;
const CLOUD_RESPAWN_AHEAD_RANGE = 600;
const CLOUD_IMAGE_CHANCE = 0.5;
const CLOUD_SCALE_MIN = 0.1;
const CLOUD_SCALE_RANGE = 0.3; // results in max 0.4

export class Background {
  constructor(canvas) {
    this.canvas = canvas;
    this.worldWidth = WORLD_WIDTH;
    this.layers = [];
    this.clouds = [];
    this.cloudCount = Math.round(WORLD_WIDTH / CLOUD_COUNT_DIVISOR);
  }

  addLayer(image, speedX, speedY = 0) {
    this.layers.push(new ParallaxLayer(image, speedX, speedY, this.canvas));
  }

  addCloud(image) {
    const x = Math.random() * this.worldWidth;
    const y = Math.random() * CLOUD_Y_RANGE + CLOUD_Y_MIN;
    const horizontalSpeed = Math.random() * CLOUD_SPEED_RANGE + CLOUD_SPEED_MIN;

    this.clouds.push(new Cloud(image, x, y, horizontalSpeed));
  }

  spawnClouds(image1, image2) {
    for (let cloudIndex = 0; cloudIndex < this.cloudCount; cloudIndex++) {
      const img = Math.random() < CLOUD_IMAGE_CHANCE ? image1 : image2;
      this.addCloud(img);
    }
  }

  update(cameraX, cameraY, dt) {
    for (let layer of this.layers) {
      layer.update(cameraX, cameraY);
    }

    for (let cloud of this.clouds) {
      cloud.update(dt, cameraX);

      if (cloud.screenX < -cloud.width * cloud.scale - CLOUD_OFFSCREEN_PADDING) {
        cloud.x = cameraX + this.canvas.width + Math.random() * CLOUD_RESPAWN_AHEAD_RANGE;

        cloud.scale = Math.random() * CLOUD_SCALE_RANGE + CLOUD_SCALE_MIN;
        cloud.y = Math.random() * CLOUD_Y_RANGE + CLOUD_Y_MIN;
        cloud.horizontalSpeed = Math.random() * CLOUD_SPEED_RANGE + CLOUD_SPEED_MIN;
      }
    }
  }

  render(ctx, camera) {
    this.layers[0].render(ctx);

    for (let cloud of this.clouds) {
      cloud.render(ctx, camera);
    }

    for (let layerIndex = 1; layerIndex < this.layers.length; layerIndex++) {
      this.layers[layerIndex].render(ctx);
    }
  }
}
