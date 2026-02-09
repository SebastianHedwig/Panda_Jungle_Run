import { HudPopup } from "../effects/hudPopup.class.js";
import { CollectablesAudio } from "../audio/collectablesAudio.class.js";

const collectablesAudio = new CollectablesAudio();

export const COLLECTABLE_VALUES = {
  coin: 10,
  enemy: 5,
  heart: 2,
  gun: 0,
};

const GUN_BULLETS_GRANT = 5;

/**
 * Is colliding.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @returns {boolean} Whether colliding.
 */
export function isColliding(player) {
  if (this.pickupDelay > 0) return false;

  const itemHitbox = this.getHitbox ? this.getHitbox() : { x: this.x, y: this.y, width: this.width, height: this.height };
  const playerHitbox = player.getHitbox ? player.getHitbox() : { x: player.x, y: player.y, width: player.width, height: player.height };

  const itemLeft = itemHitbox.x;
  const itemRight = itemHitbox.x + itemHitbox.width;
  const itemTop = itemHitbox.y;
  const itemBottom = itemHitbox.y + itemHitbox.height;

  const playerLeft = playerHitbox.x;
  const playerRight = playerHitbox.x + playerHitbox.width;
  const playerTop = playerHitbox.y;
  const playerBottom = playerHitbox.y + playerHitbox.height;

  return !(
    playerLeft > itemRight ||
    playerRight < itemLeft ||
    playerTop > itemBottom ||
    playerBottom < itemTop
  );
}

/**
 * Collect.
 * Updates the instance state.
 * @param {Player} player Player instance.
 */
export function collect(player) {
  if (this.collected) return;
  this.startPickupAnimation();
  const itemX = this.x;
  const itemY = this.y;

  this.handleCollectByType(player, itemX, itemY);
  this.resetPickupFx();
}

/**
 * Starts pickup animation.
 * Updates the instance state.
 */
export function startPickupAnimation() {
  this.collected = true;
  this.pickupAnimating = true;
}

/**
 * Handles collect by type.
 * Updates the instance state.
 * @param {Player} player Player instance.
 * @param {number} itemX Item X.
 * @param {number} itemY Item Y.
 */
export function handleCollectByType(player, itemX, itemY) {
  if (this.type === "coin") this.collectCoin(player, itemX, itemY);
  if (this.type === "heart") this.collectHeart(player, itemX, itemY);
  if (this.type === "gun") this.collectGun(player, itemX, itemY);
}

/**
 * Collect coin.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {number} itemX Item X.
 * @param {number} itemY Item Y.
 */
export function collectCoin(player, itemX, itemY) {
  collectablesAudio.playCoin();
  player.addCoins(COLLECTABLE_VALUES.coin);
  player.world.hudPopups.push(new HudPopup(`+${COLLECTABLE_VALUES.coin}`, itemX, itemY, "coin"));
}

/**
 * Collect heart.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {number} itemX Item X.
 * @param {number} itemY Item Y.
 */
export function collectHeart(player, itemX, itemY) {
  collectablesAudio.playHeart();
  player.heal(COLLECTABLE_VALUES.heart);
  player.world.hudPopups.push(new HudPopup("❤️", itemX, itemY, "heart"));
}

/**
 * Collect gun.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {number} itemX Item X.
 * @param {number} itemY Item Y.
 */
export function collectGun(player, itemX, itemY) {
  collectablesAudio.playWeapon();
  player.addBullets?.(GUN_BULLETS_GRANT);
  player.world.hudPopups.push(new HudPopup(`+${GUN_BULLETS_GRANT}`, itemX, itemY, "gun"));
}

/**
 * Resets pickup fx.
 * Updates the instance state.
 */
export function resetPickupFx() {
  this.scaleFactor = 1;
  this.opacity = 1;
  this.rotationAngle = 0;
}
