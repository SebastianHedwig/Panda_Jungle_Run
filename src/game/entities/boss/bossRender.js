export function renderBoss(boss, ctx, camera, { debugHitbox = false } = {}) {
  ctx.save();
  if (boss.facing === 1) {
    ctx.scale(-1, 1);
    ctx.drawImage(
      boss.sprite,
      -(boss.x - camera.x + boss.width),
      boss.y + boss.spriteYOffset - camera.y,
      boss.width,
      boss.height
    );
    if (debugHitbox) {
      const box = boss.getHitbox();
      ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
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
      boss.sprite,
      boss.x - camera.x,
      boss.y + boss.spriteYOffset - camera.y,
      boss.width,
      boss.height
    );
    if (debugHitbox) {
      const box = boss.getHitbox();
      ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
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
  if (!boss.isDead && boss.health > 0 && boss.maxHealth > 0) {
    const barW = boss.width * 0.8;
    const barH = 15;
    const barX = boss.x - camera.x + (boss.width - barW) / 2;
    const barY = boss.y - camera.y - barH + 8;
    const ratio = Math.max(0, Math.min(1, boss.health / boss.maxHealth));

    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

    ctx.fillStyle = "rgba(200, 0, 0, 0.9)";
    ctx.fillRect(barX, barY, barW * ratio, barH);

    ctx.fillStyle = "rgba(255,255,2,0.9)";
    ctx.font = "0.5rem ComixLoud, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${Math.ceil(boss.health)}/${Math.ceil(boss.maxHealth)}`,
      barX + barW / 2,
      barY + barH / 2
    );
  }

  if (debugHitbox) {
    const box = boss.getHitbox();
    ctx.save();
    ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x - camera.x, box.y - camera.y, box.width, box.height);
    ctx.restore();
  }
}

