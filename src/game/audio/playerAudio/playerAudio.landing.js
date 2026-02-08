import { playWhenReady } from "../audioUtils.js";

/**
 * Plays landing.
 * Updates the instance state.
 */
export function playLanding() {
  const cachedLandingBase = this.getLandingBase();
  const audio = this.cloneLandingAudio(cachedLandingBase);
  /**
   * Sets landing offset.
   * Updates the instance state.
   * @returns {*} Result value.
   */
  const setLandingOffset = () => this.applyLandingOffset(audio);
  playWhenReady(audio, { beforePlay: setLandingOffset, onMetadata: setLandingOffset });
  this.bindUnlock();
}

/**
 * Returns landing base.
 * Updates the instance state.
 * @returns {*} Landing base.
 */
export function getLandingBase() {
  if (this.landingBase && this.landingBase.src === this.landingSrc) {
    return this.landingBase;
  }
  this.landingBase = this.createAudio(this.landingSrc);
  return this.landingBase;
}

/**
 * Clone landing audio.
 * Updates the instance state.
 * @param {*} cachedLandingBase Cached landing base.
 * @returns {*} Result value.
 */
export function cloneLandingAudio(cachedLandingBase) {
  const audio = cachedLandingBase.cloneNode(true);
  audio.volume = this.landingVolume;
  audio.preload = "auto";
  audio.autoplay = false;
  return audio;
}

/**
 * Applies landing offset.
 * Updates the instance state.
 * @param {HTMLAudioElement} audio Audio element.
 */
export function applyLandingOffset(audio) {
  const landingEndSafetyMargin = 0.05;
  const duration = audio.duration;
  if (Number.isFinite(duration)) {
    const latestSafeStart = Math.max(0, duration - landingEndSafetyMargin);
    const clampedOffset = Math.min(Math.max(0, this.landingOffset), latestSafeStart);
    audio.currentTime = clampedOffset;
  } else {
    audio.currentTime = 0;
  }
}
