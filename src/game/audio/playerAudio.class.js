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

export class PlayerAudio {
  constructor({
    deadSrc = PLAYER_DEAD,
    punchSrcs = PLAYER_PUNCH,
    ouchSrcs = PLAYER_OUCH,
    hitSrc = PLAYER_HIT,
    shootSrc = PLAYER_SHOOT,
    jumpSrc = PLAYER_JUMP,
    landingSrc = PLAYER_LANDING,
    slideSrcs = PLAYER_SLIDE,
    landingOffset = 0.3,
    landingVolume = SFX_VOLUME + 0.3,
    volume = SFX_VOLUME,
    deadRate = 2.5,
  } = {}) {
    this.deadSrc = deadSrc;
    this.punchSrcs = punchSrcs;
    this.ouchSrcs = ouchSrcs;
    this.hitSrc = hitSrc;
    this.shootSrc = shootSrc;
    this.jumpSrc = jumpSrc;
    this.landingSrc = landingSrc;
    this.slideSrcs = slideSrcs;
    this.landingOffset = landingOffset;
    this.landingVolume = Math.min(1, landingVolume ?? volume);
    this.deadRate = deadRate;
    this.volume = volume;
    this.deadAudio = null;
    this.punchCache = new Map();
    this.hitAudio = null;
    this.ouchCache = new Map();
    this.shootAudio = null;
    this.jumpAudio = null;
    this.landingBase = null;
    this.slideAudio0 = null;
    this.slideAudio1 = null;
    this.unlockHandler = null;
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
    let audio = cachedAudioBaseInstance;

    if (forceClone || (!cachedAudioBaseInstance.paused && !cachedAudioBaseInstance.ended)) {
      audio = cachedAudioBaseInstance.cloneNode(true);
      audio.volume = this.volume;
      audio.preload = "auto";
      audio.autoplay = false;
    } else {
      audio.currentTime = 0;
    }

    if (rate !== 1) {
      audio.playbackRate = rate;
    }

    const setOffset = () => {
      if (
        audioStartOffset > 0 &&
        Number.isFinite(audio.duration) &&
        audio.duration > audioStartOffset
      ) {
        audio.currentTime = audioStartOffset;
      }
    };

    const startAudio = () => {
      setOffset();
    };

    
    playWhenReady(audio, {
      beforePlay: startAudio,
      onMetadata: setOffset,
    });

    this.bindUnlock();
    return audio;
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
    const cachedLandingBase =
      this.landingBase && this.landingBase.src === this.landingSrc
        ? this.landingBase
        : (this.landingBase = this.createAudio(this.landingSrc));

    const audio = cachedLandingBase.cloneNode(true);
    audio.volume = this.landingVolume;
    audio.preload = "auto";
    audio.autoplay = false;

    const setLandingOffset = () => {
      const landingEndSafetyMargin = 0.05;
      const duration = audio.duration;
      if (Number.isFinite(duration)) {
        const latestSafeStart = Math.max(0, duration - landingEndSafetyMargin);
        const clampedOffset = Math.min(
          Math.max(0, this.landingOffset),
          latestSafeStart
        );
        audio.currentTime = clampedOffset;
      } else {
        audio.currentTime = 0;
      }
    };

    playWhenReady(audio, {
      beforePlay: setLandingOffset,
      onMetadata: setLandingOffset,
    });
    this.bindUnlock();
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
      const audioFiles = [
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
      audioFiles.forEach((audioFile) => {
        if (!audioFile) return;
        const previousMuted = audioFile.muted;
        const previousVolume = audioFile.volume;
        audioFile.muted = true;
        audioFile.volume = 0;
        audioFile.play()
          .then(() => {
            audioFile.pause();
            audioFile.currentTime = 0;
          })
          .finally(() => {
            audioFile.muted = previousMuted;
            audioFile.volume = previousVolume;
          });
      });
      this.unbindUnlock();
    };
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
