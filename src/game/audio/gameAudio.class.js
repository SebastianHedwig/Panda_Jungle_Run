import { MUSIC_LOOP_CUT, MUSIC_VOLUME } from "../../config/config.js";

export class GameAudio {
  constructor(src = "./assets/music/wildlife-jungle-background-game-music.mp3") {
    this.src = src;
    this.audio = null;
    this.ready = false;
    this.readyPromise = null;
    this.loopCut = MUSIC_LOOP_CUT ?? 0;
    this.volume = MUSIC_VOLUME ?? 0.35;
  }

  init() {
    if (this.readyPromise) return this.readyPromise;
    this.audio = new Audio(this.src);
    this.audio.loop = true;
    this.audio.volume = this.volume;
    this.audio.preload = "auto";
    this.audio.autoplay = true;

    this.readyPromise = new Promise((resolve) => {
      const finish = () => {
        if (this.ready) return;
        this.ready = true;
        resolve(true);
      };

      this.audio.addEventListener(
        "loadedmetadata",
        () => {
          const cutoff = Math.max(0, (this.audio.duration || 0) - this.loopCut);
          this.audio.addEventListener("timeupdate", () => {
            if (this.audio.currentTime >= cutoff) {
              this.audio.currentTime = 0;
              if (!this.audio.paused) this.audio.play().catch(() => {});
            }
          });
        },
        { once: true }
      );

      this.audio.addEventListener("canplaythrough", finish, { once: true });
      this.audio.addEventListener("loadeddata", finish, { once: true });
      this.audio.addEventListener("error", () => resolve(false), { once: true });

      this.audio.load();

      setTimeout(() => resolve(false), 4000);
    });

    return this.readyPromise;
  }

  play() {
    if (!this.audio) return Promise.resolve(false);
    return this.audio
      .play()
      .then(() => true)
      .catch(() => false);
  }
}
