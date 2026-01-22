import { SFX_VOLUME } from "../../config/config.js";
import { mobileAudioUnlock } from "../../app/audio/mobileAudioUnlock.js";

const COIN_PICKUP = "./assets/sfx/coin/coin-pickup.mp3";
const HEART_PICKUP = "./assets/sfx/heart/heart-pickup.mp3";
const WEAPON_PICKUP = "./assets/sfx/weapon/weapon-pickup.mp3";

export class CollectablesAudio {
  constructor({
    coinSrc = COIN_PICKUP,
    heartSrc = HEART_PICKUP,
    weaponSrc = WEAPON_PICKUP,
    volume = SFX_VOLUME,
  } = {}) {
    this.coinSrc = coinSrc;
    this.heartSrc = heartSrc;
    this.weaponSrc = weaponSrc;
    this.volume = volume;
    this.poolSize = 3;
    this.cache = new Map(); // key -> { pool: Audio[], idx: number }

    mobileAudioUnlock.addAudios(() => this.collectWarmupAudios());
    mobileAudioUnlock.bind();
  }

  createAudio(src) {
    const el = new Audio(src);
    el.loop = false;
    el.volume = this.volume;
    el.preload = "auto";
    el.autoplay = false;
    return el;
  }

  ensurePool(key, src) {
    let entry = this.cache.get(key);
    if (!entry) {
      const pool = Array.from({ length: this.poolSize }, () => this.createAudio(src));
      entry = { pool, idx: 0 };
      this.cache.set(key, entry);
    }
    return entry;
  }

  nextAudioFromPool(key, src) {
    const entry = this.ensurePool(key, src);
    const audio = entry.pool[entry.idx];
    entry.idx = (entry.idx + 1) % entry.pool.length;
    audio.volume = this.volume;
    audio.currentTime = 0;
    return audio;
  }

  playSound(key, src) {
    const audio = this.nextAudioFromPool(key, src);

    const start = () => audio.play().catch(() => {});
    if (audio.readyState >= 2) start();
    else {
      audio.addEventListener("canplaythrough", start, { once: true });
      audio.addEventListener("loadeddata", start, { once: true });
    }
    audio.load();
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

  collectWarmupAudios() {
    return [
      this.ensurePool("coin", this.coinSrc).pool[0],
      this.ensurePool("heart", this.heartSrc).pool[0],
      this.ensurePool("weapon", this.weaponSrc).pool[0],
    ];
  }
}
