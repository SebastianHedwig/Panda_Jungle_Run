export function renderPlayer(player, ctx, camera, { debugHitbox = false } = {}) {
  if (
    !player.isDead &&
    player.invulnerableTimer > 0 &&
    player.slideInvulWindow <= 0
  ) {
    const phase = Math.floor(
      player.invulnerableTimer / player.invulnerableBlinkInterval
    );
    if (phase % 2 === 0) return;
  }

  ctx.save();
  if (player.facing === -1) {
    ctx.scale(-1, 1);
    ctx.drawImage(
      player.sprite,
      -(player.x - camera.x + player.width),
      player.y - camera.y,
      player.width,
      player.height
    );
    if (debugHitbox) {
      const box = player.getHitbox();
      ctx.strokeStyle = "rgba(0,120,255,0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        -(box.x - camera.x + box.width),
        box.y - camera.y,
        box.width,
        box.height
      );
    }
  } else {
    ctx.drawImage(
      player.sprite,
      player.x - camera.x,
      player.y - camera.y,
      player.width,
      player.height
    );
    if (debugHitbox) {
      const box = player.getHitbox();
      ctx.strokeStyle = "rgba(0,120,255,0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        box.x - camera.x,
        box.y - camera.y,
        box.width,
        box.height
      );
    }
  }
  ctx.restore();
}

