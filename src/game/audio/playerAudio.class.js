import { SFX_VOLUME } from "../../config/config.js";
import { createAudioElement, playWhenReady } from "./audioUtils.js";

const PLAYER_DEAD = "./assets/sfx/player/player-dead.mp3";
const PLAYER_PUNCH = [
  "./assets/sfx/player/player-punch1.mp3",
  "./assets/sfx/player/player-punch2.mp3",
  "./assets/sfx/player/player-punch3.mp3",
  "./assets/sfx/player/player-punch4.mp3",
];
const PLAYER_OUCH = [
  "./assets/sfx/player/player-ouw1.mp3",
  "./assets/sfx/player/player-ouw2.mp3",
  "./assets/sfx/player/player-ouw3.mp3",
];
const PLAYER_HIT = "./assets/sfx/player/player-punch-hit.mp3";
const PLAYER_SHOOT = "./assets/sfx/weapon/weapon-shoot.mp3";
const PLAYER_JUMP = "./assets/sfx/player/player-jump.mp3";
const PLAYER_LANDING = "./assets/sfx/player/player-landing.mp3";
const PLAYER_SLIDE = [
  "./assets/sfx/player/player-slide1.mp3",
  "./assets/sfx/player/player-slide2.mp3",
];

/**
 * Builds player audio sources. If omitted, default values are used.
 * Applies physics updates like gravity and velocity.
 * @param {Object} [options] Configuration options.
 * @param {string} [options.deadSrc] Dead src.
 * @param {*} [options.punchSrcs] Punch srcs.
 * @param {*} [options.ouchSrcs] Ouch srcs.
 * @param {string} [options.hitSrc] Hit src.
 * @param {string} [options.shootSrc] Shoot src.
 * @param {string} [options.jumpSrc] Jump src.
 * @param {string} [options.landingSrc] Landing src.
 * @param {*} [options.slideSrcs] Slide srcs.
 * @param {*} [options.}] Value.
 */
function buildPlayerAudioSources({
  deadSrc = PLAYER_DEAD,
  punchSrcs = PLAYER_PUNCH,
  ouchSrcs = PLAYER_OUCH,
  hitSrc = PLAYER_HIT,
  shootSrc = PLAYER_SHOOT,
  jumpSrc = PLAYER_JUMP,
  landingSrc = PLAYER_LANDING,
  slideSrcs = PLAYER_SLIDE,
} = {}) {
  return { deadSrc, punchSrcs, ouchSrcs, hitSrc, shootSrc, jumpSrc, landingSrc, slideSrcs };
}

/**
 * Builds player audio settings. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 * @param {number} [options.landingOffset] Landing offset.
 * @param {number} [options.landingVolume] Landing volume.
 * @param {number} [options.volume] Volume.
 * @param {number} [options.deadRate] Dead rate.
 * @param {*} [options.}] Value.
 */
function buildPlayerAudioSettings({
  landingOffset = 0.3,
  landingVolume = SFX_VOLUME + 0.3,
  volume = SFX_VOLUME,
  deadRate = 2.5,
} = {}) {
  return { landingOffset, landingVolume: Math.min(1, landingVolume ?? volume), deadRate, volume };
}

/**
 * Builds player audio config. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 */
function buildPlayerAudioConfig(options = {}) {
  return { ...buildPlayerAudioSources(options), ...buildPlayerAudioSettings(options) };
}

/**
 * Builds player audio state.
 * Applies physics updates like gravity and velocity.
 * @returns {Object} Player audio state.
 */
function buildPlayerAudioState() {
  return {
    deadAudio: null,
    punchCache: new Map(),
    hitAudio: null,
    ouchCache: new Map(),
    shootAudio: null,
    jumpAudio: null,
    landingBase: null,
    slideAudio0: null,
    slideAudio1: null,
    unlockHandler: null,
  };
}

export class PlayerAudio {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   */
  constructor(options = {}) {
    Object.assign(this, buildPlayerAudioConfig(options));
    Object.assign(this, buildPlayerAudioState());
  }

  /**
   * Creates audio.
   * Updates the instance state.
   * @param {string} src Source URL.
   * @returns {*} Audio.
   */
  createAudio(src) {
    return createAudioElement(src, { volume: this.volume });
  }

