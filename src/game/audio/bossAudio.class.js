import { BOSS_MUSIC_LOOP_CUT, BOSS_MUSIC_PLAYBACK_RATE, MUSIC_VOLUME, SFX_VOLUME } from "../../config/config.js";
import { cloneOrRestart, createAudioElement, playWhenReady } from "./audioUtils.js";

const BOSS_GONG = "./assets/music/boss-gong.mp3";
const BOSS_MUSIC = "./assets/music/boss-music.mp3";
const BOSS_DEFEAT = "./assets/music/boss-defeat.mp3";
const BOSS_WHIMPER = [
  "./assets/sfx/boss/Boss-whimper1.mp3",
  "./assets/sfx/boss/Boss-whimper2.mp3",
];
const BOSS_HOWL_END = "./assets/sfx/boss/Boss-howl-end.mp3";
const BOSS_ATTACK2 = "./assets/sfx/boss/Boss-attack2.mp3";
const BOSS_WHOOSH = "./assets/sfx/boss/Boss-whoosh.mp3";
const BOSS_HIT = "./assets/sfx/boss/Boss-hit.mp3";
const msPerSecond = 1000;

/**
 * Returns random source.
 * Introduces randomness into the outcome.
 * @param {*} sourceList Source list.
 * @returns {*} Random source.
 */
function getRandomSource(sourceList) {
  if (!sourceList?.length) return null;
  const randomIndex = Math.floor(Math.random() * sourceList.length);
  return sourceList[randomIndex] ?? null;
}

/**
 * Builds boss audio sources. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 * @param {string} [options.gongSrc] Gong src.
 * @param {string} [options.musicSrc] Music src.
 * @param {string} [options.defeatSrc] Defeat src.
 * @param {*} [options.whimperSrcs] Whimper srcs.
 * @param {string} [options.howlEndSrc] Howl end src.
 * @param {string} [options.attack2Src] Attack 2 src.
 * @param {string} [options.whooshSrc] Whoosh src.
 * @param {string} [options.hitSrc] Hit src.
 * @param {*} [options.}] Value.
 */
function buildBossAudioSources({
  gongSrc = BOSS_GONG,
  musicSrc = BOSS_MUSIC,
  defeatSrc = BOSS_DEFEAT,
  whimperSrcs = BOSS_WHIMPER,
  howlEndSrc = BOSS_HOWL_END,
  attack2Src = BOSS_ATTACK2,
  whooshSrc = BOSS_WHOOSH,
  hitSrc = BOSS_HIT,
} = {}) {
  return { gongSrc, musicSrc, defeatSrc, whimperSrcs, howlEndSrc, attack2Src, whooshSrc, hitSrc };
}

/**
 * Builds boss audio volumes. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 * @param {number} [options.volume] Volume.
 * @param {number} [options.sfxVolume] Sfx volume.
 */
function buildBossAudioVolumes({ volume = MUSIC_VOLUME, sfxVolume = SFX_VOLUME } = {}) {
  return { volume, sfxVolume, hitBoostVolume: 0.2, maxVolumeCap: 1 };
}

/**
 * Builds boss audio timing. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 * @param {*} [options.musicLoopCut] Music loop cut.
 * @param {number} [options.playbackRate] Playback rate.
 * @param {number} [options.gongPlayDuration] Gong play duration.
 * @param {number} [options.fadeDuration] Fade duration.
 * @param {*} [options.}] Value.
 */
function buildBossAudioTiming({
  musicLoopCut = BOSS_MUSIC_LOOP_CUT,
  playbackRate = BOSS_MUSIC_PLAYBACK_RATE,
  gongPlayDuration = 3,
  fadeDuration = 1,
} = {}) {
  return { gongPlayDuration, fadeDuration, minFadeDurationMs: 100, loudnessStepMs: 50, musicLoopCut, playbackRate };
}

/**
 * Builds boss audio config. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 */
function buildBossAudioConfig(options = {}) {
  return {
    ...buildBossAudioSources(options),
    ...buildBossAudioVolumes(options),
    ...buildBossAudioTiming(options),
  };
}

/**
 * Builds boss audio reference state.
 * @returns {Object} Boss audio reference state.
 */
function buildBossAudioReferenceState() {
  return {
    gongAudio: null,
    musicAudio: null,
    defeatAudio: null,
    howlEndAudio: null,
    attack2Audio: null,
    whooshAudio: null,
    hitAudio: null,
    nextMusicAudio: null,
  };
}

