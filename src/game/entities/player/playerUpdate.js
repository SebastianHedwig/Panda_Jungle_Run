import {
  FACING_LEFT,
  FACING_RIGHT,
  PLAYER_SLIDE_DAMAGE,
} from "../../../config/config.js";

/**
 * Updates player.
 * Triggers audio playback or updates audio state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {import("../../../engine/input/input.class.js").Input} input Input handler.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 */
export function updatePlayer(player, dt, input, playerAudio) {
  prepareUpdateFrame(player, playerAudio);
  updateCooldownsAndTimers(player, dt);
  if (handleDeathFlow(player, dt)) return;
  if (handleHurtFlow(player, dt)) return;
  if (handleCombatFlow(player, dt, input)) return;
  if (handleSlideFlow(player, dt, input, playerAudio)) return;
  handleMovementAndJump(player, dt, input, playerAudio);
}

/**
 * Prepares update frame.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 */
function prepareUpdateFrame(player, playerAudio) {
  player._preCollisionX = player.x;
  if (player.healthPoints > 0) return;
  if (!player.isDead) player.startDeath();
  else playDeathSoundOnce(player, playerAudio);
}

/**
 * Plays death sound once.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 */
function playDeathSoundOnce(player, playerAudio) {
  if (player.deathSoundPlayed) return;
  playerAudio.playDead();
  player.deathSoundPlayed = true;
}

/**
 * Updates cooldowns and timers.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function updateCooldownsAndTimers(player, dt) {
  const slideJustEnded = player.wasSlidingPreviousFrame && !player.isSliding;
  updateSlideBlockGrace(player, dt);
  updateShootCooldown(player, dt);
  updateGunPulse(player, dt);
  updateInvulnerabilityTimers(player, dt);
  if (slideJustEnded) applyPostSlideInvulnerability(player);
}

/**
 * Updates slide block grace.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function updateSlideBlockGrace(player, dt) {
  if (player.slideBlockGrace > 0) {
    player.slideBlockGrace = Math.max(0, player.slideBlockGrace - dt);
  }
}

/**
 * Updates shoot cooldown.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function updateShootCooldown(player, dt) {
  if (player.shootCooldown > 0) {
    player.shootCooldown = Math.max(0, player.shootCooldown - dt);
  }
}

/**
 * Updates gun pulse.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function updateGunPulse(player, dt) {
  const gunPulseDecayRate = 4;
  if (player.gunPulse > 0) player.gunPulse = Math.max(0, player.gunPulse - dt * gunPulseDecayRate);
}

/**
 * Updates invulnerability timers.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function updateInvulnerabilityTimers(player, dt) {
  if (player.invulnerableTimer > 0) {
    player.invulnerableTimer = Math.max(0, player.invulnerableTimer - dt);
  }
  if (player.slideInvulWindow > 0) {
    player.slideInvulWindow = Math.max(0, player.slideInvulWindow - dt);
  }
}

/**
 * Handles death flow.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
function handleDeathFlow(player, dt) {
  if (!player.isDead) return false;
  updateDeathMovement(player, dt);
  updateDeathFrames(player, dt);
  player.wasSlidingPreviousFrame = player.isSliding;
  return true;
}

/**
 * Updates death movement.
 * Advances animation state and sprites.
 * Applies physics updates like gravity and velocity.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function updateDeathMovement(player, dt) {
  player.setAnimation(player.dieFrames);
  const previousBottom = player.y + player.height;
  player.applyApexGravity(dt);
  const currentBottom = player.y + player.height;
  player.handleDeathLanding(previousBottom, currentBottom);
}

/**
 * Updates death frames.
 * Advances animation state and sprites.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function updateDeathFrames(player, dt) {
  if (player.deathDone) return;
  player.frameTime += dt;
  if (player.frameTime < player.frameSpeed) return;
  player.frameTime = 0;
  advanceDeathFrame(player);
}

/**
 * Advances death frame.
 * Advances animation state and sprites.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function advanceDeathFrame(player) {
  const lastDeathFrameIndex = player.currentAnimation.length - 1;
  const nextDeathFrameIndex = player.currentFrame + 1;
  player.currentFrame = Math.min(nextDeathFrameIndex, lastDeathFrameIndex);
  player.sprite = player.currentAnimation[player.currentFrame];
  if (player.currentFrame === lastDeathFrameIndex) player.deathDone = true;
}

/**
 * Handles hurt flow.
 * Applies physics updates like gravity and velocity.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
function handleHurtFlow(player, dt) {
  player.updateHurt(dt);
  if (!player.isHurt) return false;
  if (player.hurtUseDizzy) applyHurtAnimation(player, dt);
  player.applyApexGravity(dt);
  player.wasSlidingPreviousFrame = player.isSliding;
  return true;
}

/**
 * Applies hurt animation.
 * Advances animation state and sprites.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function applyHurtAnimation(player, dt) {
  const hurtAnim = player.hurtPhase === "hurt"
    ? player.hurtFrames
    : player.dizzyFrames || player.hurtFrames;
  player.setAnimation(hurtAnim);
  player.animate(dt);
}

/**
 * Handles combat flow.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {import("../../../engine/input/input.class.js").Input} input Input handler.
 * @returns {*} Result value.
 */
