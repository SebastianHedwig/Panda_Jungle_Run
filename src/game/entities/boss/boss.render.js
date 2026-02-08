import { FACING_RIGHT } from "../../../config/config.js";

/**
 * Renders boss. If omitted, default values are used.
 * Uses boss, ctx, camera, options to perform the operation.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
 * @param {Object} [options] Configuration options.
 * @param {*} [options.debugHitbox] Debug hitbox.
 */
export function renderBoss(boss, ctx, camera, { debugHitbox = false } = {}) {
  const renderSettings = getBossRenderSettings(boss);
  ctx.save();
  drawBossSprite(boss, ctx, camera, renderSettings, debugHitbox);
  ctx.restore();
  drawBossHealthBar(boss, ctx, camera, renderSettings);
  if (debugHitbox) drawBossDebugHitbox(boss, ctx, camera, renderSettings);
}

/**
 * Returns boss render settings.
 * Advances animation state and sprites.
 * Performs hitbox or collision checks.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @returns {Object} Boss render settings.
 */
function getBossRenderSettings(boss) {
  return {
    hitboxStrokeColor: "rgba(255, 0, 0, 0.7)", hitboxLineWidth: 2, spriteYOffset: boss.spriteYOffset,
    healthBarHeight: 15, healthBarWidthFactor: 0.8, healthBarVerticalOffset: 8, healthBarPadding: 2,
    healthTextFont: "0.5rem ComixLoud, sans-serif", healthTextColor: "rgba(255,255,2,0.9)",
    healthBarBgColor: "rgba(0, 0, 0, 0.4)", healthBarFillColor: "rgba(200, 0, 0, 0.9)",
  };
}

/**
 * Draws boss sprite.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
 * @param {*} renderSettings Render settings.
 * @param {*} debugHitbox Debug hitbox.
 * @returns {*} Result value.
 */
function drawBossSprite(boss, ctx, camera, renderSettings, debugHitbox) {
  if (boss.facing === FACING_RIGHT)
    return drawBossSpriteFlipped(boss, ctx, camera, renderSettings, debugHitbox);
  drawBossSpriteNormal(boss, ctx, camera, renderSettings, debugHitbox);
}

/**
 * Draws boss sprite flipped.
 * Renders to the canvas context.
 * Advances animation state and sprites.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
 * @param {*} renderSettings Render settings.
 * @param {*} debugHitbox Debug hitbox.
 */
function drawBossSpriteFlipped(boss, ctx, camera, renderSettings, debugHitbox) {
  ctx.scale(-1, 1);
  const spriteDrawX = -(boss.x - camera.x + boss.width);
  const spriteDrawY = boss.y + renderSettings.spriteYOffset - camera.y;
  ctx.drawImage(boss.sprite, spriteDrawX, spriteDrawY, boss.width, boss.height);
  if (debugHitbox) drawBossHitboxFlipped(boss, ctx, camera, renderSettings);
}

/**
 * Draws boss sprite normal.
 * Renders to the canvas context.
 * Advances animation state and sprites.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
 * @param {*} renderSettings Render settings.
 * @param {*} debugHitbox Debug hitbox.
 */
function drawBossSpriteNormal(boss, ctx, camera, renderSettings, debugHitbox) {
  const spriteDrawX = boss.x - camera.x;
  const spriteDrawY = boss.y + renderSettings.spriteYOffset - camera.y;
  ctx.drawImage(boss.sprite, spriteDrawX, spriteDrawY, boss.width, boss.height);
  if (debugHitbox) drawBossHitboxNormal(boss, ctx, camera, renderSettings);
}

/**
 * Draws boss hitbox flipped.
 * Renders to the canvas context.
 * Performs hitbox or collision checks.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
 * @param {*} renderSettings Render settings.
 */
function drawBossHitboxFlipped(boss, ctx, camera, renderSettings) {
  const box = boss.getHitbox();
  ctx.strokeStyle = renderSettings.hitboxStrokeColor;
  ctx.lineWidth = renderSettings.hitboxLineWidth;
  ctx.strokeRect(-(box.x - camera.x + box.width), box.y - camera.y, box.width, box.height);
}

/**
 * Draws boss hitbox normal.
 * Renders to the canvas context.
 * Performs hitbox or collision checks.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
 * @param {*} renderSettings Render settings.
 */
