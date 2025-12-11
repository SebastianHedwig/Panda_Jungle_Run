export class HudPopup {
  constructor(text = "+10", x, y, type = "coin") {
    this.text = text;
    this.x = x;
    this.y = y;
    this.type = type; // "coin" | "damage" | "heal" | "miss" | "heart"

    this.alpha = 1;
    this.lift = 0;
    this.scale = 1.25;
    this.shake = 0;
  }

  update(dt) {
    this.lift += dt * 40;
    this.alpha -= dt * 1.4;
    this.scale -= dt * 0.3;
    if (this.scale < 1) this.scale = 1;

    if (this.type === "damage") this.shake = Math.sin(Date.now() * 0.04) * 3;

    if (this.alpha < 0) this.alpha = 0;
  }

  draw(ctx, camera) {
    if (this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    const sx = this.x - camera.x + this.shake;
    const sy = this.y - camera.y - this.lift;

    ctx.translate(sx, sy);
    ctx.scale(this.scale, this.scale);
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    const fontSize = this.type === "heart" ? "1.8rem" : "1.2rem";
    ctx.font = `${fontSize} ComixLoud`;

    if (this.type === "coin") {
      ctx.strokeStyle = "#000";
      ctx.fillStyle = "rgb(255,255,2)";
    } else if (this.type === "damage") {
      ctx.strokeStyle = "#000";
      ctx.fillStyle = "#ff4444";
    } else if (this.type === "heal") {
      ctx.strokeStyle = "#053016";
      ctx.fillStyle = "#5CFF63";
    } else if (this.type === "miss") {
      ctx.strokeStyle = "#053016";
      ctx.fillStyle = "#5CFF63";
    } else if (this.type === "heart") {
      ctx.strokeStyle = "#000";
      ctx.fillStyle = "#ff2d55";
    }

    ctx.strokeText(this.text, 0, 0);
    ctx.fillText(this.text, 0, 0);
    ctx.restore();
  }
}
