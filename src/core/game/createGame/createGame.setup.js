import { Input } from "../../../engine/input/input.class.js";
import { Background } from "../../../engine/rendering/background.class.js";
import { Camera } from "../../../engine/world/camera.class.js";
import { World } from "../../world.class.js";
import { GameAudio } from "../../../game/audio/gameAudio.class.js";
import { waitForImage } from "../assets/assetLoader.js";
import { createGameAssets } from "../assets/createGameAssets.js";
import { GAME_HEIGHT, GAME_WIDTH, WORLD_WIDTH } from "../../../config/config.js";

/**
 * Sets up canvas.
 * Resolves DOM elements from the document.
 */
export function setupCanvas() {
  this.canvas = document.getElementById(this.canvasId);
  this.ctx = this.canvas.getContext("2d");
  this.canvas.width = GAME_WIDTH;
  this.canvas.height = GAME_HEIGHT;
}

/**
 * Sets up core systems.
 */
export function setupCoreSystems() {
  this.input = new Input();
  this.world = new World(this.canvas);
  this.camera = new Camera(this.canvas, WORLD_WIDTH);
  this.background = new Background(this.canvas);
}

/**
 * Sets up audio.
 */
export function setupAudio() {
  this.audio = window.__preloadedGameAudio ?? new GameAudio();
  window.__preloadedGameAudio = null;
  this.world.audio = this.audio;
}

/**
 * Returns music ready promise.
 * Used to provide music ready promise for audio playback.
 * @returns {*} Music ready promise.
 */
export function getMusicReadyPromise() {
  return (this.audio.ready ? Promise.resolve(true) : this.audio.init()).then(() => this.audio.playAudio());
}

/**
 * Starts loading render.
 */
export function startLoadingRender() {
  requestAnimationFrame(this.renderLoading);
}

/**
 * Returns assets ready.
 * Used to provide assets ready for gameplay flow.
 * Uses assets to compute the result.
 * @param {*} assets Assets.
 * @returns {*} Assets ready.
 */
export function getAssetsReady(assets) {
  return Promise.allSettled(assets.images.map(waitForImage));
}

/**
 * Starts when ready.
 * Used to support gameplay flow.
 * Uses assets, assetsReady, musicReadyPromise to perform the operation.
 * @param {*} assets Assets.
 * @param {boolean} assetsReady Assets ready.
 * @param {*} musicReadyPromise Music ready promise.
 */
export function startWhenReady(assets, assetsReady, musicReadyPromise) {
  Promise.all([assetsReady, musicReadyPromise]).then(() => this.start(assets));
}

/**
 * Initializes.
 */
export function init() {
  this.setupCanvas();
  this.setupCoreSystems();
  this.setupAudio();
  const musicReadyPromise = this.getMusicReadyPromise();
  this.startLoadingRender();
  const assets = createGameAssets();
  const assetsReady = this.getAssetsReady(assets);
  this.startWhenReady(assets, assetsReady, musicReadyPromise);
}