  /**
   * Ensure base.
   * Updates the instance state.
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

  /**
   * Plays one shot. If omitted, default values are used.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   * @param {string} [options.propertyName] Property name.
   * @param {string} [options.src] Source URL.
   * @param {number} [options.audioStartOffset] Audio start offset.
   * @param {number} [options.rate] Rate.
   * @param {*} [options.forceClone] Force clone.
   */
  playOneShot({ propertyName, src, audioStartOffset = 0, rate = 1, forceClone = false }) {
    const cachedAudioBaseInstance = this.ensureBase(propertyName, src);
    const audio = this.prepareOneShotAudio(cachedAudioBaseInstance, forceClone, rate);
    const setOffset = this.createOffsetSetter(audio, audioStartOffset);
    this.queueOneShotPlayback(audio, setOffset);
    this.bindUnlock();
    return audio;
  }

  /**
   * Prepares one shot audio.
   * Updates the instance state.
   * @param {*} cachedAudioBaseInstance Cached audio base instance.
   * @param {*} forceClone Force clone.
   * @param {number} rate Rate.
   * @returns {*} Result value.
   */
  prepareOneShotAudio(cachedAudioBaseInstance, forceClone, rate) {
    let audio = cachedAudioBaseInstance;
    if (forceClone || this.shouldCloneAudio(cachedAudioBaseInstance)) {
      audio = this.cloneAudioInstance(cachedAudioBaseInstance);
    } else {
      audio.currentTime = 0;
    }
    if (rate !== 1) audio.playbackRate = rate;
    return audio;
  }

  /**
   * Should clone audio.
   * Uses cachedAudioBaseInstance to perform the operation.
   * @param {*} cachedAudioBaseInstance Cached audio base instance.
   * @returns {boolean} Whether clone audio.
   */
  shouldCloneAudio(cachedAudioBaseInstance) {
    return !cachedAudioBaseInstance.paused && !cachedAudioBaseInstance.ended;
  }

  /**
   * Clone audio instance.
   * Updates the instance state.
   * @param {*} cachedAudioBaseInstance Cached audio base instance.
   * @returns {*} Result value.
   */
  cloneAudioInstance(cachedAudioBaseInstance) {
    const audio = cachedAudioBaseInstance.cloneNode(true);
    audio.volume = this.volume;
    audio.preload = "auto";
    audio.autoplay = false;
    return audio;
  }

  /**
   * Creates offset setter.
   * Uses audio, audioStartOffset to compute the result.
   * @param {HTMLAudioElement} audio Audio element.
   * @param {number} audioStartOffset Audio start offset.
   * @returns {*} Offset setter.
   */
  createOffsetSetter(audio, audioStartOffset) {
    return () => {
      if (
        audioStartOffset > 0 &&
        Number.isFinite(audio.duration) &&
        audio.duration > audioStartOffset
      ) {
        audio.currentTime = audioStartOffset;
      }
    };
  }

  /**
   * Queues one shot playback.
   * Uses audio, setOffset to perform the operation.
   * @param {HTMLAudioElement} audio Audio element.
   * @param {number} setOffset Set offset.
   */
  queueOneShotPlayback(audio, setOffset) {
    playWhenReady(audio, {
      beforePlay: setOffset,
      onMetadata: setOffset,
    });
  }

  /**
   * Returns punch audio.
   * Updates the instance state.
   * @param {string} src Source URL.
   * @returns {*} Punch audio.
   */
  getPunchAudio(src) {
    let audio = this.punchCache.get(src);
    if (!audio) {
      audio = this.createAudio(src);
      this.punchCache.set(src, audio);
    }
    return audio;
  }

  /**
   * Returns ouch audio.
   * Updates the instance state.
   * @param {string} src Source URL.
   * @returns {*} Ouch audio.
   */
  getOuchAudio(src) {
    let audio = this.ouchCache.get(src);
    if (!audio) {
      audio = this.createAudio(src);
      this.ouchCache.set(src, audio);
    }
    return audio;
  }

  /**
   * Plays punch.
   * Performs hitbox or collision checks.
   * Updates the instance state.
   */
  playPunch() {
    if (!this.punchSrcs?.length) return;
    const randomPunchIndex = Math.floor(Math.random() * this.punchSrcs.length);
    const src = this.punchSrcs[randomPunchIndex];
    this.getPunchAudio(src);
    this.playOneShot({
      propertyName: `punchAudio${randomPunchIndex}`,
      src,
      audioStartOffset: 0,
      rate: 1,
      forceClone: true, // allow overlaps when spammed
    });
  }

  /**
   * Plays hit.
   * Updates the instance state.
   */
  playHit() {
    if (!this.hitSrc) return;
    this.playOneShot({ propertyName: "hitAudio", src: this.hitSrc });
  }

