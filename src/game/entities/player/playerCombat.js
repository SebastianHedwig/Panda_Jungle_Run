import { PLAYER_ATTACK_DAMAGE } from "../../../config/config.js";

export function startAttack(player, playerAudio) {
  if (player.bulletAmmo > 0) return;
  if (
    player.isAttacking ||
    player.isShooting ||
    player.isHurt ||
    player.isDead ||
    !player.onGround
  )
    return;

  player.isAttacking = true;
  player.attackTimer = player.attackDuration;
  player.attackHitDone = false;
  playerAudio.playPunch();
  player.setAnimation(player.throwFrames);
  player.currentFrame = 0;
}

export function updateAttack(player, dt, playerAudio) {
  if (!player.isAttacking) return;
  player.attackTimer -= dt;
  if (!player.attackHitDone && player.world?.enemies) {
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    for (const enemy of player.world.enemies) {
      if (enemy.isDead) continue;
      const ex = enemy.x + enemy.width / 2;
      const ey = enemy.y + enemy.height / 2;
      const dx = ex - px;
      const dy = Math.abs(ey - py);
      if (
        Math.abs(dx) <= player.attackRange &&
        dy <= player.attackHeightTolerance &&
        Math.sign(dx || 1) === player.facing
      ) {
        playerAudio.playHit();
        enemy.takeDamage?.(PLAYER_ATTACK_DAMAGE);
        if (!enemy.isDead && enemy.health > 0 && !enemy.disableHitEffect) {
          player.world?.spawnHitEffect?.(enemy.x, enemy.y, enemy.width, enemy.height);
        }
        player.attackHitDone = true;
        break;
      }
    }
  }
  if (player.attackTimer <= 0) player.isAttacking = false;
}

export function startShoot(player, playerAudio) {
  if (
    player.isShooting ||
    player.isAttacking ||
    player.isHurt ||
    player.isDead ||
    player.shootCooldown > 0
  )
    return false;
  if (player.bulletAmmo <= 0) return false;

  player.isShooting = true;
  player.shootTimer = player.shootDuration;
  player.shootFireTimer = player.shootFireDelay;
  player.shootHasFired = false;
  player.shootFacing = player.facing;
  player.shootCooldown = player.shootCooldownDuration;
  player.setAnimation(player.shootFrames);
  player.currentFrame = 0;
  playerAudio.playShoot();
  return true;
}

export function updateShoot(player, dt) {
  if (!player.isShooting) return;

  if (!player.shootHasFired) {
    player.shootFireTimer -= dt;
    if (player.shootFireTimer <= 0 && player.world?.spawnBullet) {
      const dir = player.shootFacing;
      const muzzleX = player.x + (dir === 1 ? player.width : 0);
      const muzzleY = player.y + player.height * 0.55;
      player.world.spawnBullet(muzzleX, muzzleY, dir);
      if (player.bulletAmmo > 0) player.bulletAmmo = Math.max(0, player.bulletAmmo - 1);
      player.shootHasFired = true;
    }
  }

  player.shootTimer -= dt;
  if (player.shootTimer <= 0) player.isShooting = false;
}