/**
 * Builds boss audio runtime state.
 * @returns {Object} Boss audio runtime state.
 */
function buildBossAudioRuntimeState() {
  return {
    whimperCache: new Map(),
    fadeInterval: null,
    fadeStartTimer: null,
    gongStopTimer: null,
    isPlaying: false,
    defeatPlayed: false,
    unlockHandler: null,
    loopHandlers: new WeakMap(),
  };
}

/**
 * Builds boss audio state.
 * @returns {Object} Boss audio state.
 */
function buildBossAudioState() {
  return {
    ...buildBossAudioReferenceState(),
    ...buildBossAudioRuntimeState(),
  };
}

/**
 * Stops and reset audio.
 * Triggers audio playback or updates audio state.
 * @param {HTMLElement} audioElement Audio element.
 * @returns {*} Result value.
 */
function stopAndResetAudio(audioElement) {
  if (!audioElement) return null;
  audioElement.pause();
  audioElement.currentTime = 0;
  return null;
}

/**
 * Clears timeout if needed.
 * Clears pending timers.
 * @param {string} timerId Timer element id.
 * @returns {*} Result value.
 */
function clearTimeoutIfNeeded(timerId) {
  if (timerId) clearTimeout(timerId);
  return null;
}

export class BossAudio {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   */
  constructor(options = {}) {
    Object.assign(this, buildBossAudioConfig(options));
    Object.assign(this, buildBossAudioState());
  }

  /**
   * Creates audio. If omitted, default values are used.
   * Updates the instance state.
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
   * Updates the instance state.
   * @param {string} src Source URL.
   * @returns {*} Sfx audio.
   */
  createSfxAudio(src) {
    return this.createAudio(src, false, this.sfxVolume);
  }

  /**
   * Creates music audio. If omitted, default values are used.
   * Updates the instance state.
   * @param {number} [volume] Volume.
   * @returns {*} Music audio.
   */
  createMusicAudio(volume = 0) {
    return createAudioElement(this.musicSrc, {
      volume,
      playbackRate: this.playbackRate,
    });
  }

  /**
   * Plays whimper.
   * Updates the instance state.
   */
  playWhimper() {
    const src = getRandomSource(this.whimperSrcs);
    if (!src) return;
    const cachedWhimperAudio = this.getCachedWhimperAudio(src);
    const audio = cloneOrRestart(cachedWhimperAudio, { volume: this.sfxVolume });
    playWhenReady(audio);
    this.bindUnlock();
  }

  /**
   * Returns cached whimper audio.
   * Updates the instance state.
   * @param {string} src Source URL.
   * @returns {*} Cached whimper audio.
   */
  getCachedWhimperAudio(src) {
    let cachedWhimperAudio = this.whimperCache.get(src);
    if (!cachedWhimperAudio) {
      cachedWhimperAudio = this.createSfxAudio(src);
      this.whimperCache.set(src, cachedWhimperAudio);
    }
    return cachedWhimperAudio;
  }

  /**
   * Plays attack 2.
   * Updates the instance state.
   */
  playAttack2() {
    if (!this.attack2Src) return;
    if (!this.attack2Audio) this.attack2Audio = this.createSfxAudio(this.attack2Src);
    const audio = cloneOrRestart(this.attack2Audio, { volume: this.sfxVolume });
    playWhenReady(audio);
    this.bindUnlock();
  }

  /**
   * Plays attack 1.
   * Updates the instance state.
   */
  playAttack1() {
    if (!this.whooshSrc) return;
    const base =
      this.whooshAudio || (this.whooshAudio = this.createSfxAudio(this.whooshSrc));
    const audio = cloneOrRestart(base, { volume: this.sfxVolume });
    playWhenReady(audio);
    this.bindUnlock();
  }

  /**
   * Plays hit.
   * Updates the instance state.
   */
  playHit() {
    if (!this.hitSrc) return;
    const vol = this.getHitVolume();
    const hitAudio = this.ensureHitAudio(vol);
    const audio = cloneOrRestart(hitAudio, { volume: vol });
    playWhenReady(audio);
    this.bindUnlock();
  }

  /**
   * Returns hit volume.
   * Updates the instance state.
   * @returns {*} Hit volume.
   */
  getHitVolume() {
    return Math.min(this.maxVolumeCap, this.sfxVolume + this.hitBoostVolume);
  }

  /**
   * Ensure hit audio.
   * Updates the instance state.
   * @param {*} vol Vol.
   * @returns {*} Result value.
   */
  ensureHitAudio(vol) {
    if (!this.hitAudio) {
      this.hitAudio = this.createAudio(this.hitSrc, false, vol);
    } else {
      this.hitAudio.currentTime = 0;
    }
    return this.hitAudio;
  }