function handleCombatFlow(player, dt, input) {
  handleAttackShootInput(player, input);
  player.updateShoot(dt);
  if (handleShooting(player, dt)) return true;
  player.updateAttack(dt);
  if (handleAttacking(player, dt)) return true;
  handleQueuedAttack(player);
  return false;
}

/**
 * Handles attack shoot input.
 * Reads input state to decide actions.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("../../../engine/input/input.class.js").Input} input Input handler.
 */
function handleAttackShootInput(player, input) {
  if (!input.isPressed("Enter")) return;
  if (player.bulletAmmo > 0) player.startShoot();
  else if (!player.startAttack()) player.attackQueued = true;
}

/**
 * Handles shooting.
 * Advances animation state and sprites.
 * Applies physics updates like gravity and velocity.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
function handleShooting(player, dt) {
  if (!player.isShooting) return false;
  player.setAnimation(player.shootFrames);
  player.applyApexGravity(dt);
  player.animate(dt);
  player.wasSlidingPreviousFrame = player.isSliding;
  return true;
}

/**
 * Handles attacking.
 * Advances animation state and sprites.
 * Applies physics updates like gravity and velocity.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
function handleAttacking(player, dt) {
  if (!player.isAttacking) return false;
  player.setAnimation(player.throwFrames);
  player.applyApexGravity(dt);
  player.animate(dt);
  player.wasSlidingPreviousFrame = player.isSliding;
  return true;
}

/**
 * Handles queued attack.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function handleQueuedAttack(player) {
  if (!player.attackQueued) return;
  if (!player.onGround || player.isHurt || player.isDead || player.isShooting) return;
  if (player.startAttack()) player.attackQueued = false;
}

/**
 * Handles slide flow.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {import("../../../engine/input/input.class.js").Input} input Input handler.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 * @returns {*} Result value.
 */
function handleSlideFlow(player, dt, input, playerAudio) {
  const slideKeysDown = getSlideKeysDown(input);
  if (player.isSliding) return updateSlidingState(player, dt, playerAudio);
  if (shouldStartSlide(player, slideKeysDown, input)) {
    startSlideFromInput(player);
    return true;
  }
  updateSlideReady(player, slideKeysDown);
  return false;
}

/**
 * Returns slide keys down.
 * Reads input state to decide actions.
 * @param {import("../../../engine/input/input.class.js").Input} input Input handler.
 * @returns {*} Slide keys down.
 */
function getSlideKeysDown(input) {
  return input.isDown("Shift") && (input.isDown("s") || input.isDown("ArrowDown"));
}

/**
 * Should start slide.
 * Reads input state to decide actions.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {*} slideKeysDown Slide keys down.
 * @param {import("../../../engine/input/input.class.js").Input} input Input handler.
 * @returns {boolean} Whether start slide.
 */
function shouldStartSlide(player, slideKeysDown, input) {
  if (!player.onGround || !slideKeysDown || !player.slideReady) return false;
  return (
    input.isDown("ArrowLeft") ||
    input.isDown("ArrowRight") ||
    input.isDown("a") ||
    input.isDown("d")
  );
}

/**
 * Starts slide from input.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function startSlideFromInput(player) {
  player.startSlide();
  player.slideReady = false;
  player.wasSlidingPreviousFrame = player.isSliding;
}

/**
 * Updates slide ready.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {*} slideKeysDown Slide keys down.
 */
function updateSlideReady(player, slideKeysDown) {
  if (!slideKeysDown) player.slideReady = true;
}

/**
 * Updates sliding state.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 * @returns {*} Result value.
 */
function updateSlidingState(player, dt, playerAudio) {
  const slideDistanceTraveled = updateSlidePosition(player, dt);
  updateSlideInvulnerability(player);
  if (slideDistanceTraveled >= player.slideDistance) endSlide(player);
  checkSlideHits(player, playerAudio);
  applySlideAnimation(player, dt);
  player.wasSlidingPreviousFrame = player.isSliding;
  return true;
}

