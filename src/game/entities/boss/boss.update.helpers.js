import { PLAYER_HURT_IMMUNITY_TIME } from "../../../config/config.js";

/**
 * Applies boss gravity and landing.
 * Used to keep state consistent before the next step for physics updates.
 * Applies physics updates like gravity and velocity.
 * @param {Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 */
export function applyBossGravityAndLanding(boss, dt) {
  const previousBottom = boss.y + boss.height;
  boss.applyApexGravity(dt);
  const currentBottom = boss.y + boss.height;
  boss.handlePlatformLanding(previousBottom, currentBottom);
}

/**
 * Applies boss gravity and landing with state.
 * Used to keep state consistent before the next step for physics updates.
 * Applies physics updates like gravity and velocity.
 * @param {Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
export function applyBossGravityAndLandingWithState(boss, dt) {
  const previousBottom = boss.y + boss.height;
  const wasOnGround = boss.onGround;
  boss.applyApexGravity(dt);
  const currentBottom = boss.y + boss.height;
  boss.handlePlatformLanding(previousBottom, currentBottom);
  const landed = !wasOnGround && boss.onGround;
  boss.wasOnGround = boss.onGround;
  return landed;
}

/**
 * Handles boss landing impact.
 * Used to centralize a specific behavior for platform collision handling.
 * @param {Boss} boss Boss instance.
 * @param {Player} player Player instance.
 * @param {*} landed Landed.
 */
export function handleBossLandingImpact(boss, player, landed) {
  if (!landed) return;
  if (player && !player.isDead && player.onGround && player.applyDizzy) {
    player.applyDizzy();
  }
  boss.world?.camera?.shake?.(0.25, 8);
}

/**
 * Handles boss collision damage.
 * Used to centralize a specific behavior for collision and hit testing.
 * @param {Boss} boss Boss instance.
 * @param {Player} player Player instance.
 */
export function handleBossCollisionDamage(boss, player) {
  const playerCanBeHit =
    player &&
    !player.isDead &&
    !player.isSliding &&
    player.invulnerableTimer <= 0;
  const isColliding = playerCanBeHit && boss.collidesWith(player);
  if (!isColliding) return;
  player.takeDamage?.(boss.damage, { useDizzy: false });
  applyPlayerInvulnerability(player);
}

/**
 * Applies player invulnerability.
 * Used to keep state consistent before the next step for world state updates.
 * @param {Player} player Player instance.
 */
function applyPlayerInvulnerability(player) {
  if (typeof player.invulnerableTimer === "number") {
    player.invulnerableTimer = Math.max(player.invulnerableTimer, PLAYER_HURT_IMMUNITY_TIME);
  }
}

/**
 * Updates boss movement animation.
 * Used to advance state during the update loop for animation timing.
 * Advances animation state and sprites.
 * @param {Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 */
export function updateBossMovementAnimation(boss, dt) {
  const walkAnim = boss.isChasing ? boss.runFrames : boss.walkFrames;
  if (boss.hurtAnimTimer > 0 && boss.hurtFrames) {
    boss.setAnimation(boss.hurtFrames);
    boss.animate(dt);
  } else {
    boss.setAnimation(walkAnim);
    boss.animate(dt);
  }
}

/**
 * Clamp boss movement.
 * Used to support physics updates.
 * @param {Boss} boss Boss instance.
 */
export function clampBossMovement(boss) {
  if (Number.isFinite(boss.movementMinX)) {
    boss.x = Math.max(boss.x, boss.movementMinX);
  }
  if (Number.isFinite(boss.movementMaxX)) {
    boss.x = Math.min(boss.x, boss.movementMaxX);
  }
}
