import { cloneOrRestart, playWhenReady } from "../audioUtils.js";
import { getRandomSource } from "./bossAudio.helpers.js";

/**
 * Plays whimper.
 */
export function playWhimper() {
  const src = getRandomSource(this.whimperSrcs);
  if (!src) return;
  const cachedWhimperAudio = this.getCachedWhimperAudio(src);
  const audio = cloneOrRestart(cachedWhimperAudio, { volume: this.sfxVolume });
  playWhenReady(audio);
  this.bindUnlock();
}

/**
 * Returns cached whimper audio.
 * Used to provide cached whimper audio for audio playback.
 * @param {string} src Source URL.
 * @returns {*} Cached whimper audio.
 */
export function getCachedWhimperAudio(src) {
  let cachedWhimperAudio = this.whimperCache.get(src);
  if (!cachedWhimperAudio) {
    cachedWhimperAudio = this.createSfxAudio(src);
    this.whimperCache.set(src, cachedWhimperAudio);
  }
  return cachedWhimperAudio;
}

/**
 * Plays attack 2.
 */
export function playAttack2() {
  if (!this.attack2Src) return;
  if (!this.attack2Audio) this.attack2Audio = this.createSfxAudio(this.attack2Src);
  const audio = cloneOrRestart(this.attack2Audio, { volume: this.sfxVolume });
  playWhenReady(audio);
  this.bindUnlock();
}

/**
 * Plays attack 1.
 */
export function playAttack1() {
  if (!this.whooshSrc) return;
  const base =
    this.whooshAudio || (this.whooshAudio = this.createSfxAudio(this.whooshSrc));
  const audio = cloneOrRestart(base, { volume: this.sfxVolume });
  playWhenReady(audio);
  this.bindUnlock();
}

/**
 * Plays hit.
 */
export function playHit() {
  if (!this.hitSrc) return;
  const vol = this.getHitVolume();
  const hitAudio = this.ensureHitAudio(vol);
  const audio = cloneOrRestart(hitAudio, { volume: vol });
  playWhenReady(audio);
  this.bindUnlock();
}

/**
 * Returns hit volume.
 * Used to provide hit volume for audio playback.
 * @returns {*} Hit volume.
 */
export function getHitVolume() {
  return Math.min(this.maxVolumeCap, this.sfxVolume + this.hitBoostVolume);
}

/**
 * Ensure hit audio.
 * Used to support audio playback.
 * @param {*} vol Vol.
 * @returns {*} Result value.
 */
export function ensureHitAudio(vol) {
  if (!this.hitAudio) {
    this.hitAudio = this.createAudio(this.hitSrc, false, vol);
  } else {
    this.hitAudio.currentTime = 0;
  }
  return this.hitAudio;
}
