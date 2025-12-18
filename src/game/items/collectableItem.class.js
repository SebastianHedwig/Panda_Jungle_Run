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

    this.scale = 1;
    this.alpha = 1;
    this.rotation = 0;

    this.dropPhysics = false;
    this.vx = 0;
    this.vy = 0;
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
          `assets/img/PowerUps/heart/frame-${String(i + 1).padStart(
            2,
            "0"
          )}.gif`
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
      this.scale += dt * 4;
      this.alpha -= dt * 3;
      this.rotation += dt * 6;

      if (this.alpha <= 0) {
        this.pickupAnimating = false;
      }
    }
  }

  /** ---------- DROP ARC ---------- */
  startDrop(vx = 0, vy = -300) {
    this.dropPhysics = true;
    this.vx = vx;
    this.vy = vy;
  }

  applyDropPhysics(dt) {
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const world = this.world;
    const ground = world?.baseGround ?? world?.canvas?.height ?? 1000;
    const prevBottom = this.y + this.height - this.vy * dt;
    const currBottom = this.y + this.height;

    if (world?.platforms?.length) {
      for (const p of world.platforms) {
        if (!p.supportsLanding) continue;
        const overlapsX = this.x + this.width > p.left && this.x < p.right;
        if (
          overlapsX &&
          this.vy > 0 &&
          prevBottom <= p.top &&
          currBottom >= p.top
        ) {
          this.y = p.top - this.height;
          this.vy = 0;
          this.vx *= 0.4;
          this.dropPhysics = false;
          return;
        }
      }
    }

    if (currBottom >= ground) {
      this.y = ground - this.height;
      this.vy = 0;
      this.vx = 0;
      this.dropPhysics = false;
    }
  }

  /** ---------- RENDER ---------- */
  draw(ctx, camera) {
    if (!this.images.length || this.alpha <= 0) return;

    const img = this.images[this.currentImage];
    if (!img) return;

    const screenX = this.x - (camera?.x || 0);
    const screenY = this.y - (camera?.y || 0);

    ctx.save();
    ctx.globalAlpha = this.alpha;

    const cx = screenX + this.width / 2;
    const cy = screenY + this.height / 2;

    ctx.translate(cx, cy);
    ctx.scale(this.scale, this.scale);
    ctx.rotate(this.rotation);

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
    return !(
      player.x > this.x + this.width ||
      player.x + player.width < this.x ||
      player.y > this.y + this.height ||
      player.y + player.height < this.y
    );
  }

  /** ---------- COLLECT ACTION ---------- */
  collect(player) {
    if (this.collected) return;

    this.collected = true;
    this.pickupAnimating = true;

    if (this.type === "coin") {
      collectablesAudio.playCoin();
      player.addCoins(10);
      player.world.hudPopups.push(new HudPopup("+10", this.x, this.y, "coin"));
    }

    if (this.type === "heart") {
      collectablesAudio.playHeart();
      player.heal(2);
      player.world.hudPopups.push(new HudPopup("❤️", this.x, this.y, "heart"));
    }

    if (this.type === "gun") {
      collectablesAudio.playWeapon();
      player.addBullets?.(5);
      player.world.hudPopups.push(new HudPopup("+5", this.x, this.y, "gun"));
    }

    this.scale = 1;
    this.alpha = 1;
    this.rotation = 0;
  }
}
