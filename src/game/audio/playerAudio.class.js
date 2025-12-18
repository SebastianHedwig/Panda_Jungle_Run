const PLAYER_DEAD = "./assets/sfx/player/player-dead.mp3";
const PLAYER_PUNCH = [
  "./assets/sfx/player/player-punch1.mp3",
  "./assets/sfx/player/player-punch2.mp3",
  "./assets/sfx/player/player-punch3.mp3",
  "./assets/sfx/player/player-punch4.mp3",
];
const PLAYER_SHOOT = "./assets/sfx/weapon/weapon-shoot.mp3";
const PLAYER_JUMP = "./assets/sfx/player/player-jump.mp3";
const PLAYER_LANDING = "./assets/sfx/player/player-landing.mp3";

export class PlayerAudio {
  constructor({
    deadSrc = PLAYER_DEAD,
    punchSrcs = PLAYER_PUNCH,
    shootSrc = PLAYER_SHOOT,
    jumpSrc = PLAYER_JUMP,
    landingSrc = PLAYER_LANDING,
    landingOffset = 0.3,
    landingVolume = 0.9,
    volume = 0.7,
    deadRate = 2.0,
  } = {}) {
    this.deadSrc = deadSrc;
    this.punchSrcs = punchSrcs;
    this.shootSrc = shootSrc;
    this.jumpSrc = jumpSrc;
    this.landingSrc = landingSrc;
    this.landingOffset = landingOffset;
    this.landingVolume = Math.min(1, landingVolume ?? volume);
    this.deadRate = deadRate;
    this.volume = volume;
    this.deadAudio = null;
    this.punchCache = new Map();
    this.shootAudio = null;
    this.jumpAudio = null;
    this.landingBase = null;
    this.unlockHandler = null;
  }

  createAudio(src) {
    const el = new Audio(src);
    el.loop = false;
    el.volume = this.volume;
    el.preload = "auto";
    el.autoplay = false;
    return el;
  }

  ensureBase(propName, src) {
    if (!this[propName]) {
      this[propName] = this.createAudio(src);
    }
    return this[propName];
  }

  playOneShot({ propName, src, offset = 0, rate = 1 }) {
    const base = this.ensureBase(propName, src);
    let audio = base;

    if (!base.paused && !base.ended) {
      audio = base.cloneNode(true);
      audio.volume = this.volume;
      audio.preload = "auto";
      audio.autoplay = false;
    } else {
      audio.currentTime = 0;
    }

    const setOffset = () => {
      if (
        offset > 0 &&
        Number.isFinite(audio.duration) &&
        audio.duration > offset
      ) {
        audio.currentTime = offset;
      }
    };

    audio.playbackRate = rate;

    const start = () => {
      try {
        setOffset();
      } catch (_) {}
      audio.play().catch(() => {});
    };

    if (audio.readyState >= 2) start();
    else {
      audio.addEventListener("canplaythrough", start, { once: true });
      audio.addEventListener("loadeddata", start, { once: true });
      audio.addEventListener("loadedmetadata", setOffset, { once: true });
    }
    audio.load();
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

  playPunch() {
    if (!this.punchSrcs?.length) return;
    const idx = Math.floor(Math.random() * this.punchSrcs.length);
    const src = this.punchSrcs[idx];
    this.getPunchAudio(src);
    this.playOneShot({ propName: "_punchTemp", src, offset: 0, rate: 1 });
  }

  playShoot() {
    this.playOneShot({ propName: "shootAudio", src: this.shootSrc });
  }

  playJump() {
    this.playOneShot({ propName: "jumpAudio", src: this.jumpSrc });
  }

  playLanding() {
    const base =
      this.landingBase && this.landingBase.src === this.landingSrc
        ? this.landingBase
        : (this.landingBase = this.createAudio(this.landingSrc));

    const audio = base.cloneNode(true);
    audio.volume = this.landingVolume;
    audio.preload = "auto";
    audio.autoplay = false;

    const start = () => {
      try {
        const dur = audio.duration;
        const targetOffset =
          this.landingOffset > 0 && Number.isFinite(dur)
            ? Math.max(0, Math.min(this.landingOffset, Math.max(0, dur - 0.05)))
            : 0;
        if (Number.isFinite(targetOffset)) audio.currentTime = targetOffset;
      } catch (_) {}
      audio.play().catch(() => {});
    };

    if (audio.readyState >= 2) start();
    else {
      audio.addEventListener("canplaythrough", start, { once: true });
      audio.addEventListener("loadeddata", start, { once: true });
      audio.addEventListener("loadedmetadata", start, { once: true });
    }
    audio.load();
    this.bindUnlock();
  }

  playDead() {
    if (!this.deadAudio) {
      this.deadAudio = this.createAudio(this.deadSrc);
    } else {
      this.deadAudio.currentTime = 0;
    }
    this.deadAudio.playbackRate = this.deadRate || 1.5;

    const start = () => {
      this.deadAudio.playbackRate = this.deadRate || 1.5;
      this.deadAudio?.play().catch(() => {});
    };
    if (this.deadAudio.readyState >= 2) start();
    else {
      this.deadAudio.addEventListener("canplaythrough", start, {
        once: true,
      });
      this.deadAudio.addEventListener("loadeddata", start, { once: true });
      this.deadAudio.addEventListener(
        "loadedmetadata",
        () => {
          this.deadAudio.playbackRate = this.deadRate || 1.5;
        },
        { once: true }
      );
    }
    this.deadAudio.load();
    this.bindUnlock();
  }

  bindUnlock() {
    if (this.unlockHandler) return;
    this.unlockHandler = () => {
      const audios = [
        this.deadAudio,
        this.shootAudio,
        this.jumpAudio,
        this.landingBase,
        ...this.punchCache.values(),
      ];
      audios.forEach((a) => {
        if (!a) return;
        const prevMuted = a.muted;
        const prevVolume = a.volume;
        a.muted = true;
        a.volume = 0;
        a.play()
          .then(() => {
            a.pause();
            a.currentTime = 0;
          })
          .catch(() => {})
          .finally(() => {
            a.muted = prevMuted;
            a.volume = prevVolume;
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
