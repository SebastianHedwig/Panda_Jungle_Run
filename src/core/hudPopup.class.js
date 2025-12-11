const POPUP_STYLES = {
  coin: { stroke: "#000", fill: "rgb(255,255,2)", fontSize: "1.2rem" },
  damage: { stroke: "#000", fill: "#ff4444", fontSize: "1.2rem" },
  heal: { stroke: "#053016", fill: "#5CFF63", fontSize: "1.2rem" },
  miss: { stroke: "#053016", fill: "#5CFF63", fontSize: "1.2rem" },
  heart: { stroke: "#000", fill: "#ff2d55", fontSize: "1.9rem" },
  gun: { stroke: "#000", fill: "#fff", fontSize: "1.2rem" },
};

export class HudPopup {
  constructor(text = "+10", x, y, type = "coin") {
    this.text = text;
    this.x = x;
    this.y = y;
    this.type = type; // "coin" | "damage" | "heal" | "miss" | "heart" | "gun"

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

    if (this.type === "damage") {
      this.shake = Math.sin(Date.now() * 0.04) * 3;
    }

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

    const style = POPUP_STYLES[this.type] ?? POPUP_STYLES.coin;
    ctx.font = `${style.fontSize} ComixLoud`;
    ctx.strokeStyle = style.stroke;
    ctx.fillStyle = style.fill;

    ctx.strokeText(this.text, 0, 0);
    ctx.fillText(this.text, 0, 0);
    ctx.restore();
  }
}