  /**
   * Plays.
   * Updates the instance state.
   */
  play() {
    this.stopAndCleanupBossAudio();
    this.isPlaying = true;
    this.startGong();
    this.scheduleFadeToMusic();
    this.scheduleGongStop();
  }

  /**
   * Starts gong.
   * Updates the instance state.
   */
  startGong() {
    this.gongAudio = this.createAudio(this.gongSrc, false, this.volume);
    playWhenReady(this.gongAudio);
    this.bindUnlock();
  }

  /**
   * Schedules fade to music.
   * Schedules timed actions.
   * Updates the instance state.
   */
  scheduleFadeToMusic() {
    const fadeStartMs = this.getFadeStartMs();
    this.fadeStartTimer = setTimeout(() => this.startFadeToMusic(), fadeStartMs);
  }

  /**
   * Returns fade start ms.
   * Updates the instance state.
   * @returns {*} Fade start ms.
   */
  getFadeStartMs() {
    return Math.max(0, (this.gongPlayDuration - this.fadeDuration) * msPerSecond);
  }

  /**
   * Schedules gong stop.
   * Schedules timed actions.
   * Updates the instance state.
   */
  scheduleGongStop() {
    this.gongStopTimer = setTimeout(
      () => this.stopGongAudio(),
      this.gongPlayDuration * msPerSecond
    );
  }

  /**
   * Stops gong audio.
   * Triggers audio playback or updates audio state.
   * Updates the instance state.
   */
  stopGongAudio() {
    if (!this.gongAudio) return;
    this.gongAudio.pause();
    this.gongAudio.currentTime = 0;
  }

  /**
   * Starts fade to music.
   * Updates the instance state.
   */
  startFadeToMusic() {
    if (this.musicAudio) return;
    const music = this.createAndStartMusicAudio();
    this.beginMusicFadeIn(music);
  }

  /**
   * Creates and start music audio.
   * Updates the instance state.
   * @returns {*} And start music audio.
   */
  createAndStartMusicAudio() {
    this.musicAudio = this.createMusicAudio(0);
    const music = this.musicAudio;
    this.attachMusicLoopWatcher(music);
    playWhenReady(music, {
      beforePlay: () => {
        music.playbackRate = this.playbackRate;
      },
    });
    return music;
  }

  /**
   * Begin music fade in.
   * Schedules timed actions.
   * Updates the instance state.
   * @param {*} music Music.
   */
  beginMusicFadeIn(music) {
    const durationMs = this.getFadeDurationMs();
    const loudnessStepMs = this.loudnessStepMs;
    let elapsedMs = 0;
    this.fadeInterval = setInterval(() => {
      elapsedMs += loudnessStepMs;
      const fadeProgress = Math.min(elapsedMs / durationMs, 1);
      music.volume = this.volume * fadeProgress;
      if (fadeProgress >= 1) this.clearFadeInterval();
    }, loudnessStepMs);
  }

  /**
   * Returns fade duration ms.
   * Updates the instance state.
   * @returns {*} Fade duration ms.
   */
  getFadeDurationMs() {
    return Math.max(this.minFadeDurationMs, this.fadeDuration * msPerSecond);
  }

  /**
   * Stops and cleanup boss audio.
   * Updates the instance state.
   */
  stopAndCleanupBossAudio() {
    this.isPlaying = false;
    this.clearBossTimers();
    this.stopGongAudioAndClear();
    this.stopNextMusicAudio();
    this.stopMusicAudio();
    this.stopDefeatAudio();
    this.stopAttack2Audio();
    this.stopWhooshAudio();
    this.stopHitAudio();
    this.stopHowlEndAudio();
    this.unbindUnlock();
  }

  /**
   * Clears boss timers.
   * Clears pending timers.
   * Updates the instance state.
   */
  clearBossTimers() {
    this.fadeStartTimer = clearTimeoutIfNeeded(this.fadeStartTimer);
    this.gongStopTimer = clearTimeoutIfNeeded(this.gongStopTimer);
    this.clearFadeInterval();
  }

  /**
   * Stops gong audio and clear.
   * Updates the instance state.
   */
  stopGongAudioAndClear() {
    this.gongAudio = stopAndResetAudio(this.gongAudio);
  }

  /**
   * Stops next music audio.
   * Updates the instance state.
   */
  stopNextMusicAudio() {
    this.nextMusicAudio = this.stopLoopedAudioInstance(this.nextMusicAudio);
  }

