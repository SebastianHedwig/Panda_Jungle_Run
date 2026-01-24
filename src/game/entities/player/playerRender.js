import { FACING_LEFT } from "../../../config/config.js";

export function renderPlayer(player, ctx, camera, { debugHitbox = false } = {}) {
  if (
    !player.isDead &&
    player.invulnerableTimer > 0 &&
    player.slideInvulWindow <= 0
  ) {
    const blinkPhaseModulo = 2;
    const blinkPhase = Math.floor(
      player.invulnerableTimer / player.invulnerableBlinkInterval
    );
    const isInvisiblePhase = blinkPhase % blinkPhaseModulo === 0;
    if (isInvisiblePhase) return;
  }

  ctx.save();
  const isMirroredFacing = player.facing === FACING_LEFT;
  if (isMirroredFacing) ctx.scale(-1, 1);

  const playerScreenX = player.x - camera.x;
  const playerScreenY = player.y - camera.y;
  const spriteDrawX = isMirroredFacing
    ? -(playerScreenX + player.width)
    : playerScreenX;
  const spriteDrawY = playerScreenY;

  ctx.drawImage(player.sprite, spriteDrawX, spriteDrawY, player.width, player.height);

  if (debugHitbox) {
    const hitbox = player.getHitbox();
    const hitboxScreenX = hitbox.x - camera.x;
    const hitboxScreenY = hitbox.y - camera.y;
    const hitboxDrawX = isMirroredFacing
      ? -(hitboxScreenX + hitbox.width)
      : hitboxScreenX;
    const hitboxDrawY = hitboxScreenY;
    ctx.strokeStyle = "rgba(0,120,255,0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(hitboxDrawX, hitboxDrawY, hitbox.width, hitbox.height);
  }
  ctx.restore();
}
