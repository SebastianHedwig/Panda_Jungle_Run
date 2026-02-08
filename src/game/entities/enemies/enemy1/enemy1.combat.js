import { FACING_RIGHT, PLAYER_HURT_IMMUNITY_TIME } from "../../../../config/config.js";

/**
 * Try deal attack damage. If omitted, default values are used.
 * Updates the player state.
 * @param {import("../../player/player.class.js").Player} player Player instance.
 * @param {*} [popupDelay] Popup delay.
 * @returns {*} Result value.
 */
export function tryDealAttackDamage(player, popupDelay = 0) {
  if (!canDealAttackDamage(this, player)) return false;
  const attackContext = getAttackContext(this, player);
  if (!isAttackContactValid(this, attackContext, player)) return false;
  if (player.isSliding) return false;
  applyAttackDamageToPlayer(this, player, popupDelay);
  this.hasHitDuringAttack = true;
  return true;
}

/**
 * Handles attack state.
 * Advances animation state and sprites.
 * Updates the enemy state.
 * @param {import("../base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 * @param {import("../../player/player.class.js").Player} player Player instance.
 * @returns {*} Result value.
 */
export function handleAttackState(enemy, dt, player) {
  if (!enemy.isAttacking) return false;
  updateAttackTimer(enemy, dt);
  updateAttackMovement(enemy, dt);
  enemy.animate(dt);
  enemy.tryDealAttackDamage(player, 0.2);
  finishAttackIfNeeded(enemy);
  enemy.applyAttackPhysics(dt);
  enemy.isChasing = false;
  return true;
}

/**
 * Updates attack timer.
 * Updates the enemy state.
 * @param {import("../base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 */
function updateAttackTimer(enemy, dt) {
  enemy.attackTimer -= dt;
}

/**
 * Updates attack movement.
 * Advances animation state and sprites.
 * Updates the enemy state.
 * @param {import("../base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 */
function updateAttackMovement(enemy, dt) {
  const attackFrames = enemy.activeAttackFrames || enemy.attackFrames;
  enemy.setAnimation(attackFrames);
  if (!enemy.attackMoveSpeed) return;
  const nextX = enemy.x + enemy.attackMoveSpeed * enemy.facing * dt;
  if (shouldStopAttackAtEdge(enemy, nextX)) { endSlidingAttack(enemy);
  } else {
    enemy.x = nextX;
  }
}

/**
 * Should stop attack at edge.
 * Updates the enemy state.
 * @param {import("../base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} nextX Next X.
 * @returns {boolean} Whether stop attack at edge.
 */
function shouldStopAttackAtEdge(enemy, nextX) {
  const platform = enemy.getPlatformUnderfoot();
  if (!platform) return false;
  const nextFoot = nextX + enemy.width / 2;
  return nextFoot <= platform.left + enemy.edgeMargin || nextFoot >= platform.right - enemy.edgeMargin;
}

/**
 * End sliding attack.
 * Advances animation state and sprites.
 * Updates the enemy state.
 * @param {import("../base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 */
function endSlidingAttack(enemy) {
  enemy.isAttacking = false;
  enemy.attackMoveSpeed = 0;
  enemy.hasHitDuringAttack = false;
  enemy.setAnimation(enemy.idleFrames);
  enemy.currentFrame = 0;
}

/**
 * Finish attack if needed.
 * Updates the enemy state.
 * @param {import("../base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 */
function finishAttackIfNeeded(enemy) {
  if (enemy.attackTimer > 0) return;
  enemy.isAttacking = false;
  enemy.hasHitDuringAttack = false;
  enemy.attackMoveSpeed = 0;
  enemy.activeAttackFrames = null;
}

/**
 * Try start attack if in range.
 * Updates the enemy state.
 * @param {import("../base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../../player/player.class.js").Player} playerInfo Player info.
 * @param {import("../../player/player.class.js").Player} player Player instance.
 * @returns {*} Result value.
 */
export function tryStartAttackIfInRange(enemy, playerInfo, player) {
  return enemy.tryStartAttack(playerInfo, player);
}

/**
 * Handles player collision.
 * Updates the player state.
 * @param {import("../base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../../player/player.class.js").Player} player Player instance.
 */
export function handlePlayerCollision(enemy, player) {
  const playerCanBeHit =
    player &&
    !player.isDead &&
    !player.isSliding &&
    player.invulnerableTimer <= 0;
  const isColliding = playerCanBeHit && enemy.collidesWith(player);
  if (!isColliding) return;
  player.takeDamage?.(enemy.damage, { useDizzy: false });
  applyPlayerInvulnerability(player);
}

/**
 * Applies player invulnerability.
 * Updates the player state.
 * @param {import("../../player/player.class.js").Player} player Player instance.
 */
function applyPlayerInvulnerability(player) {
  if (typeof player.invulnerableTimer === "number") {
    player.invulnerableTimer = Math.max(player.invulnerableTimer, PLAYER_HURT_IMMUNITY_TIME);
  }
}

/**
 * Can deal attack damage.
 * Updates the player state.
 * @param {import("../base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../../player/player.class.js").Player} player Player instance.
 * @returns {boolean} Whether deal attack damage.
 */
function canDealAttackDamage(enemy, player) {
  return !!player && !player.isDead && !enemy.isDead && !enemy.hasHitDuringAttack;
}

/**
 * Returns attack context.
 * Updates the player state.
 * @param {import("../base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../../player/player.class.js").Player} player Player instance.
 * @returns {Object} Attack context.
 */
function getAttackContext(enemy, player) {
  const enemyCenterX = enemy.x + enemy.width / 2;
  const enemyCenterY = enemy.y + enemy.height / 2;
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  const deltaX = playerCenterX - enemyCenterX;
  const absoluteDeltaY = Math.abs(playerCenterY - enemyCenterY);
  const facingMatches = Math.sign(deltaX || FACING_RIGHT) === enemy.facing;
  return { deltaX, absoluteDeltaY, facingMatches };
}

/**
 * Is attack contact valid.
 * Updates the player state.
 * @param {import("../base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {*} attackContext Attack context.
 * @param {import("../../player/player.class.js").Player} player Player instance.
 * @returns {boolean} Whether attack contact valid.
 */
function isAttackContactValid(enemy, attackContext, player) {
  if (!attackContext.facingMatches) return false;
  if (Math.abs(attackContext.deltaX) > enemy.attackRange) return false;
  if (attackContext.absoluteDeltaY > enemy.attackHeightTolerance) return false;
  return player.invulnerableTimer <= 0;
}

/**
 * Applies attack damage to player.
 * Updates the player state.
 * @param {import("../base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../../player/player.class.js").Player} player Player instance.
 * @param {*} popupDelay Popup delay.
 */
function applyAttackDamageToPlayer(enemy, player, popupDelay) {
  const dmg = enemy.attackDamageCurrent ?? enemy.damage;
  player.takeDamage?.(dmg, { popupDelay });
  applyPlayerInvulnerability(player);
}