  /**
   * Stops music audio.
   * Updates the instance state.
   */
  stopMusicAudio() {
    this.musicAudio = this.stopLoopedAudioInstance(this.musicAudio);
  }

  /**
   * Stops defeat audio.
   * Updates the instance state.
   */
  stopDefeatAudio() {
    this.defeatAudio = stopAndResetAudio(this.defeatAudio);
  }

  /**
   * Stops attack 2 audio.
   * Updates the instance state.
   */
  stopAttack2Audio() {
    this.attack2Audio = stopAndResetAudio(this.attack2Audio);
  }

  /**
   * Stops whoosh audio.
   * Updates the instance state.
   */
  stopWhooshAudio() {
    this.whooshAudio = stopAndResetAudio(this.whooshAudio);
  }

  /**
   * Stops hit audio.
   * Updates the instance state.
   */
  stopHitAudio() {
    this.hitAudio = stopAndResetAudio(this.hitAudio);
  }

  /**
   * Stops howl end audio.
   * Updates the instance state.
   */
  stopHowlEndAudio() {
    this.howlEndAudio = stopAndResetAudio(this.howlEndAudio);
  }

  /**
   * Binds unlock.
   * Binds keydown, pointerdown, touchstart event listeners.
   * Triggers audio playback or updates audio state.
   */
  bindUnlock() {
    if (this.unlockHandler) return;
    this.unlockHandler = () => {
      this.gongAudio?.play();
      this.musicAudio?.play();
      this.defeatAudio?.play();
      this.unbindUnlock();
    };
    window.addEventListener("pointerdown", this.unlockHandler, { once: true });
    window.addEventListener("keydown", this.unlockHandler, { once: true });
    window.addEventListener("touchstart", this.unlockHandler, { once: true });
  }

  /**
   * Unbind unlock.
   * Updates the instance state.
   */
  unbindUnlock() {
    if (!this.unlockHandler) return;
    window.removeEventListener("pointerdown", this.unlockHandler);
    window.removeEventListener("keydown", this.unlockHandler);
    window.removeEventListener("touchstart", this.unlockHandler);
    this.unlockHandler = null;
  }

  /**
   * Attaches music loop watcher.
   * Binds timeupdate event listeners.
   * Updates the instance state.
   * @param {HTMLElement} audioElement Audio element.
   */
  attachMusicLoopWatcher(audioElement) {
    /**
     * Handler.
     * Updates the instance state.
     * @returns {*} Result value.
     */
    const handler = () => this.handleMusicLoopTimeUpdate(audioElement);
    audioElement.addEventListener("timeupdate", handler);
    this.loopHandlers.set(audioElement, handler);
  }

  /**
   * Handles music loop time update.
   * Performs hitbox or collision checks.
   * Updates the instance state.
   * @param {HTMLElement} audioElement Audio element.
   */
  handleMusicLoopTimeUpdate(audioElement) {
    if (!audioElement.duration || !isFinite(audioElement.duration)) return;
    const cutoff = this.getMusicLoopCutoff(audioElement.duration);
    const overlapStart = this.getMusicOverlapStart(cutoff);
    this.tryStartNextLoop(audioElement, overlapStart);
    this.tryCompleteLoop(audioElement, cutoff);
  }

  /**
   * Returns music loop cutoff.
   * Updates the instance state.
   * @param {number} duration Duration in seconds.
   * @returns {*} Music loop cutoff.
   */
  getMusicLoopCutoff(duration) {
    return Math.max(0, duration - this.musicLoopCut);
  }

  /**
   * Returns music overlap start.
   * Updates the instance state.
   * @param {*} cutoff Cutoff.
   * @returns {*} Music overlap start.
   */
  getMusicOverlapStart(cutoff) {
    return Math.max(0, cutoff - this.fadeDuration);
  }

  /**
   * Try start next loop.
   * Performs hitbox or collision checks.
   * Updates the instance state.
   * @param {HTMLElement} audioElement Audio element.
   * @param {*} overlapStart Overlap start.
   */
  tryStartNextLoop(audioElement, overlapStart) {
    if (this.shouldStartNextLoop(audioElement, overlapStart)) {
      this.startNextMusicLoop(audioElement);
    }
  }

