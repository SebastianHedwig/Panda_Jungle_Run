export class Hud {
  constructor({ coinImage, gunImage, bossName = "LUPO" } = {}) {
    this.coinImage = coinImage || null;
    this.gunImage = gunImage || null;
    this.bossName = bossName;

    this.displayCoinValue = 0;
    this.heartPulseTime = 0;
  }

  update(dt, player) {
    if (!player) return;
    this.displayCoinValue += (player.coins - this.displayCoinValue) * dt * 10;
    this.heartPulseTime += dt;

    if (player.hudPulse > 0) player.hudPulse = Math.max(0, player.hudPulse - dt * 4);
    if (player.healthPulse > 0) {
      player.healthPulse = Math.max(0, player.healthPulse - dt * 2);
    }
  }

  render(ctx, canvas, camera, player, boss) {
    if (!ctx || !canvas || !camera || !player) return;
    this.drawHearts(ctx, player);
    this.drawCoins(ctx, canvas, player);
    this.drawBullets(ctx, canvas, player);
    this.drawBossIndicator(ctx, canvas, camera, boss);
  }

  drawHearts(ctx, player) {
    const size = 32;
    const startX = 30;
    const y = 5;
    const spacing = 10;
    const states = player.heartStates;
    const lastFilled = [...states]
      .map((s, i) => ({ s, i }))
      .filter((h) => h.s > 0)
      .pop()?.i;

    states.forEach((state, i) => {
      const x = startX + i * (size + spacing);

      ctx.save();
      ctx.translate(x + size / 2, y + size / 2);

      let scale = 1;
      if (i === lastFilled) {
        const baseAmp = 0.07;
        const baseWave = 0.5 + 0.5 * Math.sin(this.heartPulseTime * 6);
        scale += baseAmp * baseWave;
      }
      if (player.healthPulse > 0) {
        const hitAmp = 0.18 * player.healthPulse;
        const hitWave = 0.5 + 0.5 * Math.sin(this.heartPulseTime * 14);
        scale += hitAmp * hitWave;
      }
      ctx.scale(scale, scale);

      this.drawHeartShape(ctx, state, size);

      ctx.restore();
    });
  }

  drawHeartShape(ctx, state, size) {
    ctx.beginPath();
    const w = size,
      h = size;
    ctx.moveTo(0, h * 0.35);
    ctx.bezierCurveTo(-w * 0.6, -h * 0.1, -w * 0.6, h * 0.6, 0, h);
    ctx.bezierCurveTo(w * 0.6, h * 0.6, w * 0.6, -h * 0.1, 0, h * 0.35);

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000";

    if (state === 2) ctx.fillStyle = "rgba(182, 0, 0, 1)";
    else if (state === 1) ctx.fillStyle = "rgba(192, 69, 69, 0.6)";
    else ctx.fillStyle = "rgba(58, 58, 58, 0.2)";

    ctx.fill();
    ctx.stroke();
  }

  drawCoins(ctx, canvas, player) {
    if (!this.coinImage || this.coinImage.naturalWidth === 0) return;
    const pad = 20;
    const size = 40;
    const x = canvas.width - size - pad - 80;
    const y = pad;

    ctx.drawImage(this.coinImage, x, y, size, size);

    const scale = 1 + player.hudPulse * 0.3;
    const text = Math.round(this.displayCoinValue).toString();

    ctx.save();
    ctx.translate(x + size + 35, y + 25);
    ctx.scale(scale, scale);

    ctx.font = "1.2rem ComixLoud";
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "rgba(255,255,2,0.9)";
    ctx.lineWidth = 3;
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);

    ctx.restore();
  }

  drawBullets(ctx, canvas, player) {
    if (!this.gunImage || this.gunImage.naturalWidth === 0) return;
    const pad = 20;
    const size = 40;
    const coinSize = 40;
    const coinX = canvas.width - coinSize - pad - 80;
    const coinY = pad;
    const x = coinX - 80 - size;
    const y = coinY;

    ctx.drawImage(this.gunImage, x, y, size, size);

    const scale = 1 + (player.gunPulse || 0) * 0.3;
    const text = Math.max(0, Math.floor(player.bulletAmmo)).toString();

    ctx.save();
    ctx.translate(x + size + 30, y + 25);
    ctx.scale(scale, scale);

    ctx.font = "1.2rem ComixLoud";
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "rgba(235, 145, 0, 1)";
    ctx.lineWidth = 3;
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);

    ctx.restore();
  }

  drawBossIndicator(ctx, canvas, camera, boss) {
    if (!boss || boss.remove || (boss.isDead && boss.health <= 0)) {
      return;
    }

    const margin = 16;
    const centerX = boss.x + boss.width / 2 - camera.x;
    const topY = boss.y - camera.y;
    const barW = boss.width * 0.8;
    const barH = 12;

    let drawX = centerX;
    let drawY = topY - 30;

    const offLeft = drawX < margin;
    const offRight = drawX > canvas.width - margin;
    const offTop = drawY < margin;
    const offBottom = drawY > canvas.height - margin;
    const isOffscreen = offLeft || offRight || offTop || offBottom;

    if (offLeft) drawX = margin;
    if (offRight) drawX = canvas.width - margin;
    if (offTop) drawY = margin;
    if (offBottom) drawY = canvas.height - margin;

    const barY = drawY;

    ctx.save();
    if (!isOffscreen) {
      ctx.restore();
      return;
    }

    if (isOffscreen) {
      const arrowSize = 20;
      const arrowY = barY + barH + 9.25;
      const textY = arrowY;
      const arrowColor = "rgba(0, 0, 0, 0.6)";
      ctx.fillStyle = arrowColor;

      if (offLeft || offRight) {
        const arrowX = offLeft ? margin : canvas.width - margin;
        const textX = offLeft ? arrowX + arrowSize + 16 : arrowX - arrowSize - 16;
        const angle = offLeft ? Math.PI : 0;

        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-arrowSize, -arrowSize / 1.5);
        ctx.lineTo(-arrowSize, arrowSize / 1.5);
        ctx.lineTo(arrowSize, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = "rgba(143, 0, 0, 0.9)";
        ctx.font = "1rem ComixLoud, sans-serif";
        ctx.textAlign = offLeft ? "left" : "right";
        ctx.textBaseline = "middle";
        ctx.fillText(this.bossName, textX, textY);
      } else {
        const angle = offTop ? -Math.PI / 2 : Math.PI / 2;
        ctx.save();
        ctx.translate(drawX, arrowY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-arrowSize, -arrowSize / 1.5);
        ctx.lineTo(-arrowSize, arrowSize / 1.5);
        ctx.lineTo(arrowSize, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = "rgba(143, 0, 0, 0.9)";
        ctx.font = "1rem ComixLoud, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.bossName, drawX, textY);
      }
    }

    ctx.restore();
  }
}
