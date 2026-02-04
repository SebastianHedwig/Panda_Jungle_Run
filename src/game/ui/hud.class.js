export class Hud {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   * @param {HTMLImageElement} [options.coinImage] Coin image.
   * @param {HTMLImageElement} [options.gunImage] Gun image.
   * @param {string} [options.bossName] Boss name.
   */
  constructor({ coinImage, gunImage, bossName = "LUPO" } = {}) {
    this.coinImage = coinImage || null;
    this.gunImage = gunImage || null;
    this.bossName = bossName;

    this.displayCoinValue = 0;
    this.heartPulseTime = 0;
  }

  /**
   * Updates.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   */
  update(dt, player) {
    if (!player) return;
    const { coinLerpSpeed, hudPulseDecaySpeed, healthPulseDecaySpeed } = this.getUpdateSpeeds();
    this.updateCoinDisplay(player, dt, coinLerpSpeed);
    this.updatePulseTimes(dt);
    this.decayHudPulse(player, dt, hudPulseDecaySpeed);
    this.decayHealthPulse(player, dt, healthPulseDecaySpeed);
  }

  /**
   * Returns update speeds.
   * @returns {Object} Update speeds.
   */
  getUpdateSpeeds() {
    return { coinLerpSpeed: 10, hudPulseDecaySpeed: 4, healthPulseDecaySpeed: 2 };
  }

  /**
   * Updates coin display.
   * Updates the player state.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   * @param {number} dt Delta time in seconds.
   * @param {number} coinLerpSpeed Coin lerp speed.
   */
  updateCoinDisplay(player, dt, coinLerpSpeed) {
    this.displayCoinValue += (player.coins - this.displayCoinValue) * dt * coinLerpSpeed;
  }

  /**
   * Updates pulse times.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  updatePulseTimes(dt) {
    this.heartPulseTime += dt;
  }

  /**
   * Decay hud pulse.
   * Updates the player state.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   * @param {number} dt Delta time in seconds.
   * @param {number} hudPulseDecaySpeed Hud pulse decay speed.
   */
  decayHudPulse(player, dt, hudPulseDecaySpeed) {
    if (player.hudPulse > 0) player.hudPulse = Math.max(0, player.hudPulse - dt * hudPulseDecaySpeed);
  }

  /**
   * Decay health pulse.
   * Updates the player state.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   * @param {number} dt Delta time in seconds.
   * @param {number} healthPulseDecaySpeed Health pulse decay speed.
   */
  decayHealthPulse(player, dt, healthPulseDecaySpeed) {
    if (player.healthPulse > 0) player.healthPulse = Math.max(0, player.healthPulse - dt * healthPulseDecaySpeed);
  }

  /**
   * Renders.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {import("../../engine/world/camera.class.js").Camera} camera Camera instance.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   * @param {import("../entities/boss/boss.class.js").Boss} boss Boss instance.
   */
  render(ctx, canvas, camera, player, boss) {
    if (!ctx || !canvas || !camera || !player) return;
    this.drawHearts(ctx, player);
    this.drawCoins(ctx, canvas, player);
    this.drawBullets(ctx, canvas, player);
    this.drawBossIndicator(ctx, canvas, camera, boss);
  }

  /**
   * Draws hearts.
   * Updates the player state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   */
  drawHearts(ctx, player) {
    const heartSettings = this.getHeartSettings();
    const states = player.heartStates;
    const lastFilledIndex = this.getLastFilledIndex(states);
    this.drawHeartsFromStates(ctx, states, heartSettings, lastFilledIndex, player);
  }

  /**
   * Returns heart settings.
   * @returns {Object} Heart settings.
   */
  getHeartSettings() {
    return {
      heartSize: 32,
      heartStartX: 30,
      heartY: 5,
      heartSpacing: 10,
      lastHeartPulseAmplitude: 0.07,
      lastHeartPulseFrequency: 6,
      baseWaveOffset: 0.5,
      baseWaveScale: 0.5,
      hitPulseAmplitude: 0.18,
      hitPulseFrequency: 14 };
  }

  /**
   * Returns last filled index.
   * Uses states to compute the result.
   * @param {*} states States.
   * @returns {Array<any>} Last filled index.
   */
  getLastFilledIndex(states) {
    return [...states].map((state, heartIndex) => ({ state, heartIndex })).filter((heart) => heart.state > 0).pop()?.heartIndex;
  }

  /**
   * Draws hearts from states.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} states States.
   * @param {*} heartSettings Heart settings.
   * @param {number} lastFilledIndex Last filled index.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   */
  drawHeartsFromStates(ctx, states, heartSettings, lastFilledIndex, player) {
    states.forEach((state, heartIndex) => {
      const x = heartSettings.heartStartX + heartIndex * (heartSettings.heartSize + heartSettings.heartSpacing);
      this.drawHeartAtIndex(ctx, state, heartIndex, x, heartSettings, lastFilledIndex, player);
    });
  }

  /**
   * Draws heart at index.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} state State.
   * @param {number} heartIndex Heart index.
   * @param {number} x X.
   * @param {*} heartSettings Heart settings.
   * @param {number} lastFilledIndex Last filled index.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   */
  drawHeartAtIndex(ctx, state, heartIndex, x, heartSettings, lastFilledIndex, player) {
    ctx.save();
    ctx.translate(x + heartSettings.heartSize / 2, heartSettings.heartY + heartSettings.heartSize / 2);
    const scale = this.getHeartScale(heartIndex, lastFilledIndex, player, heartSettings);
    ctx.scale(scale, scale);
    this.drawHeartShape(ctx, state, heartSettings.heartSize);
    ctx.restore();
  }

  /**
   * Returns heart scale.
   * Updates the player state.
   * @param {number} heartIndex Heart index.
   * @param {number} lastFilledIndex Last filled index.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   * @param {*} heartSettings Heart settings.
   * @returns {*} Heart scale.
   */
  getHeartScale(heartIndex, lastFilledIndex, player, heartSettings) {
    let scale = 1;
    if (heartIndex === lastFilledIndex) {
      const baseWave = heartSettings.baseWaveOffset + heartSettings.baseWaveScale * Math.sin(this.heartPulseTime * heartSettings.lastHeartPulseFrequency);
      scale += heartSettings.lastHeartPulseAmplitude * baseWave;
    }
    if (player.healthPulse > 0) {
      const hitAmp = heartSettings.hitPulseAmplitude * player.healthPulse;
      const hitWave = heartSettings.baseWaveOffset + heartSettings.baseWaveScale * Math.sin(this.heartPulseTime * heartSettings.hitPulseFrequency);
      scale += hitAmp * hitWave;
    }
    return scale;
  }

  /**
   * Draws heart shape.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} heartState Heart state.
   * @param {number} size Size.
   */
  drawHeartShape(ctx, heartState, size) {
    const heartStyle = this.getHeartStyle();
    this.traceHeartPath(ctx, size, heartStyle);
    this.applyHeartOutline(ctx, heartStyle);
    this.applyHeartFill(ctx, heartState, heartStyle);
    ctx.fill();
    ctx.stroke();
  }

  /**
   * Returns heart style.
   * @returns {Object} Heart style.
   */
  getHeartStyle() {
    return {
      topOffsetFactor: 0.35,
      curveFactor: 0.6,
      curveTopOffsetFactor: 0.1,
      outlineWidth: 3,
      fullHeartColor: "rgba(182, 0, 0, 1)",
      halfHeartColor: "rgba(192, 69, 69, 0.6)",
      emptyHeartColor: "rgba(58, 58, 58, 0.2)",
      outlineColor: "#000" };
  }

  /**
   * Trace heart path.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} size Size.
   * @param {*} heartStyle Heart style.
   */
  traceHeartPath(ctx, size, heartStyle) {
    ctx.beginPath();
    const heartWidth = size, heartHeight = size;
    ctx.moveTo(0, heartHeight * heartStyle.topOffsetFactor);
    ctx.bezierCurveTo(-heartWidth * heartStyle.curveFactor, -heartHeight * heartStyle.curveTopOffsetFactor, -heartWidth * heartStyle.curveFactor, heartHeight * heartStyle.curveFactor, 0, heartHeight);
    ctx.bezierCurveTo(heartWidth * heartStyle.curveFactor, heartHeight * heartStyle.curveFactor, heartWidth * heartStyle.curveFactor, -heartHeight * heartStyle.curveTopOffsetFactor, 0, heartHeight * heartStyle.topOffsetFactor);
  }

  /**
   * Applies heart outline.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} heartStyle Heart style.
   */
  applyHeartOutline(ctx, heartStyle) {
    ctx.lineWidth = heartStyle.outlineWidth;
    ctx.strokeStyle = heartStyle.outlineColor;
  }

  /**
   * Applies heart fill.
   * Renders to the canvas context.
   * Updates the player state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} heartState Heart state.
   * @param {*} heartStyle Heart style.
   */
  applyHeartFill(ctx, heartState, heartStyle) {
    // heartState from player.heartStates: 2 = full, 1 = half, 0 = empty.
    if (heartState === 2) ctx.fillStyle = heartStyle.fullHeartColor;
    else if (heartState === 1) ctx.fillStyle = heartStyle.halfHeartColor;
    else ctx.fillStyle = heartStyle.emptyHeartColor;
  }

  /**
   * Draws coins.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   */
  drawCoins(ctx, canvas, player) {
    if (!this.isCoinImageReady()) return;
    const coinSettings = this.getCoinHudSettings();
    const { x, y } = this.getCoinPosition(canvas, coinSettings);
    this.drawCoinImage(ctx, x, y, coinSettings);
    this.drawCoinValue(ctx, x, y, coinSettings, player);
  }

  /**
   * Draws bullets.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   */
  drawBullets(ctx, canvas, player) {
    if (!this.isGunImageReady()) return;
    const gunSettings = this.getGunHudSettings();
    const { x, y } = this.getGunPosition(canvas, gunSettings);
    this.drawGunImage(ctx, x, y, gunSettings);
    this.drawBulletValue(ctx, x, y, gunSettings, player);
  }

  /**
   * Is coin image ready.
   * Updates the instance state.
   * @returns {boolean} Whether coin image ready.
   */
  isCoinImageReady() {
    return this.coinImage && this.coinImage.naturalWidth !== 0;
  }

  /**
   * Is gun image ready.
   * Updates the instance state.
   * @returns {boolean} Whether gun image ready.
   */
  isGunImageReady() {
    return this.gunImage && this.gunImage.naturalWidth !== 0;
  }

  /**
   * Returns coin hud settings.
   * @returns {Object} Coin hud settings.
   */
  getCoinHudSettings() {
    return {
      padding: 20,
      coinSize: 40,
      coinOffsetX: 80,
      coinTextOffsetX: 35,
      coinTextOffsetY: 25,
      coinPulseScale: 0.3,
      coinTextFont: "1.2rem ComixLoud",
      coinTextStrokeColor: "#000",
      coinTextFillColor: "rgba(255,255,2,0.9)",
      coinTextStrokeWidth: 3 };
  }

  /**
   * Returns gun hud settings.
   * @returns {Object} Gun hud settings.
   */
  getGunHudSettings() {
    return {
      padding: 20,
      gunSize: 40,
      coinSize: 40,
      coinOffsetX: 80,
      gunOffsetX: 80,
      bulletTextOffsetX: 30,
      bulletTextOffsetY: 25,
      gunPulseScale: 0.3,
      bulletTextFont: "1.2rem ComixLoud",
      bulletTextStrokeColor: "#000",
      bulletTextFillColor: "rgba(235, 145, 0, 1)",
      bulletTextStrokeWidth: 3 };
  }

  /**
   * Returns coin position.
   * Uses canvas, coinSettings to compute the result.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {*} coinSettings Coin settings.
   * @returns {Object} Coin position.
   */
  getCoinPosition(canvas, coinSettings) {
    const x = canvas.width - coinSettings.coinSize - coinSettings.padding - coinSettings.coinOffsetX;
    const y = coinSettings.padding;
    return { x, y };
  }

  /**
   * Returns gun position.
   * Uses canvas, gunSettings to compute the result.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {*} gunSettings Gun settings.
   * @returns {Object} Gun position.
   */
  getGunPosition(canvas, gunSettings) {
    const coinX = canvas.width - gunSettings.coinSize - gunSettings.padding - gunSettings.coinOffsetX;
    const coinY = gunSettings.padding;
    const x = coinX - gunSettings.gunOffsetX - gunSettings.gunSize;
    const y = coinY;
    return { x, y };
  }

  /**
   * Draws coin image.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} coinSettings Coin settings.
   */
  drawCoinImage(ctx, x, y, coinSettings) {
    ctx.drawImage(this.coinImage, x, y, coinSettings.coinSize, coinSettings.coinSize);
  }

  /**
   * Draws gun image.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} gunSettings Gun settings.
   */
  drawGunImage(ctx, x, y, gunSettings) {
    ctx.drawImage(this.gunImage, x, y, gunSettings.gunSize, gunSettings.gunSize);
  }

  /**
   * Draws coin value.
   * Renders to the canvas context.
   * Updates the player state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} coinSettings Coin settings.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   */
  drawCoinValue(ctx, x, y, coinSettings, player) {
    const baseScale = 1;
    const scale = baseScale + player.hudPulse * coinSettings.coinPulseScale;
    const text = Math.round(this.displayCoinValue).toString();
    ctx.save();
    this.applyCoinTextTransform(ctx, x, y, coinSettings, scale);
    this.applyCoinTextStyle(ctx, coinSettings);
    this.drawHudTextValue(ctx, text);
    ctx.restore();
  }

  /**
   * Draws bullet value.
   * Renders to the canvas context.
   * Updates the player state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} gunSettings Gun settings.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   */
  drawBulletValue(ctx, x, y, gunSettings, player) {
    const baseScale = 1;
    const scale = baseScale + (player.gunPulse || 0) * gunSettings.gunPulseScale;
    const text = Math.max(0, Math.floor(player.bulletAmmo)).toString();
    ctx.save();
    this.applyBulletTextTransform(ctx, x, y, gunSettings, scale);
    this.applyBulletTextStyle(ctx, gunSettings);
    this.drawHudTextValue(ctx, text);
    ctx.restore();
  }

  /**
   * Applies coin text transform.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} coinSettings Coin settings.
   * @param {number} scale Scale.
   */
  applyCoinTextTransform(ctx, x, y, coinSettings, scale) {
    ctx.translate(x + coinSettings.coinSize + coinSettings.coinTextOffsetX, y + coinSettings.coinTextOffsetY);
    ctx.scale(scale, scale);
  }

  /**
   * Applies bullet text transform.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} gunSettings Gun settings.
   * @param {number} scale Scale.
   */
  applyBulletTextTransform(ctx, x, y, gunSettings, scale) {
    ctx.translate(x + gunSettings.gunSize + gunSettings.bulletTextOffsetX, y + gunSettings.bulletTextOffsetY);
    ctx.scale(scale, scale);
  }

  /**
   * Applies coin text style.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} coinSettings Coin settings.
   */
  applyCoinTextStyle(ctx, coinSettings) {
    ctx.font = coinSettings.coinTextFont;
    ctx.strokeStyle = coinSettings.coinTextStrokeColor;
    ctx.fillStyle = coinSettings.coinTextFillColor;
    ctx.lineWidth = coinSettings.coinTextStrokeWidth;
  }

  /**
   * Applies bullet text style.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} gunSettings Gun settings.
   */
  applyBulletTextStyle(ctx, gunSettings) {
    ctx.font = gunSettings.bulletTextFont;
    ctx.strokeStyle = gunSettings.bulletTextStrokeColor;
    ctx.fillStyle = gunSettings.bulletTextFillColor;
    ctx.lineWidth = gunSettings.bulletTextStrokeWidth;
  }

  /**
   * Draws hud text value.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {string} text Text.
   */
  drawHudTextValue(ctx, text) {
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);
  }

  /**
   * Draws boss indicator.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {import("../../engine/world/camera.class.js").Camera} camera Camera instance.
   * @param {import("../entities/boss/boss.class.js").Boss} boss Boss instance.
   */
  drawBossIndicator(ctx, canvas, camera, boss) {
    if (!this.shouldRenderBossIndicator(boss)) return;
    const indicatorStyle = this.getBossIndicatorStyle();
    const placement = this.getBossIndicatorPlacement(boss, canvas, camera, indicatorStyle);
    if (!placement.isOffscreen) return;
    this.drawBossIndicatorContent(ctx, placement, indicatorStyle);
  }

  /**
   * Should render boss indicator.
   * Updates the boss state.
   * @param {import("../entities/boss/boss.class.js").Boss} boss Boss instance.
   * @returns {boolean} Whether render boss indicator.
   */
  shouldRenderBossIndicator(boss) {
    return boss && !boss.remove && !(boss.isDead && boss.health <= 0);
  }

  /**
   * Returns boss indicator style.
   * @returns {Object} Boss indicator style.
   */
  getBossIndicatorStyle() {
    return { margin: 16, bossTopOffset: 30, bossBarWidthFactor: 0.8, bossBarHeight: 12, arrowSize: 20, arrowYOffset: 9.25, bossNameOffsetX: 16, bossNameColor: "rgba(143, 0, 0, 0.9)", arrowColor: "rgba(0, 0, 0, 0.6)", bossNameFont: "1rem ComixLoud, sans-serif" };
  }

  /**
   * Draws boss indicator content.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} placement Placement.
   * @param {*} indicatorStyle Indicator style.
   */
  drawBossIndicatorContent(ctx, placement, indicatorStyle) {
    ctx.save();
    ctx.fillStyle = indicatorStyle.arrowColor;
    if (placement.offLeft || placement.offRight) this.drawSideIndicator(ctx, placement, indicatorStyle);
    else this.drawVerticalIndicator(ctx, placement, indicatorStyle);
    ctx.restore();
  }

  /**
   * Draws side indicator.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} placement Placement.
   * @param {*} indicatorStyle Indicator style.
   */
  drawSideIndicator(ctx, placement, indicatorStyle) {
    const angle = placement.offLeft ? Math.PI : 0;
    this.drawIndicatorArrow(ctx, placement.arrowX, placement.arrowY, angle, indicatorStyle.arrowSize);
    this.drawIndicatorLabel(ctx, this.bossName, placement.textX, placement.textY, placement.offLeft ? "left" : "right", indicatorStyle.bossNameFont, indicatorStyle.bossNameColor);
  }

  /**
   * Draws vertical indicator.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} placement Placement.
   * @param {*} indicatorStyle Indicator style.
   */
  drawVerticalIndicator(ctx, placement, indicatorStyle) {
    const angle = placement.offTop ? -Math.PI / 2 : Math.PI / 2;
    this.drawIndicatorArrow(ctx, placement.drawX, placement.arrowY, angle, indicatorStyle.arrowSize);
    this.drawIndicatorLabel(ctx, this.bossName, placement.drawX, placement.textY, "center", indicatorStyle.bossNameFont, indicatorStyle.bossNameColor);
  }

  /**
   * Returns boss indicator placement.
   * Updates the instance state.
   * @param {import("../entities/boss/boss.class.js").Boss} boss Boss instance.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {import("../../engine/world/camera.class.js").Camera} camera Camera instance.
   * @param {*} indicatorStyle Indicator style.
   * @returns {*} Boss indicator placement.
   */
  getBossIndicatorPlacement(boss, canvas, camera, indicatorStyle) {
    const base = this.getBossIndicatorBase(boss, camera, indicatorStyle);
    const offscreen = this.getBossIndicatorOffscreen(base, canvas, indicatorStyle.margin);
    return this.buildBossIndicatorPlacement(base, offscreen, canvas, indicatorStyle);
  }

  /**
   * Returns boss indicator base.
   * Updates the boss state.
   * @param {import("../entities/boss/boss.class.js").Boss} boss Boss instance.
   * @param {import("../../engine/world/camera.class.js").Camera} camera Camera instance.
   * @param {*} indicatorStyle Indicator style.
   * @returns {Object} Boss indicator base.
   */
  getBossIndicatorBase(boss, camera, indicatorStyle) {
    const centerX = boss.x + boss.width / 2 - camera.x;
    const topY = boss.y - camera.y - indicatorStyle.bossTopOffset;
    const barW = boss.width * indicatorStyle.bossBarWidthFactor;
    const barH = indicatorStyle.bossBarHeight;
    return { centerX, topY, barW, barH };
  }

  /**
   * Returns boss indicator offscreen.
   * Uses base, canvas, margin to compute the result.
   * @param {*} base Base.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {*} margin Margin.
   * @returns {Object} Boss indicator offscreen.
   */
  getBossIndicatorOffscreen(base, canvas, margin) {
    let drawX = base.centerX;
    let drawY = base.topY;
    const offLeft = drawX < margin;
    const offRight = drawX > canvas.width - margin;
    const offTop = drawY < margin;
    const offBottom = drawY > canvas.height - margin;
    if (offLeft) drawX = margin;
    if (offRight) drawX = canvas.width - margin;
    if (offTop) drawY = margin;
    if (offBottom) drawY = canvas.height - margin;
    const isOffscreen = offLeft || offRight || offTop || offBottom;
    return { drawX, drawY, offLeft, offRight, offTop, offBottom, isOffscreen };
  }

  /**
   * Builds boss indicator placement.
   * Uses base, offscreen, canvas, indicatorStyle to compute the result.
   * @param {*} base Base.
   * @param {*} offscreen Offscreen.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {*} indicatorStyle Indicator style.
   * @returns {Object} Boss indicator placement.
   */
  buildBossIndicatorPlacement(base, offscreen, canvas, indicatorStyle) {
    const barY = offscreen.drawY;
    const arrowY = barY + base.barH + indicatorStyle.arrowYOffset;
    const textY = arrowY;
    const arrowX = offscreen.offLeft ? indicatorStyle.margin : canvas.width - indicatorStyle.margin;
    const textX = offscreen.offLeft ? arrowX + indicatorStyle.arrowSize + indicatorStyle.bossNameOffsetX : arrowX - indicatorStyle.arrowSize - indicatorStyle.bossNameOffsetX;
    return { drawX: offscreen.drawX, drawY: offscreen.drawY, barW: base.barW, barH: base.barH, barY, offLeft: offscreen.offLeft, offRight: offscreen.offRight, offTop: offscreen.offTop, offBottom: offscreen.offBottom, isOffscreen: offscreen.isOffscreen, arrowX, arrowY, textX, textY };
  }

  /**
   * Draws indicator arrow.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {number} angle Angle.
   * @param {number} arrowSize Arrow size.
   */
  drawIndicatorArrow(ctx, x, y, angle, arrowSize) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const arrowGeometry = this.getArrowGeometry(arrowSize);
    this.drawArrowPath(ctx, arrowGeometry);
    ctx.restore();
  }

  /**
   * Returns arrow geometry.
   * Uses arrowSize to compute the result.
   * @param {number} arrowSize Arrow size.
   * @returns {Object} Arrow geometry.
   */
  getArrowGeometry(arrowSize) {
    const arrowHeightFactor = 1.5;
    const arrowHalfHeight = arrowSize / arrowHeightFactor;
    const arrowLeftX = -arrowSize;
    const arrowTipX = arrowSize;
    const arrowBaseTop = { x: arrowLeftX, y: -arrowHalfHeight };
    const arrowBaseBottom = { x: arrowLeftX, y: arrowHalfHeight };
    return { arrowBaseTop, arrowBaseBottom, arrowTipX };
  }

  /**
   * Draws arrow path.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} arrowGeometry Arrow geometry.
   */
  drawArrowPath(ctx, arrowGeometry) {
    ctx.beginPath();
    ctx.moveTo(arrowGeometry.arrowBaseTop.x, arrowGeometry.arrowBaseTop.y);
    ctx.lineTo(arrowGeometry.arrowBaseBottom.x, arrowGeometry.arrowBaseBottom.y);
    ctx.lineTo(arrowGeometry.arrowTipX, 0);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draws indicator label.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {string} text Text.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} align Align.
   * @param {string} font Font.
   * @param {string} color Color.
   */
  drawIndicatorLabel(ctx, text, x, y, align, font, color) {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }
}
