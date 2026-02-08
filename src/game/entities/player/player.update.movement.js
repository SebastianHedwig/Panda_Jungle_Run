import { FACING_LEFT, FACING_RIGHT } from "../../../config/config.js";

/**
 * Handles movement and jump.
 * Triggers audio playback or updates audio state.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {Input} input Input handler.
 * @param {Player} playerAudio Player audio.
 */
export function handleMovementAndJump(player, dt, input, playerAudio) {
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
 * @param {Input} input Input handler.
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
 * @param {Player} player Player instance.
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
 * @param {Player} player Player instance.
 * @param {*} moving Moving.
 * @param {Input} input Input handler.
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
 * @param {Player} player Player instance.
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
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {Input} input Input handler.
 * @param {Player} playerAudio Player audio.
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
 * @param {Player} player Player instance.
 * @param {Input} input Input handler.
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
 * @param {Player} player Player instance.
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
 * @param {Player} player Player instance.
 * @param {Player} playerAudio Player audio.
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
 * @param {Player} player Player instance.
 */
function applyJumpCut(player) {
  if (!player.jumpHeld && player.velocityY < 0) player.velocityY *= player.jumpCutMultiplier;
}

/**
 * Decay jump buffer.
 * Applies physics updates like gravity and velocity.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function decayJumpBuffer(player, dt) {
  player.jumpBufferTimer -= dt;
}

/**
 * Finalize movement.
 * Advances animation state and sprites.
 * Applies physics updates like gravity and velocity.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function finalizeMovement(player, dt) {
  player.applyApexGravity(dt);
  player.animate(dt);
  player.wasSlidingPreviousFrame = player.isSliding;
}
