import { DEBUG_ENEMY_HITBOX } from "../base/enemies.base.class.js";
import { FACING_LEFT } from "../../../../config/config.js";

/**
 * Renders.
 * Renders to the canvas context.
 * Advances animation state and sprites.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {import("../../../../engine/world/camera.class.js").Camera} camera Camera instance.
 */
export function render(ctx, camera) {
  if (shouldSkipEnemyRender(this)) return;
  ctx.save();
  const isMirroredFacing = this.facing === FACING_LEFT;
  applyEnemyFacingTransform(ctx, isMirroredFacing);
  const { spriteDrawX, spriteDrawY } = getEnemySpriteDrawPosition(this, camera, isMirroredFacing);
  ctx.drawImage(this.sprite, spriteDrawX, spriteDrawY, this.width, this.height);
  if (DEBUG_ENEMY_HITBOX) drawEnemyHitbox(this, ctx, camera, isMirroredFacing);
  ctx.restore();
}

/**
 * Should skip enemy render.
 * Updates the enemy state.
 * @param {import("../base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @returns {boolean} Whether skip enemy render.
 */
function shouldSkipEnemyRender(enemy) {
  if (!(enemy.isDead && enemy.deathTimer === 0 && enemy.blinkTimer > 0)) return false;
  const blinkInterval = 0.3;
  const blinkPhaseModulo = 2;
  const blinkPhase = Math.floor(enemy.blinkTimer / blinkInterval) % blinkPhaseModulo;
  const isInvisiblePhase = blinkPhase === 0;
  return isInvisiblePhase;
}

/**
 * Applies enemy facing transform.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {boolean} isMirroredFacing Whether mirrored facing.
 */
function applyEnemyFacingTransform(ctx, isMirroredFacing) {
  if (isMirroredFacing) ctx.scale(-1, 1);
}

/**
 * Returns enemy sprite draw position.
 * Advances animation state and sprites.
 * Updates the enemy state.
 * @param {import("../base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../../../../engine/world/camera.class.js").Camera} camera Camera instance.
 * @param {boolean} isMirroredFacing Whether mirrored facing.
 * @returns {Object} Enemy sprite draw position.
 */
function getEnemySpriteDrawPosition(enemy, camera, isMirroredFacing) {
  const enemyScreenX = enemy.x - camera.x;
  const enemyScreenY = enemy.y - camera.y;
  const spriteDrawX = isMirroredFacing ? -(enemyScreenX + enemy.width) : enemyScreenX;
  const spriteDrawY = enemyScreenY;
  return { spriteDrawX, spriteDrawY };
}

/**
 * Draws enemy hitbox.
 * Renders to the canvas context.
 * Performs hitbox or collision checks.
 * @param {import("../base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {import("../../../../engine/world/camera.class.js").Camera} camera Camera instance.
 * @param {boolean} isMirroredFacing Whether mirrored facing.
 */
function drawEnemyHitbox(enemy, ctx, camera, isMirroredFacing) {
  const hitbox = enemy.getHitbox();
  const hitboxScreenX = hitbox.x - camera.x;
  const hitboxScreenY = hitbox.y - camera.y;
  const hitboxDrawX = isMirroredFacing ? -(hitboxScreenX + hitbox.width) : hitboxScreenX;
  const hitboxDrawY = hitboxScreenY;
  ctx.strokeStyle = "rgba(0,120,255,0.6)";
  ctx.lineWidth = 2;
  ctx.strokeRect(hitboxDrawX, hitboxDrawY, hitbox.width, hitbox.height);
}

