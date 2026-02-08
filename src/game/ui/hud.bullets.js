/**
 * Draws bullets.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {Player} player Player instance.
 */
export function drawBullets(ctx, canvas, player) {
  if (!this.isGunImageReady()) return;
  const gunSettings = this.getGunHudSettings();
  const { x, y } = this.getGunPosition(canvas, gunSettings);
  this.drawGunImage(ctx, x, y, gunSettings);
  this.drawBulletValue(ctx, x, y, gunSettings, player);
}

/**
 * Is gun image ready.
 * Updates the instance state.
 * @returns {boolean} Whether gun image ready.
 */
export function isGunImageReady() {
  return this.gunImage && this.gunImage.naturalWidth !== 0;
}

/**
 * Returns gun hud settings.
 * @returns {Object} Gun hud settings.
 */
export function getGunHudSettings() {
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
 * Returns gun position.
 * Uses canvas, gunSettings to compute the result.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {*} gunSettings Gun settings.
 * @returns {Object} Gun position.
 */
export function getGunPosition(canvas, gunSettings) {
  const coinX = canvas.width - gunSettings.coinSize - gunSettings.padding - gunSettings.coinOffsetX;
  const coinY = gunSettings.padding;
  const x = coinX - gunSettings.gunOffsetX - gunSettings.gunSize;
  const y = coinY;
  return { x, y };
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
export function drawGunImage(ctx, x, y, gunSettings) {
  ctx.drawImage(this.gunImage, x, y, gunSettings.gunSize, gunSettings.gunSize);
}

/**
 * Draws bullet value.
 * Renders to the canvas context.
 * Updates the player state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {*} gunSettings Gun settings.
 * @param {Player} player Player instance.
 */
export function drawBulletValue(ctx, x, y, gunSettings, player) {
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
 * Applies bullet text transform.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {*} gunSettings Gun settings.
 * @param {number} scale Scale.
 */
export function applyBulletTextTransform(ctx, x, y, gunSettings, scale) {
  ctx.translate(x + gunSettings.gunSize + gunSettings.bulletTextOffsetX, y + gunSettings.bulletTextOffsetY);
  ctx.scale(scale, scale);
}

/**
 * Applies bullet text style.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} gunSettings Gun settings.
 */
export function applyBulletTextStyle(ctx, gunSettings) {
  ctx.font = gunSettings.bulletTextFont;
  ctx.strokeStyle = gunSettings.bulletTextStrokeColor;
  ctx.fillStyle = gunSettings.bulletTextFillColor;
  ctx.lineWidth = gunSettings.bulletTextStrokeWidth;
}
