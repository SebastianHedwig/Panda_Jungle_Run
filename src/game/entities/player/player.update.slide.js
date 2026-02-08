import { applyPostSlideInvulnerability } from "./player.update.timers.js";
import { checkSlideHits } from "./player.update.slideHits.js";

/**
 * Handles slide flow.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {Input} input Input handler.
 * @param {Player} playerAudio Player audio.
 * @returns {*} Result value.
 */
export function handleSlideFlow(player, dt, input, playerAudio) {
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
 * @param {Input} input Input handler.
 * @returns {*} Slide keys down.
 */
function getSlideKeysDown(input) {
  return input.isDown("Shift") && (input.isDown("s") || input.isDown("ArrowDown"));
}

/**
 * Should start slide.
 * Reads input state to decide actions.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {*} slideKeysDown Slide keys down.
 * @param {Input} input Input handler.
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
 * @param {Player} player Player instance.
 */
function startSlideFromInput(player) {
  player.startSlide();
  player.slideReady = false;
  player.wasSlidingPreviousFrame = player.isSliding;
}

/**
 * Updates slide ready.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {*} slideKeysDown Slide keys down.
 */
function updateSlideReady(player, slideKeysDown) {
  if (!slideKeysDown) player.slideReady = true;
}

/**
 * Updates sliding state.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {Player} playerAudio Player audio.
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
 * @param {Player} player Player instance.
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
 * @param {Player} player Player instance.
 */
function updateSlideInvulnerability(player) {
  player.invulnerableTimer = Math.max(player.invulnerableTimer, player.slideInvulnerableDuring);
  player.slideInvulWindow = Math.max(player.slideInvulWindow, player.slideInvulnerableDuring);
}

/**
 * End slide.
 * Updates the player state.
 * @param {Player} player Player instance.
 */
function endSlide(player) {
  player.isSliding = false;
  applyPostSlideInvulnerability(player);
}

/**
 * Applies slide animation.
 * Advances animation state and sprites.
 * Applies physics updates like gravity and velocity.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function applySlideAnimation(player, dt) {
  player.setAnimation(player.slideFrames);
  player.applyApexGravity(dt);
  player.animate(dt);
}
