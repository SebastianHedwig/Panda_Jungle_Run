export class HudPopup {
  constructor(x, y, text = "+10") {
    this.x = x;
    this.y = y;
    this.text = text;

    this.alpha = 1;
    this.lift = 0;     // wie weit Popup nach oben fliegt
    this.scale = 1.2;  // leicht größer starten für Punch
  }

  update(dt) {
    this.lift += dt * 40;     // Geschwindigkeit nach oben
    this.alpha -= dt * 1.6;   // verblasst
    this.scale -= dt * 0.4;   // schrumpft sanft zurück

    if (this.alpha < 0) this.alpha = 0;
    if (this.scale < 1) this.scale = 1; // nicht kleiner als Basis
  }

  draw(ctx, camera) {
    if (this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    ctx.font = "1.2rem ComixLoud";
    ctx.fillStyle = "rgb(255,255,2)";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.textAlign = "center";

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y - this.lift;

    ctx.translate(screenX, screenY);
    ctx.scale(this.scale, this.scale);

    ctx.strokeText(this.text, 0, 0);
    ctx.fillText(this.text, 0, 0);

    ctx.restore();
  }
}
