const dizzyFrameDurationMultiplier = 2;

/**
 * Applies dizzy. If omitted, default values are used.
 * Used to keep state consistent before the next step for combat effects.
 * Advances animation state and sprites.
 * @param {Player} player Player instance.
 * @param {number} [dizzyDuration] Dizzy duration.
 */
export function applyDizzy(player, dizzyDuration = 0) {
  if (player.isDead) return;
  const base = player.dizzyFrames?.length * player.frameSpeed * dizzyFrameDurationMultiplier;
  player.hurtPhase = "dizzy";
  player.isHurt = true;
  player.hurtUseDizzy = true;
  player.hurtPhaseTimer = dizzyDuration > 0 ? dizzyDuration : base;
  player.setAnimation(player.dizzyFrames || player.hurtFrames);
  player.currentFrame = 0;
}

/**
 * Starts hurt. If omitted, default values are used.
 * Used to support combat effects.
 * @param {Player} player Player instance.
 * @param {*} [useDizzy] Use dizzy.
 * @returns {*} Result value.
 */
export function startHurt(player, useDizzy = true) {
  if (player.isDead) return;
  player.hurtUseDizzy = !!useDizzy;
  if (!player.hurtUseDizzy) return applyNoDizzyHurt(player);
  beginHurtPhases(player);
}

/**
 * Applies no dizzy hurt.
 * Used to keep state consistent before the next step for combat effects.
 * @param {Player} player Player instance.
 */
function applyNoDizzyHurt(player) {
  player.invulnerableTimer = Math.max(player.invulnerableTimer, player.invulnerableBlinkWindow);
  player.isHurt = false;
}

/**
 * Begin hurt phases.
 * Used to support combat effects.
 * @param {Player} player Player instance.
 */
function beginHurtPhases(player) {
  player.isHurt = true;
  const { hurtDuration, dizzyDuration } = getHurtDurations(player);
  player.hurtPhase = "hurt";
  player.hurtPhaseTimer = hurtDuration;
  player.invulnerableTimer = hurtDuration + dizzyDuration + player.invulnerableBlinkWindow;
  resetCombatOnHurt(player);
  if (player.hurtUseDizzy) setHurtAnimation(player);
}

/**
 * Returns hurt durations.
 * Used to provide hurt durations for combat effects.
 * Advances animation state and sprites.
 * @param {Player} player Player instance.
 * @returns {Object} Hurt durations.
 */
function getHurtDurations(player) {
  const hurtDuration = (player.hurtFrames?.length) * player.frameSpeed;
  const dizzyDuration = player.hurtUseDizzy && player.dizzyFrames
    ? player.dizzyFrames.length * player.frameSpeed * dizzyFrameDurationMultiplier
    : 0;
  return { hurtDuration, dizzyDuration };
}

/**
 * Resets combat on hurt.
 * Used to support combat effects.
 * @param {Player} player Player instance.
 */
function resetCombatOnHurt(player) {
  player.isAttacking = false;
  player.isShooting = false;
}

/**
 * Sets hurt animation.
 * Used to support animation timing.
 * Advances animation state and sprites.
 * @param {Player} player Player instance.
 */
function setHurtAnimation(player) {
  player.setAnimation(player.dizzyFrames);
  player.currentFrame = 0;
}

/**
 * Updates hurt.
 * Used to advance state during the update loop for combat effects.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
export function updateHurt(player, dt) {
  if (!player.isHurt) return;
  player.hurtPhaseTimer -= dt;
  if (player.hurtPhaseTimer > 0) return;
  if (shouldEnterDizzy(player)) return startDizzyPhase(player);
  endHurt(player);
}

/**
 * Should enter dizzy.
 * Used to decide combat outcomes.
 * @param {Player} player Player instance.
 * @returns {boolean} Whether enter dizzy.
 */
function shouldEnterDizzy(player) {
  return player.hurtUseDizzy && player.hurtPhase === "hurt" && player.dizzyFrames;
}

/**
 * Starts dizzy phase.
 * Used to support combat effects.
 * Advances animation state and sprites.
 * @param {Player} player Player instance.
 */
function startDizzyPhase(player) {
  player.hurtPhase = "dizzy";
  player.hurtPhaseTimer = getDizzyPhaseDuration(player);
  player.setAnimation(player.dizzyFrames);
  player.currentFrame = 0;
}

/**
 * Returns dizzy phase duration.
 * Used to provide dizzy phase duration for timed actions.
 * Advances animation state and sprites.
 * @param {Player} player Player instance.
 * @returns {*} Dizzy phase duration.
 */
function getDizzyPhaseDuration(player) {
  return (
    player.dizzyFrames.length *
      player.frameSpeed *
      dizzyFrameDurationMultiplier ||
    player.hurtDuration
  );
}

/**
 * End hurt.
 * Used to support combat effects.
 * @param {Player} player Player instance.
 */
function endHurt(player) {
  player.isHurt = false;
  player.hurtPhase = null;
}
