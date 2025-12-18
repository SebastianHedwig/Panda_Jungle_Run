const DEFAULT_IMPACT_SRC = "./assets/sfx/weapon/weapon-impact.mp3";

export class BulletAudio {
  constructor({
    impactSrc = DEFAULT_IMPACT_SRC,
    impactDurationMs = 900,
    fadeOutMs = 200,
    volume = 0.6,
  } = {}) {
    this.impactSrc = impactSrc;
    this.impactDurationMs = impactDurationMs;
    this.fadeOutMs = fadeOutMs;
    this.volume = volume;
    this.impactBase = null;
  }

  createAudio(src) {
    const audio = new Audio(src);
    audio.loop = false;
    audio.volume = this.volume;
    audio.preload = "auto";
    audio.autoplay = false;
    return audio;
  }

  getImpactAudio() {
    if (!this.impactBase) {
      this.impactBase = this.createAudio(this.impactSrc);
    }
    return this.impactBase;
  }

  playImpact() {
    const base = this.getImpactAudio();
    let audio = base;

    if (!base.paused && !base.ended) {
      audio = base.cloneNode(true);
      audio.volume = this.volume;
      audio.preload = "auto";
      audio.autoplay = false;
    } else {
      base.currentTime = 0;
    }

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
}
