import { loadImage } from "../../core/game/assets/assetLoader.js";
import { applyItemTransform, applyOpacity, draw, drawItemImage, getCenterPosition, getCurrentImage, getScreenPosition, paintItemImage } from "./collectableItem.render.js";
import { collect, collectCoin, collectGun, collectHeart, handleCollectByType, isColliding, resetPickupFx, startPickupAnimation } from "./collectableItem.collect.js";

export { COLLECTABLE_VALUES } from "./collectableItem.collect.js";

const ITEM_SIZE = 50;
const DEFAULT_GRAVITY = 1800;
const GUN_PICKUP_DELAY = 1;
const DROP_INITIAL_VELOCITY_Y = -300;
const HEART_FRAME_DURATION = 0.06;
const DEFAULT_FRAME_DURATION = 0.12;
const PICKUP_SCALE_SPEED = 4;
const PICKUP_FADE_SPEED = 3;
const PICKUP_ROTATE_SPEED = 6;
const DROP_DAMPING = 0.4;
const FALLBACK_GROUND = 1000;

const ASSET_MAP = {
  coin: [
    "assets/img/Coin/Coin_0000000.png",
    "assets/img/Coin/Coin_0000001.png",
    "assets/img/Coin/Coin_0000002.png",
    "assets/img/Coin/Coin_0000003.png",
  ],
  heart: Array.from(
    { length: 49 },
    (_, i) => `assets/img/PowerUps/heart/frame-${String(i + 1).padStart(2, "0")}.gif`
  ),
  gun: ["assets/img/Character/Spriter_files/gun.png"],
};

