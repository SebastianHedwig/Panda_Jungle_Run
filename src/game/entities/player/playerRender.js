import { FACING_LEFT } from "../../../config/config.js";

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

function shouldSkipRender(player) {
  if (player.isDead) return false;
  if (player.invulnerableTimer <= 0 || player.slideInvulWindow > 0) return false;
  return isInvisibleBlinkPhase(player);
}

function isInvisibleBlinkPhase(player) {
  const blinkPhaseModulo = 2;
  const blinkPhase = Math.floor(
    player.invulnerableTimer / player.invulnerableBlinkInterval
  );
  return blinkPhase % blinkPhaseModulo === 0;
}

function applyFacingTransform(ctx, isMirroredFacing) {
  if (isMirroredFacing) ctx.scale(-1, 1);
}

function getSpriteDrawPosition(player, camera, isMirroredFacing) {
  const playerScreenX = player.x - camera.x;
  const playerScreenY = player.y - camera.y;
  const spriteDrawX = isMirroredFacing
    ? -(playerScreenX + player.width)
    : playerScreenX;
  const spriteDrawY = playerScreenY;
  return { spriteDrawX, spriteDrawY };
}

function drawHitbox(player, ctx, camera, isMirroredFacing) {
  const hitbox = player.getHitbox();
  const { hitboxDrawX, hitboxDrawY } = getHitboxDrawPosition(hitbox, camera, isMirroredFacing);
  ctx.strokeStyle = "rgba(0,120,255,0.6)";
  ctx.lineWidth = 2;
  ctx.strokeRect(hitboxDrawX, hitboxDrawY, hitbox.width, hitbox.height);
}

function getHitboxDrawPosition(hitbox, camera, isMirroredFacing) {
  const hitboxScreenX = hitbox.x - camera.x;
  const hitboxScreenY = hitbox.y - camera.y;
  const hitboxDrawX = isMirroredFacing
    ? -(hitboxScreenX + hitbox.width)
    : hitboxScreenX;
  const hitboxDrawY = hitboxScreenY;
  return { hitboxDrawX, hitboxDrawY };
}
