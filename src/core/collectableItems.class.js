export class CollectableItem {
  constructor(x, y, type = "coin") {
    this.x = x;
    this.y = y;
    this.type = type;

    this.width = 50;
    this.height = 50;

    this.collected = false;

    /** ---- ANIMATION STATE ---- */
    this.images = [];
    this.currentImage = 0;
    this.frameTime = 0;
    this.frameDuration = 0.15; // seconds per frame

    this.loadAssets();
  }

  /** ---------- LOAD SPRITES ---------- */
  loadAssets() {
    // weitere Types hier ergänzen
    const assetMap = {
      coin: [
        "assets/img/Coin/Coin_0000000.png",
        "assets/img/Coin/Coin_0000001.png",
        "assets/img/Coin/Coin_0000002.png",
        "assets/img/Coin/Coin_0000003.png"
      ]
    };

    assetMap[this.type].forEach(path => {
      const img = new Image();
      img.src = path;
      this.images.push(img);
    });
  }

  /** ---------- UPDATE ANIMATION ---------- */
  update(dt) {
    if (this.collected || this.images.length <= 1) return;

    this.frameTime += dt;
    if (this.frameTime >= this.frameDuration) {
      this.frameTime -= this.frameDuration;
      this.currentImage = (this.currentImage + 1) % this.images.length;
    }
  }

  /** ---------- RENDER ---------- */
  draw(ctx, camera) {
    if (this.collected) return;
    const img = this.images[this.currentImage];
    if (!img) return;

    ctx.drawImage(
      img,
      this.x - (camera?.x || 0),
      this.y - (camera?.y || 0),
      this.width,
      this.height
    );
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

  /** ---------- PICKUP ACTION ---------- */
  collect(player) {
    if (this.collected) return;

    this.collected = true;

    // später: Sound, Shine, Partikel, Score
    player.coins = (player.coins || 0) + 1;
  }
}