function drawBossHitboxNormal(boss, ctx, camera, renderSettings) {
  const box = boss.getHitbox();
  ctx.strokeStyle = renderSettings.hitboxStrokeColor;
  ctx.lineWidth = renderSettings.hitboxLineWidth;
  ctx.strokeRect(box.x - camera.x, box.y - camera.y, box.width, box.height);
}

/**
 * Draws boss health bar.
 * Uses boss, ctx, camera, renderSettings to perform the operation.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
 * @param {*} renderSettings Render settings.
 */
function drawBossHealthBar(boss, ctx, camera, renderSettings) {
  if (!shouldRenderHealthBar(boss)) return;
  const healthBarMetrics = getBossHealthBarMetrics(boss, camera, renderSettings);
  drawBossHealthBarBackground(ctx, healthBarMetrics, renderSettings);
  drawBossHealthBarFill(ctx, healthBarMetrics, renderSettings);
  drawBossHealthBarText(ctx, healthBarMetrics, renderSettings, boss);
}

/**
 * Should render health bar.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @returns {boolean} Whether render health bar.
 */
function shouldRenderHealthBar(boss) {
  return !boss.isDead && boss.health > 0 && boss.maxHealth > 0;
}

/**
 * Returns boss health bar metrics.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
 * @param {*} renderSettings Render settings.
 * @returns {Object} Boss health bar metrics.
 */
function getBossHealthBarMetrics(boss, camera, renderSettings) {
  const barW = boss.width * renderSettings.healthBarWidthFactor;
  const barH = renderSettings.healthBarHeight;
  const barX = boss.x - camera.x + (boss.width - barW) / 2;
  const barY = boss.y - camera.y - barH + renderSettings.healthBarVerticalOffset;
  const healthRatioMin = 0;
  const healthRatioMax = 1;
  const ratio = Math.max(healthRatioMin, Math.min(healthRatioMax, boss.health / boss.maxHealth));
  return { barW, barH, barX, barY, ratio };
}

/**
 * Draws boss health bar background.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} healthBarMetrics Health bar metrics.
 * @param {*} renderSettings Render settings.
 */
function drawBossHealthBarBackground(ctx, healthBarMetrics, renderSettings) {
  ctx.fillStyle = renderSettings.healthBarBgColor;
  ctx.fillRect(
    healthBarMetrics.barX - renderSettings.healthBarPadding,
    healthBarMetrics.barY - renderSettings.healthBarPadding,
    healthBarMetrics.barW + renderSettings.healthBarPadding * 2,
    healthBarMetrics.barH + renderSettings.healthBarPadding * 2
  );
}

/**
 * Draws boss health bar fill.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} healthBarMetrics Health bar metrics.
 * @param {*} renderSettings Render settings.
 */
function drawBossHealthBarFill(ctx, healthBarMetrics, renderSettings) {
  ctx.fillStyle = renderSettings.healthBarFillColor;
  ctx.fillRect(healthBarMetrics.barX, healthBarMetrics.barY, healthBarMetrics.barW * healthBarMetrics.ratio, healthBarMetrics.barH);
}

/**
 * Draws boss health bar text.
 * Renders to the canvas context.
 * Updates the boss state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} healthBarMetrics Health bar metrics.
 * @param {*} renderSettings Render settings.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 */
function drawBossHealthBarText(ctx, healthBarMetrics, renderSettings, boss) {
  ctx.fillStyle = renderSettings.healthTextColor;
  ctx.font = renderSettings.healthTextFont;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `${Math.ceil(boss.health)}/${Math.ceil(boss.maxHealth)}`,
    healthBarMetrics.barX + healthBarMetrics.barW / 2,
    healthBarMetrics.barY + healthBarMetrics.barH / 2
  );
}

/**
 * Draws boss debug hitbox.
 * Renders to the canvas context.
 * Performs hitbox or collision checks.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
 * @param {*} renderSettings Render settings.
 */
function drawBossDebugHitbox(boss, ctx, camera, renderSettings) {
  const hitbox = boss.getHitbox();
  ctx.save();
  ctx.strokeStyle = renderSettings.hitboxStrokeColor;
  ctx.lineWidth = renderSettings.hitboxLineWidth;
  ctx.strokeRect(hitbox.x - camera.x, hitbox.y - camera.y, hitbox.width, hitbox.height);
  ctx.restore();
}
