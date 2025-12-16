import { MUSIC_LOOP_CUT, MUSIC_VOLUME } from "../../config/config.js";

export class GameAudio {
  constructor(src = "./assets/music/wildlife-jungle-background-game-music.mp3") {
    this.src = src;
    this.audio = null;
    this.nextAudio = null;
    this.ready = false;
    this.readyPromise = null;
    this.loopCut = MUSIC_LOOP_CUT ?? 0;
    this.volume = MUSIC_VOLUME ?? 0.35;
    this.overlapDuration = 1;
    this.cutoff = 0;
    this.overlapStart = 0;
    this.crossfadeTimer = null;
    this.loopListeners = new WeakMap();
    this.unlockHandler = null;
  }

  createAudioElement() {
    const element = new Audio(this.src);
    element.loop = false;
    element.volume = this.volume;
    element.preload = "auto";
    element.autoplay = true;
    return element;
  }

  init() {
    if (this.readyPromise) return this.readyPromise;
    this.audio = this.createAudioElement();

    this.readyPromise = new Promise((resolve) => {
      const finish = () => {
        if (this.ready) return;
        this.ready = true;
        resolve(true);
      };

      this.audio.addEventListener(
        "loadedmetadata",
        () => {
          const duration = this.audio.duration || 0;
          this.cutoff = Math.max(0.01, duration - this.loopCut);
          this.overlapStart = Math.max(0, this.cutoff - this.overlapDuration);
          this.attachLoopWatcher(this.audio);
        },
        { once: true }
      );

      this.audio.addEventListener("canplaythrough", finish, { once: true });
      this.audio.addEventListener("loadeddata", finish, { once: true });
      this.audio.addEventListener("error", () => resolve(false), { once: true });

      this.audio.load();
      this.bindPlaybackUnlock();

      setTimeout(() => resolve(false), 3000);
    });

    return this.readyPromise;
  }

  attachLoopWatcher(audioEl) {
    const onTimeUpdate = () => {
      if (audioEl !== this.audio) return;

      if (
        !this.nextAudio &&
        this.cutoff > 0 &&
        audioEl.currentTime >= this.overlapStart
      ) {
        this.startNextAudio();
      }

      if (this.cutoff > 0 && audioEl.currentTime >= this.cutoff) {
        this.completeLoop();
      }
    };

    audioEl.addEventListener("timeupdate", onTimeUpdate);
    this.loopListeners.set(audioEl, onTimeUpdate);
  }

  startNextAudio() {
    if (this.nextAudio || !this.audio) return;

    this.nextAudio = this.createAudioElement();
    const next = this.nextAudio;
    next.volume = 0;
    this.attachLoopWatcher(next);

    const playNext = () => next.play().catch(() => {});
    if (next.readyState >= 2) {
      playNext();
    } else {
      next.addEventListener("canplaythrough", playNext, { once: true });
      next.addEventListener("loadeddata", playNext, { once: true });
    }

    next.load();
    this.beginCrossfade(this.audio, next);
  }

  beginCrossfade(current, next) {
    this.clearCrossfade();
    const durationMs = Math.max(100, this.overlapDuration * 1000);
    const stepMs = 50;
    let elapsed = 0;

    this.crossfadeTimer = setInterval(() => {
      elapsed += stepMs;
      const t = Math.min(elapsed / durationMs, 1);
      if (current) current.volume = this.volume * (1 - t);
      if (next) next.volume = this.volume * t;

      if (t >= 1) this.clearCrossfade();
    }, stepMs);
  }

  clearCrossfade() {
    if (this.crossfadeTimer) {
      clearInterval(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
  }

  completeLoop() {
    this.clearCrossfade();

    const oldAudio = this.audio;
    const handler = this.loopListeners.get(oldAudio);
    if (handler) {
      oldAudio.removeEventListener("timeupdate", handler);
      this.loopListeners.delete(oldAudio);
    }

    if (this.nextAudio) {
      this.audio = this.nextAudio;
      this.nextAudio = null;
    } else if (this.audio) {
      this.audio.currentTime = 0;
    }

    if (oldAudio && oldAudio !== this.audio) {
      oldAudio.pause();
      oldAudio.currentTime = 0;
    }

    if (this.audio) {
      this.audio.volume = this.volume;
      if (this.audio.paused) this.audio.play().catch(() => {});
    }
  }

  play() {
    if (!this.audio) return Promise.resolve(false);
    return this.audio
      .play()
      .then(() => true)
      .catch(() => false);
  }

  bindPlaybackUnlock() {
    if (this.unlockHandler) return;
    this.unlockHandler = () => {
      this.play().finally(() => {
        window.removeEventListener("pointerdown", this.unlockHandler);
        window.removeEventListener("keydown", this.unlockHandler);
        window.removeEventListener("touchstart", this.unlockHandler);
        this.unlockHandler = null;
      });
    };
    window.addEventListener("pointerdown", this.unlockHandler, { once: true });
    window.addEventListener("keydown", this.unlockHandler, { once: true });
    window.addEventListener("touchstart", this.unlockHandler, { once: true });
  }

  stop() {
    this.clearCrossfade();
    if (this.audio) {
      const handler = this.loopListeners.get(this.audio);
      if (handler) {
        this.audio.removeEventListener("timeupdate", handler);
        this.loopListeners.delete(this.audio);
      }
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (this.nextAudio) {
      const handler = this.loopListeners.get(this.nextAudio);
      if (handler) {
        this.nextAudio.removeEventListener("timeupdate", handler);
        this.loopListeners.delete(this.nextAudio);
      }
      this.nextAudio.pause();
      this.nextAudio.currentTime = 0;
      this.nextAudio = null;
    }
  }
}
