import { HudPopup } from "../effects/hudPopup.class.js";
import { CollectablesAudio } from "../audio/collectablesAudio.class.js";
import { loadImage } from "../../core/game/assets/assetLoader.js";

const collectablesAudio = new CollectablesAudio();

export const COLLECTABLE_VALUES = {
  coin: 10,
  enemy: 5,
  heart: 2,
  gun: 0,
};

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
const GUN_BULLETS_GRANT = 5;

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

  applyDimensions() {
    this.width = ITEM_SIZE;
    this.height = ITEM_SIZE;
  }

  initPickupState() {
    this.collected = false;
    this.pickupAnimating = false;
  }

  initPickupFx() {
    this.scaleFactor = 1;
    this.opacity = 1;
    this.rotationAngle = 0;
  }

  initPhysics() {
    this.dropPhysics = false;
    this.velocityX = 0;
    this.velocityY = 0;
    this.gravity = DEFAULT_GRAVITY;
    this.pickupDelay = this.type === "gun" ? GUN_PICKUP_DELAY : 0;
  }

  initAnimation() {
    this.images = [];
    this.currentImage = 0;
    this.frameTime = 0;
    this.frameDuration = DEFAULT_FRAME_DURATION;
  }

  loadAssets() {
    const list = this.getAssetList();
    if (!list) return;

    this.frameDuration = this.getFrameDuration();
    this.images = list.map(loadImage);
  }

  getAssetList() {
    return ASSET_MAP[this.type];
  }

  getFrameDuration() {
    return this.type === "heart" ? HEART_FRAME_DURATION : DEFAULT_FRAME_DURATION;
  }

  update(dt) {
    this.updateDropPhysics(dt);
    this.updatePickupDelay(dt);
    this.updateIdleAnimation(dt);
    this.updatePickupAnimation(dt);
  }

  updateDropPhysics(dt) {
    if (!this.collected && this.dropPhysics) this.applyDropPhysics(dt);
  }

  updatePickupDelay(dt) {
    if (this.pickupDelay > 0) {
      this.pickupDelay = Math.max(0, this.pickupDelay - dt);
    }
  }

  updateIdleAnimation(dt) {
    if (this.collected || this.images.length <= 1) return;
    this.advanceFrameTime(dt);
    if (this.frameTime < this.frameDuration) return;
    this.frameTime -= this.frameDuration;
    this.advanceFrameIndex();
  }

  advanceFrameTime(dt) {
    this.frameTime += dt;
  }

  advanceFrameIndex() {
    this.currentImage = (this.currentImage + 1) % this.images.length;
  }

  updatePickupAnimation(dt) {
    if (!this.pickupAnimating) return;
    this.scaleFactor += dt * PICKUP_SCALE_SPEED;
    this.opacity -= dt * PICKUP_FADE_SPEED;
    this.rotationAngle += dt * PICKUP_ROTATE_SPEED;
    if (this.opacity <= 0) this.pickupAnimating = false;
  }

  startDrop(velocityX = 0, velocityY = DROP_INITIAL_VELOCITY_Y) {
    this.dropPhysics = true;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
  }

  applyDropPhysics(dt) {
    this.applyGravity(dt);
    this.applyVelocity(dt);
    const { world, ground, previousBottom, currentBottom } = this.getDropCollisionInfo(dt);
    if (this.handlePlatformCollision(world, previousBottom, currentBottom)) return;
    this.handleGroundCollision(ground, currentBottom);
  }

  applyGravity(dt) {
    this.velocityY += this.gravity * dt;
  }

  applyVelocity(dt) {
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
  }

  getDropCollisionInfo(dt) {
    const world = this.world;
    const ground = world?.baseGround ?? world?.canvas?.height ?? FALLBACK_GROUND;
    const previousBottom = this.y + this.height - this.velocityY * dt;
    const currentBottom = this.y + this.height;
    return { world, ground, previousBottom, currentBottom };
  }

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

  handleGroundCollision(ground, currentBottom) {
    if (currentBottom < ground) return;
    this.y = ground - this.height;
    this.velocityY = 0;
    this.velocityX = 0;
    this.dropPhysics = false;
  }

  draw(ctx, camera) {
    if (!this.images.length || this.opacity <= 0) return;

    const img = this.getCurrentImage();
    if (!img) return;

    ctx.save();
    this.applyOpacity(ctx);
    const { screenX, screenY } = this.getScreenPosition(camera);
    this.drawItemImage(ctx, screenX, screenY, img);
    ctx.restore();
  }

  getCurrentImage() {
    return this.images[this.currentImage];
  }

  applyOpacity(ctx) {
    ctx.globalAlpha = this.opacity;
  }

  getScreenPosition(camera) {
    const screenX = this.x - (camera?.x || 0);
    const screenY = this.y - (camera?.y || 0);
    return { screenX, screenY };
  }

  drawItemImage(ctx, screenX, screenY, img) {
    const { centerX, centerY } = this.getCenterPosition(screenX, screenY);
    this.applyItemTransform(ctx, centerX, centerY);
    this.paintItemImage(ctx, img);
  }

  getCenterPosition(screenX, screenY) {
    const centerX = screenX + this.width / 2;
    const centerY = screenY + this.height / 2;
    return { centerX, centerY };
  }

  applyItemTransform(ctx, centerX, centerY) {
    ctx.translate(centerX, centerY);
    ctx.scale(this.scaleFactor, this.scaleFactor);
    ctx.rotate(this.rotationAngle);
  }

  paintItemImage(ctx, img) {
    ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
  }

  isColliding(player) {
    if (this.pickupDelay > 0) return false;

    const itemLeft = this.x;
    const itemRight = this.x + this.width;
    const itemTop = this.y;
    const itemBottom = this.y + this.height;

    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const playerTop = player.y;
    const playerBottom = player.y + player.height;

    return !(
      playerLeft > itemRight ||
      playerRight < itemLeft ||
      playerTop > itemBottom ||
      playerBottom < itemTop
    );
  }

  collect(player) {
    if (this.collected) return;
    this.startPickupAnimation();
    const itemX = this.x;
    const itemY = this.y;

    this.handleCollectByType(player, itemX, itemY);
    this.resetPickupFx();
  }

  startPickupAnimation() {
    this.collected = true;
    this.pickupAnimating = true;
  }

  handleCollectByType(player, itemX, itemY) {
    if (this.type === "coin") this.collectCoin(player, itemX, itemY);
    if (this.type === "heart") this.collectHeart(player, itemX, itemY);
    if (this.type === "gun") this.collectGun(player, itemX, itemY);
  }

  collectCoin(player, itemX, itemY) {
    collectablesAudio.playCoin();
    player.addCoins(COLLECTABLE_VALUES.coin);
    player.world.hudPopups.push(new HudPopup(`+${COLLECTABLE_VALUES.coin}`, itemX, itemY, "coin"));
  }

  collectHeart(player, itemX, itemY) {
    collectablesAudio.playHeart();
    player.heal(COLLECTABLE_VALUES.heart);
    player.world.hudPopups.push(new HudPopup("❤️", itemX, itemY, "heart"));
  }

  collectGun(player, itemX, itemY) {
    collectablesAudio.playWeapon();
    player.addBullets?.(GUN_BULLETS_GRANT);
    player.world.hudPopups.push(new HudPopup(`+${GUN_BULLETS_GRANT}`, itemX, itemY, "gun"));
  }

  resetPickupFx() {
    this.scaleFactor = 1;
    this.opacity = 1;
    this.rotationAngle = 0;
  }
}