  /**
   * Should start next loop.
   * Performs hitbox or collision checks.
   * Updates the instance state.
   * @param {HTMLElement} audioElement Audio element.
   * @param {*} overlapStart Overlap start.
   * @returns {boolean} Whether start next loop.
   */
  shouldStartNextLoop(audioElement, overlapStart) {
    return (
      !this.nextMusicAudio &&
      this.musicLoopCut > 0 &&
      audioElement.currentTime >= overlapStart
    );
  }

  /**
   * Try complete loop.
   * Updates the instance state.
   * @param {HTMLElement} audioElement Audio element.
   * @param {*} cutoff Cutoff.
   */
  tryCompleteLoop(audioElement, cutoff) {
    if (this.shouldCompleteLoop(audioElement, cutoff)) {
      this.completeMusicSwitch(audioElement);
    }
  }

  /**
   * Should complete loop.
   * Updates the instance state.
   * @param {HTMLElement} audioElement Audio element.
   * @param {*} cutoff Cutoff.
   * @returns {boolean} Whether complete loop.
   */
  shouldCompleteLoop(audioElement, cutoff) {
    return (
      this.nextMusicAudio &&
      this.fadeInterval === null &&
      audioElement.currentTime >= cutoff
    );
  }

  /**
   * Detach loop watcher.
   * Updates the instance state.
   * @param {HTMLElement} audioElement Audio element.
   */
  detachLoopWatcher(audioElement) {
    const handler = this.loopHandlers.get(audioElement);
    if (handler) {
      audioElement.removeEventListener("timeupdate", handler);
      this.loopHandlers.delete(audioElement);
    }
  }

  /**
   * Starts next music loop.
   * Updates the instance state.
   * @param {*} current Current.
   */
  startNextMusicLoop(current) {
    this.nextMusicAudio = this.createMusicAudio(0);
    const next = this.nextMusicAudio;
    this.attachMusicLoopWatcher(next);
    this.beginMusicCrossfade(current, next);
    playWhenReady(next, {
      beforePlay: () => {
        next.playbackRate = this.playbackRate;
      },
    });
  }

  /**
   * Begin music crossfade.
   * Schedules timed actions.
   * Updates the instance state.
   * @param {*} current Current.
   * @param {*} next Next.
   */
  beginMusicCrossfade(current, next) {
    this.clearFadeInterval();
    const durationMs = this.getFadeDurationMs();
    const loudnessStepMs = this.loudnessStepMs;
    let elapsedMs = 0;
    this.fadeInterval = setInterval(() => {
      elapsedMs += loudnessStepMs;
      const fadeProgress = Math.min(elapsedMs / durationMs, 1); // 0..1 volume blend
      this.applyCrossfadeVolumes(current, next, fadeProgress);
      if (fadeProgress >= 1) this.completeMusicSwitch(current);
    }, loudnessStepMs);
  }

  /**
   * Applies crossfade volumes.
   * Updates the instance state.
   * @param {*} current Current.
   * @param {*} next Next.
   * @param {number} fadeProgress Fade progress.
   */
  applyCrossfadeVolumes(current, next, fadeProgress) {
    if (current) current.volume = this.volume * (1 - fadeProgress);
    if (next) next.volume = this.volume * fadeProgress;
  }