  /**
   * Plays shoot.
   * Updates the instance state.
   */
  playShoot() {
    this.playOneShot({ propertyName: "shootAudio", src: this.shootSrc });
  }

  /**
   * Plays ouch.
   * Updates the instance state.
   * Introduces randomness into the outcome.
   */
  playOuch() {
    if (!this.ouchSrcs?.length) return;
    const randomOuchIndex = Math.floor(Math.random() * this.ouchSrcs.length);
    const src = this.ouchSrcs[randomOuchIndex];
    this.getOuchAudio(src);
    const propertyName = `ouchAudio${randomOuchIndex}`;
    this.playOneShot({ propertyName, src });
  }

  /**
   * Plays jump.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   */
  playJump() {
    this.playOneShot({ propertyName: "jumpAudio", src: this.jumpSrc });
  }

  /**
   * Plays landing.
   * Updates the instance state.
   */
  playLanding() {
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
  getLandingBase() {
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
  cloneLandingAudio(cachedLandingBase) {
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
  applyLandingOffset(audio) {
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

  /**
   * Plays slide.
   * Updates the instance state.
   * Introduces randomness into the outcome.
   */
  playSlide() {
    if (!this.slideSrcs?.length) return;
    const randomSlideIndex = Math.floor(Math.random() * this.slideSrcs.length);
    const src = this.slideSrcs[randomSlideIndex];
    const propertyName = `slideAudio${randomSlideIndex}`;
    this.playOneShot({ propertyName, src });
  }

  /**
   * Plays dead.
   * Updates the instance state.
   */
  playDead() {
    this.playOneShot({
      propertyName: "deadAudio",
      src: this.deadSrc,
      rate: this.deadRate,
    });
  }

  /**
   * Binds unlock.
   * Updates the instance state.
   */
  bindUnlock() {
    if (this.unlockHandler) return;
    this.unlockHandler = () => {
      const audioFiles = this.getUnlockAudioFiles();
      audioFiles.forEach((audioFile) => this.warmupAudioFile(audioFile));
      this.unbindUnlock();
    };
    this.addUnlockListeners();
  }

  /**
   * Returns unlock audio files.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   * @returns {Array<any>} Unlock audio files.
   */
  getUnlockAudioFiles() {
    return [
      this.deadAudio,
      this.hitAudio,
      this.shootAudio,
      this.jumpAudio,
      this.landingBase,
      this.slideAudio0,
      this.slideAudio1,
      ...this.ouchCache.values(),
      ...this.punchCache.values(),
    ];
  }

  /**
   * Warmup audio file.
   * Triggers audio playback or updates audio state.
   * Updates the instance state.
   * @param {*} audioFile Audio file.
   */
  warmupAudioFile(audioFile) {
    if (!audioFile) return;
    const previousMuted = audioFile.muted;
    const previousVolume = audioFile.volume;
    this.muteAudioForWarmup(audioFile);
    this.playAndResetAudio(audioFile, previousMuted, previousVolume);
  }

  /**
   * Mute audio for warmup.
   * Triggers audio playback or updates audio state.
   * @param {*} audioFile Audio file.
   */
  muteAudioForWarmup(audioFile) {
    audioFile.muted = true;
    audioFile.volume = 0;
  }

  /**
   * Plays and reset audio.
   * Triggers audio playback or updates audio state.
   * Updates the instance state.
   * @param {*} audioFile Audio file.
   * @param {boolean} previousMuted Previous muted.
   * @param {number} previousVolume Previous volume.
   */
  playAndResetAudio(audioFile, previousMuted, previousVolume) {
    audioFile.play()
      .then(() => this.resetAudioPlayback(audioFile))
      .finally(() => this.restoreAudioState(audioFile, previousMuted, previousVolume));
  }

  /**
   * Resets audio playback.
   * Triggers audio playback or updates audio state.
   * @param {*} audioFile Audio file.
   */
  resetAudioPlayback(audioFile) {
    audioFile.pause();
    audioFile.currentTime = 0;
  }

  /**
   * Restore audio state.
   * Triggers audio playback or updates audio state.
   * @param {*} audioFile Audio file.
   * @param {boolean} previousMuted Previous muted.
   * @param {number} previousVolume Previous volume.
   */
  restoreAudioState(audioFile, previousMuted, previousVolume) {
    audioFile.muted = previousMuted;
    audioFile.volume = previousVolume;
  }

  /**
   * Adds unlock listeners.
   * Binds keydown, pointerdown, touchstart event listeners.
   * Updates the instance state.
   */
  addUnlockListeners() {
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
}
