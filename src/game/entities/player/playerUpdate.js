import {
  FACING_LEFT,
  FACING_RIGHT,
  PLAYER_SLIDE_DAMAGE,
} from "../../../config/config.js";

export function updatePlayer(player, dt, input, playerAudio) {
  prepareUpdateFrame(player, playerAudio);
  updateCooldownsAndTimers(player, dt);
  if (handleDeathFlow(player, dt)) return;
  if (handleHurtFlow(player, dt)) return;
  if (handleCombatFlow(player, dt, input)) return;
  if (handleSlideFlow(player, dt, input, playerAudio)) return;
  handleMovementAndJump(player, dt, input, playerAudio);
}

function prepareUpdateFrame(player, playerAudio) {
  player._preCollisionX = player.x;
  if (player.healthPoints > 0) return;
  if (!player.isDead) player.startDeath();
  else playDeathSoundOnce(player, playerAudio);
}

function playDeathSoundOnce(player, playerAudio) {
  if (player.deathSoundPlayed) return;
  playerAudio.playDead();
  player.deathSoundPlayed = true;
}

/** COOLDOWN TIMERS */
function updateCooldownsAndTimers(player, dt) {
  const slideJustEnded = player.wasSlidingPreviousFrame && !player.isSliding;
  updateSlideBlockGrace(player, dt);
  updateShootCooldown(player, dt);
  updateGunPulse(player, dt);
  updateInvulnerabilityTimers(player, dt);
  if (slideJustEnded) applyPostSlideInvulnerability(player);
}

function updateSlideBlockGrace(player, dt) {
  if (player.slideBlockGrace > 0) {
    player.slideBlockGrace = Math.max(0, player.slideBlockGrace - dt);
  }
}

function updateShootCooldown(player, dt) {
  if (player.shootCooldown > 0) {
    player.shootCooldown = Math.max(0, player.shootCooldown - dt);
  }
}

function updateGunPulse(player, dt) {
  const gunPulseDecayRate = 4;
  if (player.gunPulse > 0) player.gunPulse = Math.max(0, player.gunPulse - dt * gunPulseDecayRate);
}

function updateInvulnerabilityTimers(player, dt) {
  if (player.invulnerableTimer > 0) {
    player.invulnerableTimer = Math.max(0, player.invulnerableTimer - dt);
  }
  if (player.slideInvulWindow > 0) {
    player.slideInvulWindow = Math.max(0, player.slideInvulWindow - dt);
  }
}

/** DEATH OVERRIDE */
function handleDeathFlow(player, dt) {
  if (!player.isDead) return false;
  updateDeathMovement(player, dt);
  updateDeathFrames(player, dt);
  player.wasSlidingPreviousFrame = player.isSliding;
  return true;
}

function updateDeathMovement(player, dt) {
  player.setAnimation(player.dieFrames);
  const previousBottom = player.y + player.height;
  player.applyApexGravity(dt);
  const currentBottom = player.y + player.height;
  player.handleDeathLanding(previousBottom, currentBottom);
}

function updateDeathFrames(player, dt) {
  if (player.deathDone) return;
  player.frameTime += dt;
  if (player.frameTime < player.frameSpeed) return;
  player.frameTime = 0;
  advanceDeathFrame(player);
}

function advanceDeathFrame(player) {
  const lastDeathFrameIndex = player.currentAnimation.length - 1;
  const nextDeathFrameIndex = player.currentFrame + 1;
  player.currentFrame = Math.min(nextDeathFrameIndex, lastDeathFrameIndex);
  player.sprite = player.currentAnimation[player.currentFrame];
  if (player.currentFrame === lastDeathFrameIndex) player.deathDone = true;
}

/** HURT */
function handleHurtFlow(player, dt) {
  player.updateHurt(dt);
  if (!player.isHurt) return false;
  if (player.hurtUseDizzy) applyHurtAnimation(player, dt);
  player.applyApexGravity(dt);
  player.wasSlidingPreviousFrame = player.isSliding;
  return true;
}

function applyHurtAnimation(player, dt) {
  const hurtAnim = player.hurtPhase === "hurt"
    ? player.hurtFrames
    : player.dizzyFrames || player.hurtFrames;
  player.setAnimation(hurtAnim);
  player.animate(dt);
}

/** ATTACK / SHOOT INPUT (Enter only, bullets take priority) */
function handleCombatFlow(player, dt, input) {
  handleAttackShootInput(player, input);
  player.updateShoot(dt);
  if (handleShooting(player, dt)) return true;
  player.updateAttack(dt);
  if (handleAttacking(player, dt)) return true;
  handleQueuedAttack(player);
  return false;
}

function handleAttackShootInput(player, input) {
  if (!input.isPressed("Enter")) return;
  if (player.bulletAmmo > 0) player.startShoot();
  else if (!player.startAttack()) player.attackQueued = true;
}

function handleShooting(player, dt) {
  if (!player.isShooting) return false;
  player.setAnimation(player.shootFrames);
  player.applyApexGravity(dt);
  player.animate(dt);
  player.wasSlidingPreviousFrame = player.isSliding;
  return true;
}

function handleAttacking(player, dt) {
  if (!player.isAttacking) return false;
  player.setAnimation(player.throwFrames);
  player.applyApexGravity(dt);
  player.animate(dt);
  player.wasSlidingPreviousFrame = player.isSliding;
  return true;
}

function handleQueuedAttack(player) {
  if (!player.attackQueued) return;
  if (!player.onGround || player.isHurt || player.isDead || player.isShooting) return;
  if (player.startAttack()) player.attackQueued = false;
}

/** SLIDE INPUT */
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

