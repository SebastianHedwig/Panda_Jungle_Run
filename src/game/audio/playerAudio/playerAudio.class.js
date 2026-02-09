import { createAudioElement } from "../audioUtils.js";
import { buildPlayerAudioConfig, buildPlayerAudioState } from "./playerAudio.builders.js";
import {
  playOneShot,
  prepareOneShotAudio,
  shouldCloneAudio,
  cloneAudioInstance,
  createOffsetSetter,
  queueOneShotPlayback,
} from "./playerAudio.oneshot.js";
import {
  getPunchAudio,
  getOuchAudio,
  playPunch,
  playHit,
  playShoot,
  playOuch,
  playJump,
  playSlide,
  playDead,
} from "./playerAudio.sfx.js";
import {
  playLanding,
  getLandingBase,
  cloneLandingAudio,
  applyLandingOffset,
} from "./playerAudio.landing.js";
import {
  bindUnlock,
  getUnlockAudioFiles,
  warmupAudioFile,
  muteAudioForWarmup,
  playAndResetAudio,
  resetAudioPlayback,
  restoreAudioState,
  addUnlockListeners,
  unbindUnlock,
} from "./playerAudio.unlock.js";

export const PLAYER_DEAD = "./assets/sfx/player/player-dead.mp3";
export const PLAYER_PUNCH = [
  "./assets/sfx/player/player-punch1.mp3",
  "./assets/sfx/player/player-punch2.mp3",
  "./assets/sfx/player/player-punch3.mp3",
  "./assets/sfx/player/player-punch4.mp3",
];
export const PLAYER_OUCH = [
  "./assets/sfx/player/player-ouw1.mp3",
  "./assets/sfx/player/player-ouw2.mp3",
  "./assets/sfx/player/player-ouw3.mp3",
];
export const PLAYER_HIT = "./assets/sfx/player/player-punch-hit.mp3";
export const PLAYER_SHOOT = "./assets/sfx/weapon/weapon-shoot.mp3";
export const PLAYER_JUMP = "./assets/sfx/player/player-jump.mp3";
export const PLAYER_LANDING = "./assets/sfx/player/player-landing.mp3";
export const PLAYER_SLIDE = [
  "./assets/sfx/player/player-slide1.mp3",
  "./assets/sfx/player/player-slide2.mp3",
];

export class PlayerAudio {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Used to set up required data for audio playback.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   */
  constructor(options = {}) {
    Object.assign(this, buildPlayerAudioConfig(options));
    Object.assign(this, buildPlayerAudioState());
  }

  /**
   * Creates audio.
   * Used to set up required data for audio playback.
   * @param {string} src Source URL.
   * @returns {*} Audio.
   */
  createAudio(src) {
    return createAudioElement(src, { volume: this.volume });
  }

  /**
   * Ensure base.
   * Used to support audio playback.
   * @param {string} propertyName Property name.
   * @param {string} src Source URL.
   * @returns {*} Result value.
   */
  ensureBase(propertyName, src) {
    if (!this[propertyName]) {
      this[propertyName] = this.createAudio(src);
    }
    return this[propertyName];
  }
}

Object.assign(PlayerAudio.prototype, {
  playOneShot,
  prepareOneShotAudio,
  shouldCloneAudio,
  cloneAudioInstance,
  createOffsetSetter,
  queueOneShotPlayback,
  getPunchAudio,
  getOuchAudio,
  playPunch,
  playHit,
  playShoot,
  playOuch,
  playJump,
  playSlide,
  playDead,
  playLanding,
  getLandingBase,
  cloneLandingAudio,
  applyLandingOffset,
  bindUnlock,
  getUnlockAudioFiles,
  warmupAudioFile,
  muteAudioForWarmup,
  playAndResetAudio,
  resetAudioPlayback,
  restoreAudioState,
  addUnlockListeners,
  unbindUnlock,
});
