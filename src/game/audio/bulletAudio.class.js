import { SFX_VOLUME } from "../../config/config.js";
import { mobileAudioUnlock } from "../../app/audio/mobileAudioUnlock.js";
import { createAudioElement, playWhenReady } from "./audioUtils.js";

export class BulletAudio {
  constructor({
    impactSrc = "./assets/sfx/weapon/weapon-impact.mp3",
    impactDurationMs = 900,
    fadeOutMs = 200,
    volume = SFX_VOLUME,
  } = {}) {
    this.impactSrc = impactSrc;
    this.impactDurationMs = impactDurationMs;
    this.fadeOutMs = fadeOutMs;
    this.volume = volume;
    this.impactPoolSize = 2;
    this.impactPool = null;
    this.impactRoundPointer = 0;

    mobileAudioUnlock.addAudios(() => this.getWarmupAudios());
    mobileAudioUnlock.bind();
  }

  createAudio(src) {
    return createAudioElement(src, { volume: this.volume });
  }

  ensureImpactPool() {
    if (!this.impactPool) {
      this.impactPool = Array.from({ length: this.impactPoolSize }, () =>
        this.createAudio(this.impactSrc)
      );
      this.impactRoundPointer = 0;
    }
    return this.impactPool;
  }

  nextImpactAudio() { // Round-Robin selection from impactPool
    const pool = this.ensureImpactPool();
    const audio = pool[this.impactRoundPointer];
    this.impactRoundPointer =
      (this.impactRoundPointer + 1) % pool.length;
    audio.volume = this.volume;
    audio.currentTime = 0;
    return audio;
  }

  playImpact() {
    const audio = this.nextImpactAudio();

    const stopAndResetImpact = () => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = this.volume;
    };

    const start = () => {
      const impactTotalMs = this.impactDurationMs;
      const fadeOutDurationMs = Math.max(0, Math.min(this.fadeOutMs, impactTotalMs));
      const fadeStartMs = Math.max(0, impactTotalMs - fadeOutDurationMs);
      let fadeIntervalId = null;

      const startFade = () => {
        if (fadeOutDurationMs <= 0) return;
        const loudnessStepMs = 50;
        let elapsedMs = 0;
        fadeIntervalId = setInterval(() => {
          elapsedMs += loudnessStepMs;
          const fadeProgress = Math.min(elapsedMs / fadeOutDurationMs, 1); // 0..1 volume blend
          audio.volume = this.volume * (1 - fadeProgress);
          if (fadeProgress >= 1) {
            clearInterval(fadeIntervalId);
          }
        }, loudnessStepMs);
      };

      setTimeout(startFade, fadeStartMs);
      setTimeout(() => {
        if (fadeIntervalId) clearInterval(fadeIntervalId);
        stopAndResetImpact();
      }, impactTotalMs);
    };

    playWhenReady(audio, { beforePlay: start });
  }

  getWarmupAudios() {
    return this.ensureImpactPool()[0];
  }
}
