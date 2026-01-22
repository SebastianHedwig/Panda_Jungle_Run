import { SFX_VOLUME } from "../../config/config.js";
import { mobileAudioUnlock } from "../../app/audio/mobileAudioUnlock.js";

const DEFAULT_IMPACT_SRC = "./assets/sfx/weapon/weapon-impact.mp3";

export class BulletAudio {
  constructor({
    impactSrc = DEFAULT_IMPACT_SRC,
    impactDurationMs = 900,
    fadeOutMs = 200,
    volume = SFX_VOLUME,
  } = {}) {
    this.impactSrc = impactSrc;
    this.impactDurationMs = impactDurationMs;
    this.fadeOutMs = fadeOutMs;
    this.volume = volume;
    this.poolSize = 2;
    this.impactPool = null;

    mobileAudioUnlock.addAudios(() => this.getWarmupAudios());
    mobileAudioUnlock.bind();
  }

  createAudio(src) {
    const audio = new Audio(src);
    audio.loop = false;
    audio.volume = this.volume;
    audio.preload = "auto";
    audio.autoplay = false;
    return audio;
  }

  ensurePool() {
    if (!this.impactPool) {
      this.impactPool = Array.from({ length: this.poolSize }, () =>
        this.createAudio(this.impactSrc)
      );
      this.poolIdx = 0;
    }
    return this.impactPool;
  }

  nextImpactAudio() {
    const pool = this.ensurePool();
    const audio = pool[this.poolIdx];
    this.poolIdx = (this.poolIdx + 1) % pool.length;
    audio.volume = this.volume;
    audio.currentTime = 0;
    return audio;
  }

  playImpact() {
    const audio = this.nextImpactAudio();

    const stopAt = () => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = this.volume;
    };

    const start = () => {
      const total = this.impactDurationMs;
      const fadeMs = Math.max(0, Math.min(this.fadeOutMs, total));
      const fadeStart = Math.max(0, total - fadeMs);
      let fadeInterval = null;

      const startFade = () => {
        if (fadeMs <= 0) return;
        const step = 50;
        let elapsed = 0;
        fadeInterval = setInterval(() => {
          elapsed += step;
          const t = Math.min(elapsed / fadeMs, 1);
          audio.volume = this.volume * (1 - t);
          if (t >= 1) {
            clearInterval(fadeInterval);
          }
        }, step);
      };

      const fadeTimer = setTimeout(startFade, fadeStart);
      const stopTimer = setTimeout(() => {
        if (fadeInterval) clearInterval(fadeInterval);
        stopAt();
      }, total);

      audio.play().catch(() => {
        clearTimeout(fadeTimer);
        clearTimeout(stopTimer);
        if (fadeInterval) clearInterval(fadeInterval);
        stopAt();
      });
    };

    if (audio.readyState >= 2) start();
    else {
      audio.addEventListener("canplaythrough", start, { once: true });
      audio.addEventListener("loadeddata", start, { once: true });
    }
    audio.load();
  }

  getWarmupAudios() {
    return this.ensurePool()[0];
  }
}
