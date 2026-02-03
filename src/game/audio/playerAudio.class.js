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

function buildPlayerAudioSettings({
  landingOffset = 0.3,
  landingVolume = SFX_VOLUME + 0.3,
  volume = SFX_VOLUME,
  deadRate = 2.5,
} = {}) {
  return { landingOffset, landingVolume: Math.min(1, landingVolume ?? volume), deadRate, volume };
}

function buildPlayerAudioConfig(options = {}) {
  return { ...buildPlayerAudioSources(options), ...buildPlayerAudioSettings(options) };
}

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
  constructor(options = {}) {
    Object.assign(this, buildPlayerAudioConfig(options));
    Object.assign(this, buildPlayerAudioState());
  }

  createAudio(src) {
    return createAudioElement(src, { volume: this.volume });
  }

  ensureBase(propertyName, src) {
    if (!this[propertyName]) {
      this[propertyName] = this.createAudio(src);
    }
    return this[propertyName];
  }

  playOneShot({ propertyName, src, audioStartOffset = 0, rate = 1, forceClone = false }) {
    const cachedAudioBaseInstance = this.ensureBase(propertyName, src);
    const audio = this.prepareOneShotAudio(cachedAudioBaseInstance, forceClone, rate);
    const setOffset = this.createOffsetSetter(audio, audioStartOffset);
    this.queueOneShotPlayback(audio, setOffset);
    this.bindUnlock();
    return audio;
  }

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

  shouldCloneAudio(cachedAudioBaseInstance) {
    return !cachedAudioBaseInstance.paused && !cachedAudioBaseInstance.ended;
  }

  cloneAudioInstance(cachedAudioBaseInstance) {
    const audio = cachedAudioBaseInstance.cloneNode(true);
    audio.volume = this.volume;
    audio.preload = "auto";
    audio.autoplay = false;
    return audio;
  }

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

  queueOneShotPlayback(audio, setOffset) {
    playWhenReady(audio, {
      beforePlay: setOffset,
      onMetadata: setOffset,
    });
  }

  getPunchAudio(src) {
    let audio = this.punchCache.get(src);
    if (!audio) {
      audio = this.createAudio(src);
      this.punchCache.set(src, audio);
    }
    return audio;
  }

  getOuchAudio(src) {
    let audio = this.ouchCache.get(src);
    if (!audio) {
      audio = this.createAudio(src);
      this.ouchCache.set(src, audio);
    }
    return audio;
  }

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

  playHit() {
    if (!this.hitSrc) return;
    this.playOneShot({ propertyName: "hitAudio", src: this.hitSrc });
  }

  playShoot() {
    this.playOneShot({ propertyName: "shootAudio", src: this.shootSrc });
  }

  playOuch() {
    if (!this.ouchSrcs?.length) return;
    const randomOuchIndex = Math.floor(Math.random() * this.ouchSrcs.length);
    const src = this.ouchSrcs[randomOuchIndex];
    this.getOuchAudio(src);
    const propertyName = `ouchAudio${randomOuchIndex}`;
    this.playOneShot({ propertyName, src });
  }

  playJump() {
    this.playOneShot({ propertyName: "jumpAudio", src: this.jumpSrc });
  }

  playLanding() {
    const cachedLandingBase = this.getLandingBase();
    const audio = this.cloneLandingAudio(cachedLandingBase);
    const setLandingOffset = () => this.applyLandingOffset(audio);
    playWhenReady(audio, { beforePlay: setLandingOffset, onMetadata: setLandingOffset });
    this.bindUnlock();
  }

  getLandingBase() {
    if (this.landingBase && this.landingBase.src === this.landingSrc) {
      return this.landingBase;
    }
    this.landingBase = this.createAudio(this.landingSrc);
    return this.landingBase;
  }

  cloneLandingAudio(cachedLandingBase) {
    const audio = cachedLandingBase.cloneNode(true);
    audio.volume = this.landingVolume;
    audio.preload = "auto";
    audio.autoplay = false;
    return audio;
  }

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

  playSlide() {
    if (!this.slideSrcs?.length) return;
    const randomSlideIndex = Math.floor(Math.random() * this.slideSrcs.length);
    const src = this.slideSrcs[randomSlideIndex];
    const propertyName = `slideAudio${randomSlideIndex}`;
    this.playOneShot({ propertyName, src });
  }

  playDead() {
    this.playOneShot({
      propertyName: "deadAudio",
      src: this.deadSrc,
      rate: this.deadRate,
    });
  }

  bindUnlock() {
    if (this.unlockHandler) return;
    this.unlockHandler = () => {
      const audioFiles = this.getUnlockAudioFiles();
      audioFiles.forEach((audioFile) => this.warmupAudioFile(audioFile));
      this.unbindUnlock();
    };
    this.addUnlockListeners();
  }

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

  warmupAudioFile(audioFile) {
    if (!audioFile) return;
    const previousMuted = audioFile.muted;
    const previousVolume = audioFile.volume;
    this.muteAudioForWarmup(audioFile);
    this.playAndResetAudio(audioFile, previousMuted, previousVolume);
  }

  muteAudioForWarmup(audioFile) {
    audioFile.muted = true;
    audioFile.volume = 0;
  }

  playAndResetAudio(audioFile, previousMuted, previousVolume) {
    audioFile.play()
      .then(() => this.resetAudioPlayback(audioFile))
      .finally(() => this.restoreAudioState(audioFile, previousMuted, previousVolume));
  }

  resetAudioPlayback(audioFile) {
    audioFile.pause();
    audioFile.currentTime = 0;
  }

  restoreAudioState(audioFile, previousMuted, previousVolume) {
    audioFile.muted = previousMuted;
    audioFile.volume = previousVolume;
  }

  addUnlockListeners() {
    window.addEventListener("pointerdown", this.unlockHandler, { once: true });
    window.addEventListener("keydown", this.unlockHandler, { once: true });
    window.addEventListener("touchstart", this.unlockHandler, { once: true });
  }

  unbindUnlock() {
    if (!this.unlockHandler) return;
    window.removeEventListener("pointerdown", this.unlockHandler);
    window.removeEventListener("keydown", this.unlockHandler);
    window.removeEventListener("touchstart", this.unlockHandler);
    this.unlockHandler = null;
  }
}
