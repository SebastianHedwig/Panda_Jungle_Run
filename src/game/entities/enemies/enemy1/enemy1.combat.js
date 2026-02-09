import { FACING_RIGHT, PLAYER_HURT_IMMUNITY_TIME } from "../../../../config/config.js";

/**
 * Try deal attack damage. If omitted, default values are used.
 * Used to support combat effects.
 * @param {Player} player Player instance.
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
 * Used to centralize a specific behavior for combat effects.
 * Advances animation state and sprites.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 * @param {Player} player Player instance.
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
 * Used to advance state during the update loop for timed actions.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 */
function updateAttackTimer(enemy, dt) {
  enemy.attackTimer -= dt;
}

/**
 * Updates attack movement.
 * Used to advance state during the update loop for combat effects.
 * Advances animation state and sprites.
 * @param {EnemyBase} enemy Enemy instance.
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
 * Used to decide combat outcomes.
 * @param {EnemyBase} enemy Enemy instance.
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
 * Used to support combat effects.
 * Advances animation state and sprites.
 * @param {EnemyBase} enemy Enemy instance.
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
 * Used to support combat effects.
 * @param {EnemyBase} enemy Enemy instance.
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
 * Used to support combat effects.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Player} playerInfo Player info.
 * @param {Player} player Player instance.
 * @returns {*} Result value.
 */
export function tryStartAttackIfInRange(enemy, playerInfo, player) {
  return enemy.tryStartAttack(playerInfo, player);
}

/**
 * Handles player collision.
 * Used to centralize a specific behavior for collision and hit testing.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Player} player Player instance.
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
 * Used to keep state consistent before the next step for combat effects.
 * @param {Player} player Player instance.
 */
function applyPlayerInvulnerability(player) {
  if (typeof player.invulnerableTimer === "number") {
    player.invulnerableTimer = Math.max(player.invulnerableTimer, PLAYER_HURT_IMMUNITY_TIME);
  }
}

/**
 * Can deal attack damage.
 * Used to decide combat outcomes.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Player} player Player instance.
 * @returns {boolean} Whether deal attack damage.
 */
function canDealAttackDamage(enemy, player) {
  return !!player && !player.isDead && !enemy.isDead && !enemy.hasHitDuringAttack;
}

/**
 * Returns attack context.
 * Used to provide attack context for combat effects.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Player} player Player instance.
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
 * Used to decide combat outcomes.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {*} attackContext Attack context.
 * @param {Player} player Player instance.
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
 * Used to keep state consistent before the next step for combat effects.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Player} player Player instance.
 * @param {*} popupDelay Popup delay.
 */
function applyAttackDamageToPlayer(enemy, player, popupDelay) {
  const dmg = enemy.attackDamageCurrent ?? enemy.damage;
  player.takeDamage?.(dmg, { popupDelay });
  applyPlayerInvulnerability(player);
}

