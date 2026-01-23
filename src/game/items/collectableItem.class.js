import { HudPopup } from "../effects/hudPopup.class.js";
import { CollectablesAudio } from "../audio/collectablesAudio.class.js";

const collectablesAudio = new CollectablesAudio();

export const COLLECTABLE_VALUES = {
  coin: 10,
  enemy: 5,
  heart: 2,
  gun: 0,
};

export class CollectableItem {
  constructor(x, y, type = "coin", world = null) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.world = world;

    this.width = 50;
    this.height = 50;

    this.collected = false;
    this.pickupAnimating = false;

    this.scaleFactor = 1;
    this.opacity = 1;
    this.rotationAngle = 0;

    this.dropPhysics = false;
    this.velocityX = 0;
    this.velocityY = 0;
    this.gravity = 1800;
    this.pickupDelay = this.type === "gun" ? 1 : 0;

    this.images = [];
    this.currentImage = 0;
    this.frameTime = 0;
    this.frameDuration = 0.12;

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
        (_, i) =>
          `assets/img/PowerUps/heart/frame-${String(i + 1).padStart(2, "0")}.gif`
      ),
      gun: ["assets/img/Character/Spriter_files/gun.png"],
    };

    const list = assetMap[this.type];
    if (!list) return;

    // ---- INDIVIDUAL ANIMATION SPEED ----
    this.frameDuration = this.type === "heart" ? 0.06 : 0.12;

    list.forEach((path) => {
      const img = new Image();
      img.src = path;
      this.images.push(img);
    });
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
      this.scaleFactor += dt * 4;
      this.opacity -= dt * 3;
      this.rotationAngle += dt * 6;

      if (this.opacity <= 0) {
        this.pickupAnimating = false;
      }
    }
  }

  /** ---------- DROP ARC ---------- */
  startDrop(velocityX = 0, velocityY = -300) {
    this.dropPhysics = true;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
  }

  applyDropPhysics(dt) {
    this.velocityY += this.gravity * dt;
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    const world = this.world;
    const ground = world?.baseGround ?? world?.canvas?.height ?? 1000;
    const prevBottom = this.y + this.height - this.velocityY * dt;
    const currBottom = this.y + this.height;

    if (world?.platforms?.length) {
      for (const platform of world.platforms) {
        if (!platform.supportsLanding) continue;
        const overlapsX = this.x + this.width > platform.left && this.x < platform.right;
        if (
          overlapsX &&
          this.velocityY > 0 &&
          prevBottom <= platform.top &&
          currBottom >= platform.top
        ) {
          this.y = platform.top - this.height;
          this.velocityY = 0;
          this.velocityX *= 0.4;
          this.dropPhysics = false;
          return;
        }
      }
    }

    if (currBottom >= ground) {
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
      player.addCoins(10);
      player.world.hudPopups.push(new HudPopup("+10", itemX, itemY, "coin"));
    }

    if (this.type === "heart") {
      collectablesAudio.playHeart();
      player.heal(2);
      player.world.hudPopups.push(new HudPopup("❤️", itemX, itemY, "heart"));
    }

    if (this.type === "gun") {
      collectablesAudio.playWeapon();
      player.addBullets?.(5);
      player.world.hudPopups.push(new HudPopup("+5", itemX, itemY, "gun"));
    }

    this.scaleFactor = 1;
    this.opacity = 1;
    this.rotationAngle = 0;
  }
}
