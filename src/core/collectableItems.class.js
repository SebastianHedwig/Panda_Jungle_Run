import { HudPopup } from "./hudPopup.class.js";

export const COLLECTABLE_VALUES = {
  coin: 10,
  enemy: 5,
  heart: 2,
};

export class CollectableItem {
  constructor(x, y, type = "coin") {
    this.x = x;
    this.y = y;
    this.type = type;

    this.width = 50;
    this.height = 50;

    this.collected = false;
    this.pickupAnimating = false;

    this.scale = 1;
    this.alpha = 1;
    this.rotation = 0;

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
        (_, i) => `assets/img/PowerUps/heart/frame-${String(i + 1).padStart(2, "0")}.gif`
        ),
    };

    const list = assetMap[this.type];
    if (!list) return;

    // ---- INDIVIDUAL ANIMATION SPEED ----
    if (this.type === "heart") {
        this.frameDuration = 0.06;
    } else {
        this.frameDuration = 0.12;
    }

    list.forEach((path) => {
        const img = new Image();
        img.src = path;
        this.images.push(img);
    });
    }


  /** ---------- UPDATE ANIMATION ---------- */
  update(dt) {
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
        player.addCoins(10);
        player.world.hudPopups.push(new HudPopup("+10", this.x, this.y, "coin"));
    }

    if (this.type === "heart") {
        player.heal(1); // halbes Herz
    }

    this.scale = 1; this.alpha = 1; this.rotation = 0;
  }

}
