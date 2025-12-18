const COIN_PICKUP = "./assets/sfx/coin/coin-pickup.mp3";
const HEART_PICKUP = "./assets/sfx/heart/heart-pickup.mp3";
const WEAPON_PICKUP = "./assets/sfx/weapon/weapon-pickup.mp3";

export class CollectablesAudio {
  constructor({
    coinSrc = COIN_PICKUP,
    heartSrc = HEART_PICKUP,
    weaponSrc = WEAPON_PICKUP,
    volume = 0.6,
  } = {}) {
    this.coinSrc = coinSrc;
    this.heartSrc = heartSrc;
    this.weaponSrc = weaponSrc;
    this.volume = volume;
    this.cache = new Map();
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

  getBaseAudio(key, src) {
    let audio = this.cache.get(key);
    if (!audio) {
      audio = this.createAudio(src);
      this.cache.set(key, audio);
    }
    return audio;
  }

  playSound(key, src) {
    const base = this.getBaseAudio(key, src);
    let audio = base;

    if (!base.paused && !base.ended) {
      audio = base.cloneNode(true);
      audio.volume = this.volume;
      audio.preload = "auto";
      audio.autoplay = false;
    } else {
      base.currentTime = 0;
    }

    const start = () => audio.play().catch(() => {});
    if (audio.readyState >= 2) start();
    else {
      audio.addEventListener("canplaythrough", start, { once: true });
      audio.addEventListener("loadeddata", start, { once: true });
    }
    audio.load();
    this.bindUnlock();
  }

  playCoin() {
    this.playSound("coin", this.coinSrc);
  }

  playHeart() {
    this.playSound("heart", this.heartSrc);
  }

  playWeapon() {
    this.playSound("weapon", this.weaponSrc);
  }

  bindUnlock() {
    if (this.unlockHandler) return;
    this.unlockHandler = () => {
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