  /**
   * Clears fade interval.
   * Clears pending timers.
   * Updates the instance state.
   */
  clearFadeInterval() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  }

  /**
   * Clears music tracks.
   * Updates the instance state.
   */
  clearMusicTracks() {
    this.stopNextMusicAudio();
    this.stopMusicAudio();
  }

  /**
   * Complete music switch.
   * Updates the instance state.
   * @param {*} prev Prev.
   */
  completeMusicSwitch(prev) {
    this.clearFadeInterval();
    this.stopPreviousMusicAudio(prev);
    this.swapToNextMusicAudio();
  }

  /**
   * Stops looped audio instance.
   * Triggers audio playback or updates audio state.
   * Updates the instance state.
   * @param {HTMLElement} audioElement Audio element.
   * @returns {*} Result value.
   */
  stopLoopedAudioInstance(audioElement) {
    if (!audioElement) return null;
    this.detachLoopWatcher(audioElement);
    audioElement.pause();
    audioElement.currentTime = 0;
    return null;
  }

  /**
   * Stops previous music audio.
   * Triggers audio playback or updates audio state.
   * Updates the instance state.
   * @param {*} prev Prev.
   */
  stopPreviousMusicAudio(prev) {
    if (!prev) return;
    this.detachLoopWatcher(prev);
    prev.pause();
    prev.currentTime = 0;
  }

  /**
   * Swap to next music audio.
   * Updates the instance state.
   */
  swapToNextMusicAudio() {
    if (!this.nextMusicAudio) return;
    this.musicAudio = this.nextMusicAudio;
    this.nextMusicAudio = null;
    this.musicAudio.volume = this.volume;
  }

  /**
   * Plays defeat.
   * Updates the instance state.
   * @returns {*} Result value.
   */
  playDefeat() {
    if (this.defeatPlayed) return null;
    this.defeatPlayed = true; this.clearFadeInterval();
    const defeat = this.createDefeatAudio(); const howl = this.createHowlEndAudio();
    this.playDefeatAudio(defeat, howl); this.bindUnlock();
    const fadingTracks = this.getFadingTracks();
    if (!fadingTracks.length) return this.finishDefeatWithoutFade(defeat);
    this.startDefeatFade(defeat, fadingTracks);
    return defeat;
  }

  /**
   * Finish defeat without fade.
   * Updates the instance state.
   * @param {*} defeat Defeat.
   * @returns {*} Result value.
   */
  finishDefeatWithoutFade(defeat) {
    defeat.volume = this.volume;
    return defeat;
  }

  /**
   * Creates defeat audio.
   * Updates the instance state.
   * @returns {*} Defeat audio.
   */
  createDefeatAudio() {
    const defeat = this.createAudio(this.defeatSrc, false, 0);
    this.defeatAudio = defeat;
    return defeat;
  }

  /**
   * Creates howl end audio.
   * Updates the instance state.
   * @returns {*} Howl end audio.
   */
  createHowlEndAudio() {
    const howl = this.howlEndSrc
      ? this.createAudio(this.howlEndSrc, false, this.getHitVolume())
      : null;
    this.howlEndAudio = howl;
    return howl;
  }

  /**
   * Plays defeat audio.
   * Uses defeat, howl to perform the operation.
   * @param {*} defeat Defeat.
   * @param {*} howl Howl.
   */
  playDefeatAudio(defeat, howl) {
    playWhenReady(defeat);
    if (howl) playWhenReady(howl);
  }

  /**
   * Returns fading tracks.
   * Updates the instance state.
   * @returns {Array<any>} Fading tracks.
   */
  getFadingTracks() {
    return [this.musicAudio, this.nextMusicAudio, this.gongAudio].filter(Boolean);
  }

  /**
   * Starts defeat fade.
   * Schedules timed actions.
   * Updates the instance state.
   * @param {*} defeat Defeat.
   * @param {*} fadingTracks Fading tracks.
   */
  startDefeatFade(defeat, fadingTracks) {
    const durationMs = this.getFadeDurationMs();
    const loudnessStepMs = this.loudnessStepMs;
    let elapsedMs = 0;
    this.fadeInterval = setInterval(() => {
      elapsedMs += loudnessStepMs;
      const fadeProgress = Math.min(elapsedMs / durationMs, 1); // 0..1 volume blend
      this.applyDefeatFadeVolumes(defeat, fadingTracks, fadeProgress);
      if (fadeProgress >= 1) this.finishDefeatFade(fadingTracks);
    }, loudnessStepMs);
  }

  /**
   * Applies defeat fade volumes.
   * Updates the instance state.
   * @param {*} defeat Defeat.
   * @param {*} fadingTracks Fading tracks.
   * @param {number} fadeProgress Fade progress.
   */
  applyDefeatFadeVolumes(defeat, fadingTracks, fadeProgress) {
    const invertFadeProgress = 1 - fadeProgress; // 1..0 volume blend
    for (const track of fadingTracks) {
      track.volume = this.volume * invertFadeProgress;
    }
    defeat.volume = this.volume * fadeProgress;
  }

  /**
   * Finish defeat fade.
   * Triggers audio playback or updates audio state.
   * Updates the instance state.
   * @param {*} fadingTracks Fading tracks.
   */
  finishDefeatFade(fadingTracks) {
    this.clearFadeInterval();
    fadingTracks.forEach((track) => {
      track.pause();
      track.currentTime = 0;
    });
    this.clearMusicTracks();
    this.clearGongAfterDefeat(fadingTracks);
  }

  /**
   * Clears gong after defeat.
   * Triggers audio playback or updates audio state.
   * Updates the instance state.
   * @param {*} fadingTracks Fading tracks.
   */
  clearGongAfterDefeat(fadingTracks) {
    if (this.gongAudio && !fadingTracks.includes(this.gongAudio)) {
      this.gongAudio.pause();
      this.gongAudio.currentTime = 0;
    }
    this.gongAudio = null;
  }
}
