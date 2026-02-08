import { PLAYER_ATTACK_DAMAGE, FACING_RIGHT } from "../../../config/config.js";

/**
 * Starts attack.
 * Triggers audio playback or updates audio state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 * @returns {*} Result value.
 */
export function startAttack(player, playerAudio) {
  if (!canStartAttack(player)) return false;
  prepareAttackState(player);
  playerAudio.playPunch();
  return true;
}

/**
 * Can start attack.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @returns {boolean} Whether start attack.
 */
function canStartAttack(player) {
  if (player.bulletAmmo > 0) return false;
  return !(
    player.isAttacking ||
    player.isShooting ||
    player.isHurt ||
    player.isDead ||
    !player.onGround
  );
}

/**
 * Prepares attack state.
 * Advances animation state and sprites.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function prepareAttackState(player) {
  player.isAttacking = true;
  player.attackTimer = player.attackDuration;
  player.attackHitDone = false;
  player.setAnimation(player.throwFrames);
  player.currentFrame = 0;
}

/**
 * Updates attack.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 */
export function updateAttack(player, dt, playerAudio) {
  if (!player.isAttacking) return;
  player.attackTimer -= dt;
  if (shouldCheckAttackHit(player)) tryAttackHit(player, playerAudio);
  if (player.attackTimer <= 0) player.isAttacking = false;
}

/**
 * Should check attack hit.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @returns {boolean} Whether check attack hit.
 */
function shouldCheckAttackHit(player) {
  return !player.attackHitDone && player.world?.enemies;
}

/**
 * Try attack hit.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 */
function tryAttackHit(player, playerAudio) {
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  for (const enemy of player.world.enemies) {
    if (enemy.isDead) continue;
    if (!isEnemyInAttackRange(player, enemy, playerCenterX, playerCenterY)) continue;
    applyAttackHit(player, enemy, playerAudio);
    break;
  }
}

/**
 * Is enemy in attack range.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("../enemies/base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} playerCenterX Player center X.
 * @param {number} playerCenterY Player center Y.
 * @returns {boolean} Whether enemy in attack range.
 */
function isEnemyInAttackRange(player, enemy, playerCenterX, playerCenterY) {
  const enemyCenterX = enemy.x + enemy.width / 2;
  const enemyCenterY = enemy.y + enemy.height / 2;
  const deltaX = enemyCenterX - playerCenterX;
  const deltaY = Math.abs(enemyCenterY - playerCenterY);
  return (
    Math.abs(deltaX) <= player.attackRange &&
    deltaY <= player.attackHeightTolerance &&
    Math.sign(deltaX || 1) === player.facing
  );
}

/**
 * Applies attack hit.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("../enemies/base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 */
function applyAttackHit(player, enemy, playerAudio) {
  playerAudio.playHit();
  enemy.takeDamage?.(PLAYER_ATTACK_DAMAGE);
  spawnEnemyHitEffect(player, enemy);
  player.attackHitDone = true;
}

/**
 * Spawns enemy hit effect.
 * Updates the player state.
 * Spawns visual feedback effects.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("../enemies/base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 */
function spawnEnemyHitEffect(player, enemy) {
  if (enemy.isDead || enemy.health <= 0 || enemy.disableHitEffect) return;
  const hitEffectX = enemy.x;
  const hitEffectY = enemy.y;
  const hitEffectWidth = enemy.width;
  const hitEffectHeight = enemy.height;
  player.world?.spawnHitEffect?.(hitEffectX, hitEffectY, hitEffectWidth, hitEffectHeight);
}

/**
 * Starts shoot.
 * Triggers audio playback or updates audio state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 * @returns {*} Result value.
 */
export function startShoot(player, playerAudio) {
  if (!canStartShoot(player)) return false;
  prepareShootState(player);
  playerAudio.playShoot();
  return true;
}

/**
 * Can start shoot.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @returns {boolean} Whether start shoot.
 */
function canStartShoot(player) {
  if (player.bulletAmmo <= 0) return false;
  return !(
    player.isShooting ||
    player.isAttacking ||
    player.isHurt ||
    player.isDead ||
    player.shootCooldown > 0
  );
}

/**
 * Prepares shoot state.
 * Advances animation state and sprites.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function prepareShootState(player) {
  player.isShooting = true;
  player.shootTimer = player.shootDuration;
  player.shootFireTimer = player.shootFireDelay;
  player.shootHasFired = false;
  player.shootFacing = player.facing;
  player.shootCooldown = player.shootCooldownDuration;
  player.setAnimation(player.shootFrames);
  player.currentFrame = 0;
}

/**
 * Updates shoot.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
export function updateShoot(player, dt) {
  if (!player.isShooting) return;
  handleShotFiring(player, dt);
  player.shootTimer -= dt;
  if (player.shootTimer <= 0) player.isShooting = false;
}

/**
 * Handles shot firing.
 * Updates the player state.
 * Spawns visual feedback effects.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function handleShotFiring(player, dt) {
  if (player.shootHasFired) return;
  player.shootFireTimer -= dt;
  if (player.shootFireTimer > 0) return;
  if (!player.world?.spawnBullet) return;
  spawnPlayerBullet(player);
  consumeBulletAmmo(player);
  player.shootHasFired = true;
}

/**
 * Spawns player bullet.
 * Updates the player state.
 * Spawns visual feedback effects.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function spawnPlayerBullet(player) {
  const facingDirection = player.shootFacing;
  const muzzleHeightFactor = 0.55;
  const muzzleX = player.x + (facingDirection === FACING_RIGHT ? player.width : 0);
  const muzzleY = player.y + player.height * muzzleHeightFactor;
  player.world.spawnBullet(muzzleX, muzzleY, facingDirection);
}

/**
 * Consume bullet ammo.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function consumeBulletAmmo(player) {
  if (player.bulletAmmo > 0) player.bulletAmmo = Math.max(0, player.bulletAmmo - 1);
}

