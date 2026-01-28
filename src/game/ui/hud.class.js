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
    const coinLerpSpeed = 10;
    const hudPulseDecaySpeed = 4;
    const healthPulseDecaySpeed = 2;

    this.displayCoinValue += (player.coins - this.displayCoinValue) * dt * coinLerpSpeed;
    this.heartPulseTime += dt;

    if (player.hudPulse > 0)
      player.hudPulse = Math.max(0, player.hudPulse - dt * hudPulseDecaySpeed);
    if (player.healthPulse > 0) {
      player.healthPulse = Math.max(0, player.healthPulse - dt * healthPulseDecaySpeed);
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
    const heartSize = 32;
    const heartStartX = 30;
    const heartY = 5;
    const heartSpacing = 10;
    const lastHeartPulseAmplitude = 0.07;
    const lastHeartPulseFrequency = 6;
    const baseWaveOffset = 0.5;
    const baseWaveScale = 0.5;
    const hitPulseAmplitude = 0.18;
    const hitPulseFrequency = 14;
    const states = player.heartStates;
    const lastFilledIndex = [...states]
      .map((state, heartIndex) => ({ state, heartIndex }))
      .filter((heart) => heart.state > 0)
      .pop()?.heartIndex;

    states.forEach((state, heartIndex) => {
      const x = heartStartX + heartIndex * (heartSize + heartSpacing);

      ctx.save();
      ctx.translate(x + heartSize / 2, heartY + heartSize / 2);

      let scale = 1;
      if (heartIndex === lastFilledIndex) {
        const baseWave = baseWaveOffset + baseWaveScale * Math.sin(this.heartPulseTime * lastHeartPulseFrequency);
        scale += lastHeartPulseAmplitude * baseWave;
      }
      if (player.healthPulse > 0) {
        const hitAmp = hitPulseAmplitude * player.healthPulse;
        const hitWave = baseWaveOffset + baseWaveScale * Math.sin(this.heartPulseTime * hitPulseFrequency);
        scale += hitAmp * hitWave;
      }
      ctx.scale(scale, scale);

      this.drawHeartShape(ctx, state, heartSize);

      ctx.restore();
    });
  }

  drawHeartShape(ctx, heartState, size) {
    const topOffsetFactor = 0.35;
    const curveFactor = 0.6;
    const curveTopOffsetFactor = 0.1;
    const outlineWidth = 3;
    const fullHeartColor = "rgba(182, 0, 0, 1)";
    const halfHeartColor = "rgba(192, 69, 69, 0.6)";
    const emptyHeartColor = "rgba(58, 58, 58, 0.2)";
    const outlineColor = "#000";

    ctx.beginPath();
    const heartWidth = size;
    const heartHeight = size;
    ctx.moveTo(0, heartHeight * topOffsetFactor);
    ctx.bezierCurveTo(
      -heartWidth * curveFactor,
      -heartHeight * curveTopOffsetFactor,
      -heartWidth * curveFactor,
      heartHeight * curveFactor,
      0,
      heartHeight
    );
    ctx.bezierCurveTo(
      heartWidth * curveFactor,
      heartHeight * curveFactor,
      heartWidth * curveFactor,
      -heartHeight * curveTopOffsetFactor,
      0,
      heartHeight * topOffsetFactor
    );

    ctx.lineWidth = outlineWidth;
    ctx.strokeStyle = outlineColor;

    // heartState from player.heartStates: 2 = full, 1 = half, 0 = empty.
    if (heartState === 2) ctx.fillStyle = fullHeartColor;
    else if (heartState === 1) ctx.fillStyle = halfHeartColor;
    else ctx.fillStyle = emptyHeartColor;

    ctx.fill();
    ctx.stroke();
  }

  drawCoins(ctx, canvas, player) {
    if (!this.coinImage || this.coinImage.naturalWidth === 0) return;
    const padding = 20;
    const coinSize = 40;
    const coinOffsetX = 80;
    const coinTextOffsetX = 35;
    const coinTextOffsetY = 25;
    const coinPulseScale = 0.3;
    const coinTextFont = "1.2rem ComixLoud";
    const coinTextStrokeColor = "#000";
    const coinTextFillColor = "rgba(255,255,2,0.9)";
    const coinTextStrokeWidth = 3;

    const x = canvas.width - coinSize - padding - coinOffsetX;
    const y = padding;

    ctx.drawImage(this.coinImage, x, y, coinSize, coinSize);

    const baseScale = 1;
    const scale = baseScale + player.hudPulse * coinPulseScale;
    const text = Math.round(this.displayCoinValue).toString();

    ctx.save();
    ctx.translate(x + coinSize + coinTextOffsetX, y + coinTextOffsetY);
    ctx.scale(scale, scale);

    ctx.font = coinTextFont;
    ctx.strokeStyle = coinTextStrokeColor;
    ctx.fillStyle = coinTextFillColor;
    ctx.lineWidth = coinTextStrokeWidth;
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);

    ctx.restore();
  }

  drawBullets(ctx, canvas, player) {
    if (!this.gunImage || this.gunImage.naturalWidth === 0) return;
    const padding = 20;
    const gunSize = 40;
    const coinSize = 40;
    const coinOffsetX = 80;
    const gunOffsetX = 80;
    const bulletTextOffsetX = 30;
    const bulletTextOffsetY = 25;
    const gunPulseScale = 0.3;
    const bulletTextFont = "1.2rem ComixLoud";
    const bulletTextStrokeColor = "#000";
    const bulletTextFillColor = "rgba(235, 145, 0, 1)";
    const bulletTextStrokeWidth = 3;

    const coinX = canvas.width - coinSize - padding - coinOffsetX;
    const coinY = padding;
    const x = coinX - gunOffsetX - gunSize;
    const y = coinY;

    ctx.drawImage(this.gunImage, x, y, gunSize, gunSize);

    const baseScale = 1;
    const scale = baseScale + (player.gunPulse || 0) * gunPulseScale;
    const text = Math.max(0, Math.floor(player.bulletAmmo)).toString();

    ctx.save();
    ctx.translate(x + gunSize + bulletTextOffsetX, y + bulletTextOffsetY);
    ctx.scale(scale, scale);

    ctx.font = bulletTextFont;
    ctx.strokeStyle = bulletTextStrokeColor;
    ctx.fillStyle = bulletTextFillColor;
    ctx.lineWidth = bulletTextStrokeWidth;
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);

    ctx.restore();
  }

  drawBossIndicator(ctx, canvas, camera, boss) {
    if (!boss || boss.remove || (boss.isDead && boss.health <= 0)) {
      return;
    }

    const margin = 16;
    const bossTopOffset = 30;
    const bossBarWidthFactor = 0.8;
    const bossBarHeight = 12;
    const arrowSize = 20;
    const arrowYOffset = 9.25;
    const bossNameOffsetX = 16;
    const bossNameColor = "rgba(143, 0, 0, 0.9)";
    const arrowColor = "rgba(0, 0, 0, 0.6)";
    const bossNameFont = "1rem ComixLoud, sans-serif";

    const placement = this.getBossIndicatorPlacement(
      boss,
      canvas,
      camera,
      margin,
      bossTopOffset,
      bossBarWidthFactor,
      bossBarHeight,
      arrowYOffset,
      arrowSize,
      bossNameOffsetX
    );

    if (!placement.isOffscreen) return;

    const { drawX, offLeft, offRight, offTop, arrowX, arrowY, textX, textY } = placement;

    ctx.save();
    ctx.fillStyle = arrowColor;

    if (offLeft || offRight) {
      const angle = offLeft ? Math.PI : 0;
      this.drawIndicatorArrow(ctx, arrowX, arrowY, angle, arrowSize);
      this.drawIndicatorLabel(
        ctx,
        this.bossName,
        textX,
        textY,
        offLeft ? "left" : "right",
        bossNameFont,
        bossNameColor
      );
    } else {
      const angle = offTop ? -Math.PI / 2 : Math.PI / 2;
      this.drawIndicatorArrow(ctx, drawX, arrowY, angle, arrowSize);
      this.drawIndicatorLabel(
        ctx,
        this.bossName,
        drawX,
        textY,
        "center",
        bossNameFont,
        bossNameColor
      );
    }

    ctx.restore();
  }

  getBossIndicatorPlacement(
    boss,
    canvas,
    camera,
    margin,
    bossTopOffset,
    bossBarWidthFactor,
    bossBarHeight,
    arrowYOffset,
    arrowSize,
    bossNameOffsetX
  ) {
    const centerX = boss.x + boss.width / 2 - camera.x;
    const topY = boss.y - camera.y - bossTopOffset;
    const barW = boss.width * bossBarWidthFactor;
    const barH = bossBarHeight;

    let drawX = centerX;
    let drawY = topY;

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
    const arrowY = barY + barH + arrowYOffset;
    const textY = arrowY;

    const arrowX = offLeft ? margin : canvas.width - margin;
    const textX = offLeft
      ? arrowX + arrowSize + bossNameOffsetX
      : arrowX - arrowSize - bossNameOffsetX;

    return {
      drawX,
      drawY,
      barW,
      barH,
      barY,
      offLeft,
      offRight,
      offTop,
      offBottom,
      isOffscreen,
      arrowX,
      arrowY,
      textX,
      textY,
    };
  }

  drawIndicatorArrow(ctx, x, y, angle, arrowSize) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const arrowHeightFactor = 1.5;
    const arrowHalfHeight = arrowSize / arrowHeightFactor;
    const arrowLeftX = -arrowSize;
    const arrowTipX = arrowSize;
    const arrowBaseTop = { x: arrowLeftX, y: -arrowHalfHeight };
    const arrowBaseBottom = { x: arrowLeftX, y: arrowHalfHeight };
    ctx.beginPath();
    ctx.moveTo(arrowBaseTop.x, arrowBaseTop.y);
    ctx.lineTo(arrowBaseBottom.x, arrowBaseBottom.y);
    ctx.lineTo(arrowTipX, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawIndicatorLabel(ctx, text, x, y, align, font, color) {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }
}
