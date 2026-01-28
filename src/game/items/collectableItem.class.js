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

export class CollectableItem {
  constructor(x, y, type = "coin", world = null) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.world = world;

    this.width = ITEM_SIZE;
    this.height = ITEM_SIZE;

    this.collected = false;
    this.pickupAnimating = false;

    this.scaleFactor = 1;
    this.opacity = 1;
    this.rotationAngle = 0;

    this.dropPhysics = false;
    this.velocityX = 0;
    this.velocityY = 0;
    this.gravity = DEFAULT_GRAVITY;
    this.pickupDelay = this.type === "gun" ? GUN_PICKUP_DELAY : 0;

    this.images = [];
    this.currentImage = 0;
    this.frameTime = 0;
    this.frameDuration = DEFAULT_FRAME_DURATION;

    this.loadAssets();
  }

  /** ---------- LOAD SPRITES ---------- */
  loadAssets() {
    const assetMap = {
      coin: [
        "assets/img/Coin/Coin_0000000.png",
        "assets/img/Coin/Coin_0000001.png",
        "assets/img/Coin/Coin_0000002.png",
        "assets/img/Coin/Coin_0000003.png",
      ],
      heart: Array.from(
        { length: 49 },
        (_, i) => `assets/img/PowerUps/heart/frame-${String(i + 1).padStart(2, "0")}.gif`),
      gun: ["assets/img/Character/Spriter_files/gun.png"],
    };

    const list = assetMap[this.type];
    if (!list) return;

    // ---- INDIVIDUAL ANIMATION SPEED ----
    this.frameDuration = this.type === "heart" ? HEART_FRAME_DURATION : DEFAULT_FRAME_DURATION;

    this.images = list.map(loadImage);
  }

  /** ---------- UPDATE ANIMATION ---------- */
  update(dt) {
    if (!this.collected && this.dropPhysics) {
      this.applyDropPhysics(dt);
    }
    if (this.pickupDelay > 0) {
      this.pickupDelay = Math.max(0, this.pickupDelay - dt);
    }

    // Idle Coin Spin
    if (!this.collected && this.images.length > 1) {
      this.frameTime += dt;
      if (this.frameTime >= this.frameDuration) {
        this.frameTime -= this.frameDuration;
        this.currentImage = (this.currentImage + 1) % this.images.length;
      }
    }

    // Pickup FX
    if (this.pickupAnimating) {
      this.scaleFactor += dt * PICKUP_SCALE_SPEED;
      this.opacity -= dt * PICKUP_FADE_SPEED;
      this.rotationAngle += dt * PICKUP_ROTATE_SPEED;

      if (this.opacity <= 0) {
        this.pickupAnimating = false;
      }
    }
  }

  /** ---------- DROP ARC ---------- */
  startDrop(velocityX = 0, velocityY = DROP_INITIAL_VELOCITY_Y) {
    this.dropPhysics = true;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
  }

  applyDropPhysics(dt) {
    this.velocityY += this.gravity * dt;
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    const world = this.world;
    const ground = world?.baseGround ?? world?.canvas?.height ?? FALLBACK_GROUND;
    const previousBottom = this.y + this.height - this.velocityY * dt;
    const currentBottom = this.y + this.height;

    if (world?.platforms?.length) {
      for (const platform of world.platforms) {
        if (!platform.supportsLanding) continue;
        const overlapsX = this.x + this.width > platform.left && this.x < platform.right;
        if (
          overlapsX &&
          this.velocityY > 0 &&
          previousBottom <= platform.top &&
          currentBottom >= platform.top
        ) {
          this.y = platform.top - this.height;
          this.velocityY = 0;
          this.velocityX *= DROP_DAMPING;
          this.dropPhysics = false;
          return;
        }
      }
    }

    if (currentBottom >= ground) {
      this.y = ground - this.height;
      this.velocityY = 0;
      this.velocityX = 0;
      this.dropPhysics = false;
    }
  }

  /** ---------- RENDER ---------- */
  draw(ctx, camera) {
    if (!this.images.length || this.opacity <= 0) return;

    const img = this.images[this.currentImage];
    if (!img) return;

    const screenX = this.x - (camera?.x || 0);
    const screenY = this.y - (camera?.y || 0);

    ctx.save();
    ctx.globalAlpha = this.opacity;

    const centerX = screenX + this.width / 2;
    const centerY = screenY + this.height / 2;

    ctx.translate(centerX, centerY);
    ctx.scale(this.scaleFactor, this.scaleFactor);
    ctx.rotate(this.rotationAngle);

    ctx.drawImage(
      img,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );

    ctx.restore();
  }

  /** ---------- COLLISION CHECK ---------- */
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

  /** ---------- COLLECT ACTION ---------- */
  collect(player) {
    if (this.collected) return;

    this.collected = true;
    this.pickupAnimating = true;
    const itemX = this.x;
    const itemY = this.y;

    if (this.type === "coin") {
      collectablesAudio.playCoin();
      player.addCoins(COLLECTABLE_VALUES.coin);
      player.world.hudPopups.push(new HudPopup(`+${COLLECTABLE_VALUES.coin}`, itemX, itemY, "coin"));
    }

    if (this.type === "heart") {
      collectablesAudio.playHeart();
      player.heal(COLLECTABLE_VALUES.heart);
      player.world.hudPopups.push(new HudPopup("❤️", itemX, itemY, "heart"));
    }

    if (this.type === "gun") {
      collectablesAudio.playWeapon();
      player.addBullets?.(GUN_BULLETS_GRANT);
      player.world.hudPopups.push(new HudPopup(`+${GUN_BULLETS_GRANT}`, itemX, itemY, "gun"));
    }

    this.scaleFactor = 1;
    this.opacity = 1;
    this.rotationAngle = 0;
  }
}
