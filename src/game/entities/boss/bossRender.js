import { FACING_RIGHT } from "../../../config/config.js";

export function renderBoss(boss, ctx, camera, { debugHitbox = false } = {}) {
  const hitboxStrokeColor = "rgba(255, 0, 0, 0.7)";
  const hitboxLineWidth = 2;
  const spriteYOffset = boss.spriteYOffset;

  const healthBarHeight = 15;
  const healthBarWidthFactor = 0.8;
  const healthBarVerticalOffset = 8;
  const healthBarPadding = 2;
  const healthTextFont = "0.5rem ComixLoud, sans-serif";
  const healthTextColor = "rgba(255,255,2,0.9)";
  const healthBarBgColor = "rgba(0, 0, 0, 0.4)";
  const healthBarFillColor = "rgba(200, 0, 0, 0.9)";

  ctx.save();
  if (boss.facing === FACING_RIGHT) {
    ctx.scale(-1, 1);
    ctx.drawImage(
      boss.sprite,
      -(boss.x - camera.x + boss.width),
      boss.y + spriteYOffset - camera.y,
      boss.width,
      boss.height
    );
    if (debugHitbox) {
      const box = boss.getHitbox();
      ctx.strokeStyle = hitboxStrokeColor;
      ctx.lineWidth = hitboxLineWidth;
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
      boss.y + spriteYOffset - camera.y,
      boss.width,
      boss.height
    );
    if (debugHitbox) {
      const box = boss.getHitbox();
      ctx.strokeStyle = hitboxStrokeColor;
      ctx.lineWidth = hitboxLineWidth;
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
    const barW = boss.width * healthBarWidthFactor;
    const barH = healthBarHeight;
    const barX = boss.x - camera.x + (boss.width - barW) / 2;
    const barY = boss.y - camera.y - barH + healthBarVerticalOffset;
    const healthRatioMin = 0;
    const healthRatioMax = 1;
    const ratio = Math.max(healthRatioMin, Math.min(healthRatioMax, boss.health / boss.maxHealth));

    ctx.fillStyle = healthBarBgColor;
    ctx.fillRect(barX - healthBarPadding, barY - healthBarPadding, barW + healthBarPadding * 2, barH + healthBarPadding * 2);

    ctx.fillStyle = healthBarFillColor;
    ctx.fillRect(barX, barY, barW * ratio, barH);

    ctx.fillStyle = healthTextColor;
    ctx.font = healthTextFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${Math.ceil(boss.health)}/${Math.ceil(boss.maxHealth)}`,
      barX + barW / 2,
      barY + barH / 2
    );
  }

  if (debugHitbox) {
    const hitbox = boss.getHitbox();
    ctx.save();
    ctx.strokeStyle = hitboxStrokeColor;
    ctx.lineWidth = hitboxLineWidth;
    ctx.strokeRect(hitbox.x - camera.x, hitbox.y - camera.y, hitbox.width, hitbox.height);
    ctx.restore();
  }
}