/**
 * Updates slide position.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
function updateSlidePosition(player, dt) {
  const slideDistanceTraveled = Math.abs(player.x - player.slideStartX);
  const slideProgressCap = 1;
  const slideSlowdownFactor = 0.4;
  const slideProgress = Math.min(slideDistanceTraveled / player.slideDistance, slideProgressCap);
  const slideSpeedFactor = slideProgressCap - slideProgress * slideSlowdownFactor;
  const speed = player.slideSpeed * slideSpeedFactor;
  player.x += player.slideDirection * speed * dt;
  return slideDistanceTraveled;
}

/**
 * Updates slide invulnerability.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function updateSlideInvulnerability(player) {
  player.invulnerableTimer = Math.max(player.invulnerableTimer, player.slideInvulnerableDuring);
  player.slideInvulWindow = Math.max(player.slideInvulWindow, player.slideInvulnerableDuring);
}

/**
 * End slide.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function endSlide(player) {
  player.isSliding = false;
  applyPostSlideInvulnerability(player);
}

/**
 * Applies slide animation.
 * Advances animation state and sprites.
 * Applies physics updates like gravity and velocity.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function applySlideAnimation(player, dt) {
  player.setAnimation(player.slideFrames);
  player.applyApexGravity(dt);
  player.animate(dt);
}

/**
 * Handles movement and jump.
 * Triggers audio playback or updates audio state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {import("../../../engine/input/input.class.js").Input} input Input handler.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 */
function handleMovementAndJump(player, dt, input, playerAudio) {
  const directionState = getDirectionState(input);
  const moving = applyDirectionalMovement(player, dt, directionState);
  const running = applyRunningSpeed(player, moving, input);
  applyMovementAnimation(player, moving, running);
  handleAdvancedJump(player, dt, input, playerAudio);
  finalizeMovement(player, dt);
}

/**
 * Returns direction state.
 * Reads input state to decide actions.
 * @param {import("../../../engine/input/input.class.js").Input} input Input handler.
 * @returns {Object} Direction state.
 */
function getDirectionState(input) {
  const leftDown = input.isDown("ArrowLeft") || input.isDown("a");
  const rightDown = input.isDown("ArrowRight") || input.isDown("d");
  const bothDirectionsDown = leftDown && rightDown;
  return { leftDown, rightDown, bothDirectionsDown };
}

/**
 * Applies directional movement.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {*} directionState Direction state.
 * @returns {*} Result value.
 */
function applyDirectionalMovement(player, dt, directionState) {
  if (directionState.bothDirectionsDown) return false;
  let moving = false;
  if (directionState.leftDown) {
    player.moveLeft(dt);
    player.facing = FACING_LEFT; moving = true;
  }
  if (directionState.rightDown) {
    player.moveRight(dt);
    player.facing = FACING_RIGHT; moving = true;
  }
  return moving;
}

/**
 * Applies running speed.
 * Reads input state to decide actions.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {*} moving Moving.
 * @param {import("../../../engine/input/input.class.js").Input} input Input handler.
 * @returns {*} Result value.
 */
function applyRunningSpeed(player, moving, input) {
  if (moving && input.isDown("Shift")) {
    player.speed = player.defaultSpeed * player.runMultiplier;
    return true;
  }
  player.speed = player.defaultSpeed;
  return false;
}

/**
 * Applies movement animation.
 * Advances animation state and sprites.
 * Applies physics updates like gravity and velocity.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {*} moving Moving.
 * @param {*} running Running.
 */
function applyMovementAnimation(player, moving, running) {
  if (!player.onGround) player.setAnimation(player.jumpFrames);
  else if (running) player.setAnimation(player.runFrames);
  else if (moving) player.setAnimation(player.walkFrames);
  else player.setAnimation(player.idleFrames);
}

/**
 * Handles advanced jump.
 * Triggers audio playback or updates audio state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {import("../../../engine/input/input.class.js").Input} input Input handler.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 */
function handleAdvancedJump(player, dt, input, playerAudio) {
  updateJumpInput(player, input);
  updateCoyoteTimer(player, dt);
  tryConsumeJumpBuffer(player, playerAudio);
  applyJumpCut(player);
  decayJumpBuffer(player, dt);
}

/**
 * Updates jump input.
 * Reads input state to decide actions.
 * Applies physics updates like gravity and velocity.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("../../../engine/input/input.class.js").Input} input Input handler.
 */