function getSlideKeysDown(input) {
  return input.isDown("Shift") && (input.isDown("s") || input.isDown("ArrowDown"));
}

function shouldStartSlide(player, slideKeysDown, input) {
  if (!player.onGround || !slideKeysDown || !player.slideReady) return false;
  return (
    input.isDown("ArrowLeft") ||
    input.isDown("ArrowRight") ||
    input.isDown("a") ||
    input.isDown("d")
  );
}

function startSlideFromInput(player) {
  player.startSlide();
  player.slideReady = false;
  player.wasSlidingPreviousFrame = player.isSliding;
}

function updateSlideReady(player, slideKeysDown) {
  if (!slideKeysDown) player.slideReady = true;
}

function updateSlidingState(player, dt, playerAudio) {
  const slideDistanceTraveled = updateSlidePosition(player, dt);
  updateSlideInvulnerability(player);
  if (slideDistanceTraveled >= player.slideDistance) endSlide(player);
  checkSlideHits(player, playerAudio);
  applySlideAnimation(player, dt);
  player.wasSlidingPreviousFrame = player.isSliding;
  return true;
}

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

function updateSlideInvulnerability(player) {
  player.invulnerableTimer = Math.max(player.invulnerableTimer, player.slideInvulnerableDuring);
  player.slideInvulWindow = Math.max(player.slideInvulWindow, player.slideInvulnerableDuring);
}

function endSlide(player) {
  player.isSliding = false;
  applyPostSlideInvulnerability(player);
}

function applySlideAnimation(player, dt) {
  player.setAnimation(player.slideFrames);
  player.applyApexGravity(dt);
  player.animate(dt);
}

/** MOVEMENT */
function handleMovementAndJump(player, dt, input, playerAudio) {
  const directionState = getDirectionState(input);
  const moving = applyDirectionalMovement(player, dt, directionState);
  const running = applyRunningSpeed(player, moving, input);
  applyMovementAnimation(player, moving, running);
  handleAdvancedJump(player, dt, input, playerAudio);
  finalizeMovement(player, dt);
}

function getDirectionState(input) {
  const leftDown = input.isDown("ArrowLeft") || input.isDown("a");
  const rightDown = input.isDown("ArrowRight") || input.isDown("d");
  const bothDirectionsDown = leftDown && rightDown;
  return { leftDown, rightDown, bothDirectionsDown };
}

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

function applyRunningSpeed(player, moving, input) {
  if (moving && input.isDown("Shift")) {
    player.speed = player.defaultSpeed * player.runMultiplier;
    return true;
  }
  player.speed = player.defaultSpeed;
  return false;
}

function applyMovementAnimation(player, moving, running) {
  if (!player.onGround) player.setAnimation(player.jumpFrames);
  else if (running) player.setAnimation(player.runFrames);
  else if (moving) player.setAnimation(player.walkFrames);
  else player.setAnimation(player.idleFrames);
}

/** ADVANCED JUMP */
function handleAdvancedJump(player, dt, input, playerAudio) {
  updateJumpInput(player, input);
  updateCoyoteTimer(player, dt);
  tryConsumeJumpBuffer(player, playerAudio);
  applyJumpCut(player);
  decayJumpBuffer(player, dt);
}

function updateJumpInput(player, input) {
  if (input.isPressed(" ")) {
    player.jumpBufferTimer = player.jumpBufferTime;
    player.jumpHeld = true;
  } else if (!input.isDown(" ")) player.jumpHeld = false;
}

function updateCoyoteTimer(player, dt) {
  if (player.onGround) player.coyoteTimer = player.coyoteTime;
  else player.coyoteTimer -= dt;
}

function tryConsumeJumpBuffer(player, playerAudio) {
  if (player.jumpBufferTimer <= 0 || player.coyoteTimer <= 0) return;
  playerAudio.playJump();
  player.jump();
  player.jumpBufferTimer = 0;
}

function applyJumpCut(player) {
  if (!player.jumpHeld && player.velocityY < 0) player.velocityY *= player.jumpCutMultiplier;
}

function decayJumpBuffer(player, dt) {
  player.jumpBufferTimer -= dt;
}

function finalizeMovement(player, dt) {
  player.applyApexGravity(dt);
  player.animate(dt);
  player.wasSlidingPreviousFrame = player.isSliding;
}

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

function shouldCheckSlideEnemy(player, enemy) {
  return !enemy.isDead && !player.slideHitEnemies.has(enemy);
}

function getEnemyHitbox(enemy) {
  return enemy.getHitbox ? enemy.getHitbox() : null;
}

function isHitboxOverlapping(hitboxA, hitboxB) {
  return (
    hitboxA.x < hitboxB.x + hitboxB.width &&
    hitboxA.x + hitboxA.width > hitboxB.x &&
    hitboxA.y < hitboxB.y + hitboxB.height &&
    hitboxA.y + hitboxA.height > hitboxB.y
  );
}

function applySlideHit(player, enemy, playerAudio) {
  playerAudio.playHit();
  const dmg = player.slideDamage ?? PLAYER_SLIDE_DAMAGE;
  enemy.takeDamage?.(dmg, { skipStun: true, source: "slide" });
  spawnSlideHitEffect(player, enemy);
  player.slideHitEnemies.add(enemy);
}

function spawnSlideHitEffect(player, enemy) {
  if (enemy.isDead || enemy.health <= 0 || enemy.disableHitEffect) return;
  const hitEffectX = enemy.x;
  const hitEffectY = enemy.y;
  const hitEffectWidth = enemy.width;
  const hitEffectHeight = enemy.height;
  player.world?.spawnHitEffect?.(hitEffectX, hitEffectY, hitEffectWidth, hitEffectHeight);
}

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
