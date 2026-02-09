import { FACING_LEFT } from "../../../config/config.js";

/**
 * Renders player. If omitted, default values are used.
 * Used to render player. If omitted, default values are used.
 * Uses player, ctx, camera, options to perform the operation.
 * @param {Player} player Player instance.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {Camera} camera Camera instance.
 * @param {Object} [options] Configuration options.
 * @param {*} [options.debugHitbox] Debug hitbox.
 */
export function renderPlayer(player, ctx, camera, { debugHitbox = false } = {}) {
  if (shouldSkipRender(player)) return;
  ctx.save();
  const isMirroredFacing = player.facing === FACING_LEFT;
  applyFacingTransform(ctx, isMirroredFacing);
  const { spriteDrawX, spriteDrawY } = getSpriteDrawPosition(player, camera, isMirroredFacing);
  ctx.drawImage(player.sprite, spriteDrawX, spriteDrawY, player.width, player.height);
  if (debugHitbox) drawHitbox(player, ctx, camera, isMirroredFacing);
  ctx.restore();
}

/**
 * Should skip render.
 * Used to decide control flow.
 * @param {Player} player Player instance.
 * @returns {boolean} Whether skip render.
 */
function shouldSkipRender(player) {
  if (player.isDead) return false;
  if (player.invulnerableTimer <= 0 || player.slideInvulWindow > 0) return false;
  return isInvisibleBlinkPhase(player);
}

/**
 * Is invisible blink phase.
 * Used to decide control flow.
 * @param {Player} player Player instance.
 * @returns {boolean} Whether invisible blink phase.
 */
function isInvisibleBlinkPhase(player) {
  const blinkPhaseModulo = 2;
  const blinkPhase = Math.floor(
    player.invulnerableTimer / player.invulnerableBlinkInterval
  );
  return blinkPhase % blinkPhaseModulo === 0;
}

/**
 * Applies facing transform.
 * Used to apply visual styling before rendering.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {boolean} isMirroredFacing Whether mirrored facing.
 */
function applyFacingTransform(ctx, isMirroredFacing) {
  if (isMirroredFacing) ctx.scale(-1, 1);
}

/**
 * Returns sprite draw position.
 * Used to provide sprite draw position for camera-relative placement.
 * Advances animation state and sprites.
 * @param {Player} player Player instance.
 * @param {Camera} camera Camera instance.
 * @param {boolean} isMirroredFacing Whether mirrored facing.
 * @returns {Object} Sprite draw position.
 */
function getSpriteDrawPosition(player, camera, isMirroredFacing) {
  const playerScreenX = player.x - camera.x;
  const playerScreenY = player.y - camera.y;
  const spriteDrawX = isMirroredFacing
    ? -(playerScreenX + player.width)
    : playerScreenX;
  const spriteDrawY = playerScreenY;
  return { spriteDrawX, spriteDrawY };
}

/**
 * Draws hitbox.
 * Used to render hitbox.
 * Renders to the canvas context.
 * Performs hitbox or collision checks.
 * @param {Player} player Player instance.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {Camera} camera Camera instance.
 * @param {boolean} isMirroredFacing Whether mirrored facing.
 */
function drawHitbox(player, ctx, camera, isMirroredFacing) {
  const hitbox = player.getHitbox();
  const { hitboxDrawX, hitboxDrawY } = getHitboxDrawPosition(hitbox, camera, isMirroredFacing);
  ctx.strokeStyle = "rgba(0,120,255,0.6)";
  ctx.lineWidth = 2;
  ctx.strokeRect(hitboxDrawX, hitboxDrawY, hitbox.width, hitbox.height);
}

/**
 * Returns hitbox draw position.
 * Used to provide hitbox draw position for collision and hit testing.
 * Performs hitbox or collision checks.
 * @param {*} hitbox Hitbox.
 * @param {Camera} camera Camera instance.
 * @param {boolean} isMirroredFacing Whether mirrored facing.
 * @returns {Object} Hitbox draw position.
 */
function getHitboxDrawPosition(hitbox, camera, isMirroredFacing) {
  const hitboxScreenX = hitbox.x - camera.x;
  const hitboxScreenY = hitbox.y - camera.y;
  const hitboxDrawX = isMirroredFacing
    ? -(hitboxScreenX + hitbox.width)
    : hitboxScreenX;
  const hitboxDrawY = hitboxScreenY;
  return { hitboxDrawX, hitboxDrawY };
}