export class CollectableItem {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {string} [type] Type.
   * @param {import("../../core/world.class.js").World} [world] World instance.
   */
  constructor(x, y, type = "coin", world = null) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.world = world;
    this.applyDimensions();
    this.initPickupState();
    this.initPickupFx();
    this.initPhysics();
    this.initAnimation();
    this.loadAssets();
  }

  /**
   * Applies dimensions.
   * Updates the instance state.
   */
  applyDimensions() {
    this.width = ITEM_SIZE;
    this.height = ITEM_SIZE;
  }

  /**
   * Initializes pickup state.
   * Updates the instance state.
   */
  initPickupState() {
    this.collected = false;
    this.pickupAnimating = false;
  }

  /**
   * Initializes pickup fx.
   * Updates the instance state.
   */
  initPickupFx() {
    this.scaleFactor = 1;
    this.opacity = 1;
    this.rotationAngle = 0;
  }

  /**
   * Initializes physics.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   */
  initPhysics() {
    this.dropPhysics = false;
    this.velocityX = 0;
    this.velocityY = 0;
    this.gravity = DEFAULT_GRAVITY;
    this.pickupDelay = this.type === "gun" ? GUN_PICKUP_DELAY : 0;
  }

  /**
   * Initializes animation.
   * Advances animation state and sprites.
   * Updates the instance state.
   */
  initAnimation() {
    this.images = [];
    this.currentImage = 0;
    this.frameTime = 0;
    this.frameDuration = DEFAULT_FRAME_DURATION;
  }

  /**
   * Loads assets.
   * Updates the instance state.
   */
  loadAssets() {
    const list = this.getAssetList();
    if (!list) return;

    this.frameDuration = this.getFrameDuration();
    this.images = list.map(loadImage);
  }

  /**
   * Returns asset list.
   * Updates the instance state.
   * @returns {*} Asset list.
   */
  getAssetList() {
    return ASSET_MAP[this.type];
  }

  /**
   * Returns frame duration.
   * Updates the instance state.
   * @returns {*} Frame duration.
   */
  getFrameDuration() {
    return this.type === "heart" ? HEART_FRAME_DURATION : DEFAULT_FRAME_DURATION;
  }

  /**
   * Updates.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  update(dt) {
    this.updateDropPhysics(dt);
    this.updatePickupDelay(dt);
    this.updateIdleAnimation(dt);
    this.updatePickupAnimation(dt);
  }

  /**
   * Updates drop physics.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  updateDropPhysics(dt) {
    if (!this.collected && this.dropPhysics) this.applyDropPhysics(dt);
  }

  /**
   * Updates pickup delay.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  updatePickupDelay(dt) {
    if (this.pickupDelay > 0) {
      this.pickupDelay = Math.max(0, this.pickupDelay - dt);
    }
  }

  /**
   * Updates idle animation.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  updateIdleAnimation(dt) {
    if (this.collected || this.images.length <= 1) return;
    this.advanceFrameTime(dt);
    if (this.frameTime < this.frameDuration) return;
    this.frameTime -= this.frameDuration;
    this.advanceFrameIndex();
  }

  /**
   * Advances frame time.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  advanceFrameTime(dt) {
    this.frameTime += dt;
  }

  /**
   * Advances frame index.
   * Updates the instance state.
   */
  advanceFrameIndex() {
    this.currentImage = (this.currentImage + 1) % this.images.length;
  }

  /**
   * Updates pickup animation.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  updatePickupAnimation(dt) {
    if (!this.pickupAnimating) return;
    this.scaleFactor += dt * PICKUP_SCALE_SPEED;
    this.opacity -= dt * PICKUP_FADE_SPEED;
    this.rotationAngle += dt * PICKUP_ROTATE_SPEED;
    if (this.opacity <= 0) this.pickupAnimating = false;
  }

  /**
   * Starts drop. If omitted, default values are used.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   * @param {number} [velocityX] Velocity X.
   * @param {number} [velocityY] Velocity Y.
   */
  startDrop(velocityX = 0, velocityY = DROP_INITIAL_VELOCITY_Y) {
    this.dropPhysics = true;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
  }

  /**
   * Applies drop physics.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  applyDropPhysics(dt) {
    this.applyGravity(dt);
    this.applyVelocity(dt);
    const { world, ground, previousBottom, currentBottom } = this.getDropCollisionInfo(dt);
    if (this.handlePlatformCollision(world, previousBottom, currentBottom)) return;
    this.handleGroundCollision(ground, currentBottom);
  }

  /**
   * Applies gravity.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  applyGravity(dt) {
    this.velocityY += this.gravity * dt;
  }

  /**
   * Applies velocity.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  applyVelocity(dt) {
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
  }

  /**
   * Returns drop collision info.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   * @returns {Object} Drop collision info.
   */
  getDropCollisionInfo(dt) {
    const world = this.world;
    const ground = world?.baseGround ?? world?.canvas?.height ?? FALLBACK_GROUND;
    const previousBottom = this.y + this.height - this.velocityY * dt;
    const currentBottom = this.y + this.height;
    return { world, ground, previousBottom, currentBottom };
  }

  /**
   * Handles platform collision.
   * Applies physics updates like gravity and velocity.
   * Performs hitbox or collision checks.
   * @param {import("../../core/world.class.js").World} world World instance.
   * @param {number} previousBottom Previous bottom.
   * @param {number} currentBottom Current bottom.
   * @returns {*} Result value.
   */
  handlePlatformCollision(world, previousBottom, currentBottom) {
    if (!world?.platforms?.length) return false;
    for (const platform of world.platforms) {
      if (!platform.supportsLanding) continue;
      const overlapsX = this.x + this.width > platform.left && this.x < platform.right;
      if (overlapsX && this.velocityY > 0 && previousBottom <= platform.top && currentBottom >= platform.top) {
        this.y = platform.top - this.height;
        this.velocityY = 0;
        this.velocityX *= DROP_DAMPING;
        this.dropPhysics = false;
        return true;
      }
    }
    return false;
  }

  /**
   * Handles ground collision.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   * @param {*} ground Ground.
   * @param {number} currentBottom Current bottom.
   */
  handleGroundCollision(ground, currentBottom) {
    if (currentBottom < ground) return;
    this.y = ground - this.height;
    this.velocityY = 0;
    this.velocityX = 0;
    this.dropPhysics = false;
  }

}

Object.assign(CollectableItem.prototype, {
  draw,
  getCurrentImage,
  applyOpacity,
  getScreenPosition,
  drawItemImage,
  getCenterPosition,
  applyItemTransform,
  paintItemImage,
  isColliding,
  collect,
  startPickupAnimation,
  handleCollectByType,
  collectCoin,
  collectHeart,
  collectGun,
  resetPickupFx,
});