function updateJumpInput(player, input) {
  if (input.isPressed(" ")) {
    player.jumpBufferTimer = player.jumpBufferTime;
    player.jumpHeld = true;
  } else if (!input.isDown(" ")) player.jumpHeld = false;
}

/**
 * Updates coyote timer.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function updateCoyoteTimer(player, dt) {
  if (player.onGround) player.coyoteTimer = player.coyoteTime;
  else player.coyoteTimer -= dt;
}

/**
 * Try consume jump buffer.
 * Triggers audio playback or updates audio state.
 * Applies physics updates like gravity and velocity.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 */
function tryConsumeJumpBuffer(player, playerAudio) {
  if (player.jumpBufferTimer <= 0 || player.coyoteTimer <= 0) return;
  playerAudio.playJump();
  player.jump();
  player.jumpBufferTimer = 0;
}

/**
 * Applies jump cut.
 * Applies physics updates like gravity and velocity.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function applyJumpCut(player) {
  if (!player.jumpHeld && player.velocityY < 0) player.velocityY *= player.jumpCutMultiplier;
}

/**
 * Decay jump buffer.
 * Applies physics updates like gravity and velocity.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function decayJumpBuffer(player, dt) {
  player.jumpBufferTimer -= dt;
}

/**
 * Finalize movement.
 * Advances animation state and sprites.
 * Applies physics updates like gravity and velocity.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function finalizeMovement(player, dt) {
  player.applyApexGravity(dt);
  player.animate(dt);
  player.wasSlidingPreviousFrame = player.isSliding;
}

/**
 * Checks slide hits.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 */
function checkSlideHits(player, playerAudio) {
  if (!player.world?.enemies?.length) return;
  const playerHitbox = player.getHitbox();
  for (const enemy of player.world.enemies) {
    if (!shouldCheckSlideEnemy(player, enemy)) continue;
    const enemyHitbox = getEnemyHitbox(enemy);
    if (!enemyHitbox) continue;
    if (!isHitboxOverlapping(playerHitbox, enemyHitbox)) continue;
    applySlideHit(player, enemy, playerAudio);
  }
}

/**
 * Should check slide enemy.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("../enemies/enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @returns {boolean} Whether check slide enemy.
 */
function shouldCheckSlideEnemy(player, enemy) {
  return !enemy.isDead && !player.slideHitEnemies.has(enemy);
}

/**
 * Returns enemy hitbox.
 * Updates the enemy state.
 * @param {import("../enemies/enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @returns {*} Enemy hitbox.
 */
function getEnemyHitbox(enemy) {
  return enemy.getHitbox ? enemy.getHitbox() : null;
}

/**
 * Is hitbox overlapping.
 * Performs hitbox or collision checks.
 * @param {*} hitboxA Hitbox A.
 * @param {*} hitboxB Hitbox B.
 * @returns {boolean} Whether hitbox overlapping.
 */
function isHitboxOverlapping(hitboxA, hitboxB) {
  return (
    hitboxA.x < hitboxB.x + hitboxB.width &&
    hitboxA.x + hitboxA.width > hitboxB.x &&
    hitboxA.y < hitboxB.y + hitboxB.height &&
    hitboxA.y + hitboxA.height > hitboxB.y
  );
}

/**
 * Applies slide hit.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("../enemies/enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 */
function applySlideHit(player, enemy, playerAudio) {
  playerAudio.playHit();
  const dmg = player.slideDamage ?? PLAYER_SLIDE_DAMAGE;
  enemy.takeDamage?.(dmg, { skipStun: true, source: "slide" });
  spawnSlideHitEffect(player, enemy);
  player.slideHitEnemies.add(enemy);
}

/**
 * Spawns slide hit effect.
 * Updates the player state.
 * Spawns visual feedback effects.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("../enemies/enemyBase.class.js").EnemyBase} enemy Enemy instance.
 */
function spawnSlideHitEffect(player, enemy) {
  if (enemy.isDead || enemy.health <= 0 || enemy.disableHitEffect) return;
  const hitEffectX = enemy.x;
  const hitEffectY = enemy.y;
  const hitEffectWidth = enemy.width;
  const hitEffectHeight = enemy.height;
  player.world?.spawnHitEffect?.(hitEffectX, hitEffectY, hitEffectWidth, hitEffectHeight);
}

/**
 * Applies post slide invulnerability.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function applyPostSlideInvulnerability(player) {
  player.invulnerableTimer = Math.max(
    player.invulnerableTimer,
    player.slideInvulnerableAfter
  );
  player.slideInvulWindow = Math.max(
    player.slideInvulWindow,
    player.slideInvulnerableAfter
  );
}
