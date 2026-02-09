import { SFX_VOLUME } from "../../config/config.js";
import { mobileAudioUnlock } from "../../app/audio/mobileAudioUnlock.js";
import { createAudioElement, playWhenReady } from "./audioUtils.js";

const COIN_PICKUP = "./assets/sfx/coin/coin-pickup.mp3";
const HEART_PICKUP = "./assets/sfx/heart/heart-pickup.mp3";
const WEAPON_PICKUP = "./assets/sfx/weapon/weapon-pickup.mp3";

export class CollectablesAudio {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Used to set up required data for audio playback.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   * @param {string} [options.coinSrc] Coin src.
   * @param {string} [options.heartSrc] Heart src.
   * @param {string} [options.weaponSrc] Weapon src.
   * @param {number} [options.volume] Volume.
   * @param {*} [options.}] Value.
   */
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
    this.soundPoolSize = 3;
    this.cache = new Map(); // key: soundKey, value: { soundPool: Audio[], roundPointer: number }

    mobileAudioUnlock.addAudios(() => this.collectWarmupAudios());
    mobileAudioUnlock.bind();
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
   * Ensure sound pool.
   * Used to support audio playback.
   * @param {string} soundKey Sound key.
   * @param {string} src Source URL.
   * @returns {*} Result value.
   */
  ensureSoundPool(soundKey, src) {
    let soundPoolEntry = this.cache.get(soundKey);
    if (!soundPoolEntry) {
      const soundPool = Array.from({ length: this.soundPoolSize }, () => this.createAudio(src));
      soundPoolEntry = { soundPool, roundPointer: 0 };
      this.cache.set(soundKey, soundPoolEntry);
    }
    return soundPoolEntry;
  }

  /**
   * Next audio from pool.
   * Used to support audio playback.
   * @param {string} soundKey Sound key.
   * @param {string} src Source URL.
   * @returns {*} Result value.
   */
  nextAudioFromPool(soundKey, src) { // Round-Robin selection from soundPool
    const soundPoolEntry = this.ensureSoundPool(soundKey, src);
    const audio = soundPoolEntry.soundPool[soundPoolEntry.roundPointer];
    soundPoolEntry.roundPointer =
      (soundPoolEntry.roundPointer + 1) % soundPoolEntry.soundPool.length;
    audio.volume = this.volume;
    audio.currentTime = 0;
    return audio;
  }

  /**
   * Plays sound.
   * Used to support audio playback.
   * @param {string} soundKey Sound key.
   * @param {string} src Source URL.
   */
  playSound(soundKey, src) {
    const audio = this.nextAudioFromPool(soundKey, src);
    playWhenReady(audio);
  }

  /**
   * Plays coin.
   */
  playCoin() {
    this.playSound("coin", this.coinSrc);
  }

  /**
   * Plays heart.
   */
  playHeart() {
    this.playSound("heart", this.heartSrc);
  }

  /**
   * Plays weapon.
   */
  playWeapon() {
    this.playSound("weapon", this.weaponSrc);
  }

  /**
   * Collect warmup audios.
   * Used to support audio playback.
   * @returns {Array<any>} Result value.
   */
  collectWarmupAudios() {
    return [
      this.ensureSoundPool("coin", this.coinSrc).soundPool[0],
      this.ensureSoundPool("heart", this.heartSrc).soundPool[0],
      this.ensureSoundPool("weapon", this.weaponSrc).soundPool[0],
    ];
  }
}
