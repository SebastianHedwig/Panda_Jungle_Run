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
  /**
   * Creates a new instance.
   * Updates the instance state.
   * @param {HTMLCanvasElement} canvas Target canvas.
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.worldWidth = WORLD_WIDTH;
    this.layers = [];
    this.clouds = [];
    this.cloudCount = Math.round(WORLD_WIDTH / CLOUD_COUNT_DIVISOR);
  }

  /**
   * Adds layer. If omitted, default values are used.
   * Updates the instance state.
   * @param {HTMLImageElement} image Image.
   * @param {number} speedX Speed X.
   * @param {number} [speedY] Speed Y.
   */
  addLayer(image, speedX, speedY = 0) {
    this.layers.push(new ParallaxLayer(image, speedX, speedY, this.canvas));
  }

  /**
   * Adds cloud.
   * Updates the instance state.
   * Introduces randomness into the outcome.
   * @param {HTMLImageElement} image Image.
   */
  addCloud(image) {
    const x = Math.random() * this.worldWidth;
    const y = Math.random() * CLOUD_Y_RANGE + CLOUD_Y_MIN;
    const horizontalSpeed = Math.random() * CLOUD_SPEED_RANGE + CLOUD_SPEED_MIN;

    this.clouds.push(new Cloud(image, x, y, horizontalSpeed));
  }

  /**
   * Spawns clouds.
   * Updates the instance state.
   * Introduces randomness into the outcome.
   * @param {HTMLImageElement} image1 Image 1.
   * @param {HTMLImageElement} image2 Image 2.
   */
  spawnClouds(image1, image2) {
    for (let cloudIndex = 0; cloudIndex < this.cloudCount; cloudIndex++) {
      const img = Math.random() < CLOUD_IMAGE_CHANCE ? image1 : image2;
      this.addCloud(img);
    }
  }

  /**
   * Updates layers.
   * Updates the instance state.
   * @param {number} cameraX Camera X.
   * @param {number} cameraY Camera Y.
   */
  updateLayers(cameraX, cameraY) {
    for (let layer of this.layers) {
      layer.update(cameraX, cameraY);
    }
  }

  /**
   * Should respawn cloud.
   * Spawns visual feedback effects.
   * @param {*} cloud Cloud.
   * @returns {boolean} Whether respawn cloud.
   */
  shouldRespawnCloud(cloud) {
    return cloud.screenX < -cloud.width * cloud.scale - CLOUD_OFFSCREEN_PADDING;
  }

  /**
   * Respawn cloud.
   * Updates the instance state.
   * Introduces randomness into the outcome.
   * @param {*} cloud Cloud.
   * @param {number} cameraX Camera X.
   */
  respawnCloud(cloud, cameraX) {
    cloud.x = cameraX + this.canvas.width + Math.random() * CLOUD_RESPAWN_AHEAD_RANGE;
    cloud.scale = Math.random() * CLOUD_SCALE_RANGE + CLOUD_SCALE_MIN;
    cloud.y = Math.random() * CLOUD_Y_RANGE + CLOUD_Y_MIN;
    cloud.horizontalSpeed = Math.random() * CLOUD_SPEED_RANGE + CLOUD_SPEED_MIN;
  }

  /**
   * Updates clouds.
   * Updates the instance state.
   * Spawns visual feedback effects.
   * @param {number} cameraX Camera X.
   * @param {number} dt Delta time in seconds.
   */
  updateClouds(cameraX, dt) {
    for (let cloud of this.clouds) {
      cloud.update(dt, cameraX);
      if (this.shouldRespawnCloud(cloud)) {
        this.respawnCloud(cloud, cameraX);
      }
    }
  }

  /**
   * Updates.
   * Updates the instance state.
   * @param {number} cameraX Camera X.
   * @param {number} cameraY Camera Y.
   * @param {number} dt Delta time in seconds.
   */
  update(cameraX, cameraY, dt) {
    this.updateLayers(cameraX, cameraY);
    this.updateClouds(cameraX, dt);
  }

  /**
   * Renders base layer.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   */
  renderBaseLayer(ctx) {
    if (!this.layers.length) return;
    this.layers[0].render(ctx);
  }

  /**
   * Renders clouds.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {Camera} camera Camera instance.
   */
  renderClouds(ctx, camera) {
    for (let cloud of this.clouds) {
      cloud.render(ctx, camera);
    }
  }

  /**
   * Renders parallax layers.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   */
  renderParallaxLayers(ctx) {
    for (let layerIndex = 1; layerIndex < this.layers.length; layerIndex++) {
      this.layers[layerIndex].render(ctx);
    }
  }

  /**
   * Renders.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {Camera} camera Camera instance.
   */
  render(ctx, camera) {
    this.renderBaseLayer(ctx);
    this.renderClouds(ctx, camera);
    this.renderParallaxLayers(ctx);
  }
}
