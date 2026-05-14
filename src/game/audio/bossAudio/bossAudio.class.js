import { createAudioElement } from "../audioUtils.js";
import { buildBossAudioConfig, buildBossAudioState } from "./bossAudio.builders.js";
import {
  playWhimper,
  getCachedWhimperAudio,
  playAttack2,
  playAttack1,
  playHit,
  getHitVolume,
  ensureHitAudio,
} from "./bossAudio.sfx.js";
import {
  play,
  startGong,
  scheduleFadeToMusic,
  getFadeStartMs,
  scheduleGongStop,
  stopGongAudio,
  startFadeToMusic,
  createAndStartMusicAudio,
  beginMusicFadeIn,
  getFadeDurationMs,
  attachMusicLoopWatcher,
  handleMusicLoopTimeUpdate,
  getMusicLoopCutoff,
  getMusicOverlapStart,
  tryStartNextLoop,
  shouldStartNextLoop,
  tryCompleteLoop,
  shouldCompleteLoop,
  detachLoopWatcher,
  startNextMusicLoop,
  beginMusicCrossfade,
  applyCrossfadeVolumes,
  clearFadeInterval,
  clearMusicTracks,
  completeMusicSwitch,
  stopLoopedAudioInstance,
  stopPreviousMusicAudio,
  swapToNextMusicAudio,
} from "./bossAudio.music.js";
import {
  playDefeat,
  finishDefeatWithoutFade,
  createDefeatAudio,
  createHowlEndAudio,
  playDefeatAudio,
  getFadingTracks,
  startDefeatFade,
  applyDefeatFadeVolumes,
  finishDefeatFade,
  clearGongAfterDefeat,
} from "./bossAudio.defeat.js";
import {
  stopAndCleanupBossAudio,
  clearBossTimers,
  stopGongAudioAndClear,
  stopNextMusicAudio,
  stopMusicAudio,
  stopDefeatAudio,
  stopAttack2Audio,
  stopWhooshAudio,
  stopHitAudio,
  stopHowlEndAudio,
  bindUnlock,
  unbindUnlock,
} from "./bossAudio.cleanup.js";

export const BOSS_GONG = "./assets/music/boss-gong.mp3";
export const BOSS_MUSIC = "./assets/music/boss-music.mp3";
export const BOSS_DEFEAT = "./assets/music/boss-defeat.mp3";
export const BOSS_WHIMPER = [
  "./assets/sfx/boss/boss-whimper1.mp3",
  "./assets/sfx/boss/boss-whimper2.mp3",
];
export const BOSS_HOWL_END = "./assets/sfx/boss/boss-howl-end.mp3";
export const BOSS_ATTACK2 = "./assets/sfx/boss/boss-attack2.mp3";
export const BOSS_WHOOSH = "./assets/sfx/boss/boss-whoosh.mp3";
export const BOSS_HIT = "./assets/sfx/boss/boss-hit.mp3";
export const msPerSecond = 1000;

export class BossAudio {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Used to set up required data for audio playback.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   */
  constructor(options = {}) {
    Object.assign(this, buildBossAudioConfig(options));
    Object.assign(this, buildBossAudioState());
  }

  /**
   * Creates audio. If omitted, default values are used.
   * Used to set up required data for audio playback.
   * @param {string} src Source URL.
   * @param {boolean} [loop] Loop.
   * @param {number} [volume] Volume.
   * @returns {*} Audio.
   */
  createAudio(src, loop = false, volume = this.volume) {
    return createAudioElement(src, { loop, volume });
  }

  /**
   * Creates sfx audio.
   * Used to set up required data for audio playback.
   * @param {string} src Source URL.
   * @returns {*} Sfx audio.
   */
  createSfxAudio(src) {
    return this.createAudio(src, false, this.sfxVolume);
  }

  /**
   * Creates music audio. If omitted, default values are used.
   * Used to set up required data for audio playback.
   * @param {number} [volume] Volume.
   * @returns {*} Music audio.
   */
  createMusicAudio(volume = 0) {
    return createAudioElement(this.musicSrc, {
      volume,
      playbackRate: this.playbackRate,
    });
  }
}

Object.assign(BossAudio.prototype, {
  playWhimper,
  getCachedWhimperAudio,
  playAttack2,
  playAttack1,
  playHit,
  getHitVolume,
  ensureHitAudio,
  play,
  startGong,
  scheduleFadeToMusic,
  getFadeStartMs,
  scheduleGongStop,
  stopGongAudio,
  startFadeToMusic,
  createAndStartMusicAudio,
  beginMusicFadeIn,
  getFadeDurationMs,
  attachMusicLoopWatcher,
  handleMusicLoopTimeUpdate,
  getMusicLoopCutoff,
  getMusicOverlapStart,
  tryStartNextLoop,
  shouldStartNextLoop,
  tryCompleteLoop,
  shouldCompleteLoop,
  detachLoopWatcher,
  startNextMusicLoop,
  beginMusicCrossfade,
  applyCrossfadeVolumes,
  clearFadeInterval,
  clearMusicTracks,
  completeMusicSwitch,
  stopLoopedAudioInstance,
  stopPreviousMusicAudio,
  swapToNextMusicAudio,
  playDefeat,
  finishDefeatWithoutFade,
  createDefeatAudio,
  createHowlEndAudio,
  playDefeatAudio,
  getFadingTracks,
  startDefeatFade,
  applyDefeatFadeVolumes,
  finishDefeatFade,
  clearGongAfterDefeat,
  stopAndCleanupBossAudio,
  clearBossTimers,
  stopGongAudioAndClear,
  stopNextMusicAudio,
  stopMusicAudio,
  stopDefeatAudio,
  stopAttack2Audio,
  stopWhooshAudio,
  stopHitAudio,
  stopHowlEndAudio,
  bindUnlock,
  unbindUnlock,
});
