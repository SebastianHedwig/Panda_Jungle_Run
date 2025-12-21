import {
  BOSS_MUSIC_LOOP_CUT,
  MUSIC_VOLUME,
  SFX_VOLUME,
} from "../../config/config.js";

const BOSS_GONG = "./assets/music/boss-gong.mp3";
const BOSS_MUSIC = "./assets/music/boss-music.mp3";
const BOSS_DEFEAT = "./assets/music/boss-defeat.mp3";
const BOSS_WHIMPER = [
  "./assets/sfx/boss/Boss-whimper1.mp3",
  "./assets/sfx/boss/Boss-whimper2.mp3",
];
const BOSS_HOWL_END = "./assets/sfx/boss/Boss-howl-end.mp3";
const BOSS_ATTACK2 = "./assets/sfx/boss/Boss-attack2.mp3";
const BOSS_WHOOSH = "./assets/sfx/boss/Boss-whoosh.mp3";
const BOSS_HIT = "./assets/sfx/boss/Boss-hit.mp3";

export class BossAudio {
  constructor({
    gongSrc = BOSS_GONG,
    musicSrc = BOSS_MUSIC,
    defeatSrc = BOSS_DEFEAT,
    whimperSrcs = BOSS_WHIMPER,
    howlEndSrc = BOSS_HOWL_END,
    attack2Src = BOSS_ATTACK2,
    whooshSrc = BOSS_WHOOSH,
    hitSrc = BOSS_HIT,
    volume = MUSIC_VOLUME,
    sfxVolume = SFX_VOLUME,
    gongPlayDuration = 3,
    fadeDuration = 1,
    musicLoopCut = BOSS_MUSIC_LOOP_CUT ?? 1,
    playbackRate = 1.2,
  } = {}) {
    this.gongSrc = gongSrc;
    this.musicSrc = musicSrc;
    this.defeatSrc = defeatSrc;
    this.whimperSrcs = whimperSrcs;
    this.howlEndSrc = howlEndSrc;
    this.attack2Src = attack2Src;
    this.whooshSrc = whooshSrc;
    this.hitSrc = hitSrc;
    this.volume = volume;
    this.sfxVolume = sfxVolume;
    this.gongPlayDuration = gongPlayDuration;
    this.fadeDuration = fadeDuration;
    this.musicLoopCut = musicLoopCut;
    this.playbackRate = playbackRate;

    this.gongAudio = null;
    this.musicAudio = null;
    this.defeatAudio = null;
    this.howlEndAudio = null;
    this.attack2Audio = null;
    this.whooshAudio = null;
    this.hitAudio = null;
    this.whimperCache = new Map();
    this.nextMusicAudio = null;
    this.fadeInterval = null;
    this.fadeStartTimer = null;
    this.gongStopTimer = null;
    this.isPlaying = false;
    this.defeatPlayed = false;
    this.unlockHandler = null;
    this.loopHandlers = new WeakMap();
  }

  createAudio(src, loop = false, volume = this.volume) {
    const el = new Audio(src);
    el.loop = loop;
    el.volume = volume;
    el.preload = "auto";
    el.autoplay = false;
    return el;
  }

  createSfxAudio(src) {
    return this.createAudio(src, false, this.sfxVolume);
  }

  playWhimper() {
    if (!this.whimperSrcs?.length) return;
    const idx = Math.floor(Math.random() * this.whimperSrcs.length);
    const src = this.whimperSrcs[idx];
    if (!src) return;

    let base = this.whimperCache.get(src);
    if (!base) {
      base = this.createSfxAudio(src);
      this.whimperCache.set(src, base);
    }

    let audio = base;
    if (!base.paused && !base.ended) {
      audio = base.cloneNode(true);
      audio.volume = this.sfxVolume;
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

  playAttack2() {
    if (!this.attack2Src) return;
    if (!this.attack2Audio) {
      this.attack2Audio = this.createSfxAudio(this.attack2Src);
    } else {
      this.attack2Audio.currentTime = 0;
    }
    const audio = this.attack2Audio;
    const start = () => audio.play().catch(() => {});
    if (audio.readyState >= 2) start();
    else {
      audio.addEventListener("canplaythrough", start, { once: true });
      audio.addEventListener("loadeddata", start, { once: true });
    }
    audio.load();
    this.bindUnlock();
  }

  playAttack1() {
    if (!this.whooshSrc) return;
    const base =
      this.whooshAudio || (this.whooshAudio = this.createSfxAudio(this.whooshSrc));
    let audio = base;
    if (!base.paused && !base.ended) {
      audio = base.cloneNode(true);
      audio.volume = this.sfxVolume;
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

  playHit() {
    if (!this.hitSrc) return;
    if (!this.hitAudio) {
      this.hitAudio = this.createAudio(
        this.hitSrc,
        false,
        Math.min(1, this.sfxVolume + 0.2)
      );
    } else {
      this.hitAudio.currentTime = 0;
    }
    const audio = this.hitAudio;
    const start = () => audio.play().catch(() => {});
    if (audio.readyState >= 2) start();
    else {
      audio.addEventListener("canplaythrough", start, { once: true });
      audio.addEventListener("loadeddata", start, { once: true });
    }
    audio.load();
    this.bindUnlock();
  }

  play() {
    this.stop();
    this.isPlaying = true;

    this.gongAudio = this.createAudio(this.gongSrc, false, this.volume);
    const startGong = () => this.gongAudio?.play().catch(() => {});
    this.gongAudio.addEventListener("canplaythrough", startGong, { once: true });
    this.gongAudio.addEventListener("loadeddata", startGong, { once: true });
    this.gongAudio.load();
    this.bindUnlock();

    const fadeStartMs = Math.max(
      0,
      (this.gongPlayDuration - this.fadeDuration) * 1000
    );
    this.fadeStartTimer = setTimeout(
      () => this.startFadeToMusic(),
      fadeStartMs
    );

    this.gongStopTimer = setTimeout(() => {
      if (this.gongAudio) {
        this.gongAudio.pause();
        this.gongAudio.currentTime = 0;
      }
    }, this.gongPlayDuration * 1000);
  }

  startFadeToMusic() {
    if (this.musicAudio) return;
    this.musicAudio = this.createAudio(this.musicSrc, false, 0);
    const music = this.musicAudio;
    music.playbackRate = this.playbackRate;
    const startMusic = () => music.play().catch(() => {});
    if (music.readyState >= 2) startMusic();
    else {
      music.addEventListener("canplaythrough", startMusic, { once: true });
      music.addEventListener("loadeddata", startMusic, { once: true });
    }
    this.attachMusicLoopWatcher(music);

    const durationMs = Math.max(100, this.fadeDuration * 1000);
    const stepMs = 50;
    let elapsed = 0;
    this.fadeInterval = setInterval(() => {
      elapsed += stepMs;
      const t = Math.min(elapsed / durationMs, 1);
      music.volume = this.volume * t;
      if (t >= 1 && this.fadeInterval) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
    }, stepMs);
  }

  stop() {
    this.isPlaying = false;
    if (this.fadeStartTimer) {
      clearTimeout(this.fadeStartTimer);
      this.fadeStartTimer = null;
    }
    if (this.gongStopTimer) {
      clearTimeout(this.gongStopTimer);
      this.gongStopTimer = null;
    }
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    if (this.gongAudio) {
      this.gongAudio.pause();
      this.gongAudio.currentTime = 0;
      this.gongAudio = null;
    }
    if (this.nextMusicAudio) {
      this.detachLoopWatcher(this.nextMusicAudio);
      this.nextMusicAudio.pause();
      this.nextMusicAudio.currentTime = 0;
      this.nextMusicAudio = null;
    }
    if (this.musicAudio) {
      this.detachLoopWatcher(this.musicAudio);
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
      this.musicAudio = null;
    }
    if (this.defeatAudio) {
      this.defeatAudio.pause();
      this.defeatAudio.currentTime = 0;
      this.defeatAudio = null;
    }
    if (this.attack2Audio) {
      this.attack2Audio.pause();
      this.attack2Audio.currentTime = 0;
      this.attack2Audio = null;
    }
    if (this.whooshAudio) {
      this.whooshAudio.pause();
      this.whooshAudio.currentTime = 0;
      this.whooshAudio = null;
    }
    if (this.hitAudio) {
      this.hitAudio.pause();
      this.hitAudio.currentTime = 0;
      this.hitAudio = null;
    }
    if (this.howlEndAudio) {
      this.howlEndAudio.pause();
      this.howlEndAudio.currentTime = 0;
      this.howlEndAudio = null;
    }
    this.unbindUnlock();
  }

  bindUnlock() {
    if (this.unlockHandler) return;
    this.unlockHandler = () => {
      this.gongAudio?.play().catch(() => {});
      this.musicAudio?.play().catch(() => {});
      this.defeatAudio?.play().catch(() => {});
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

  attachMusicLoopWatcher(audioEl) {
    const handler = () => {
      if (!audioEl.duration || !isFinite(audioEl.duration)) return;
      const cutoff = Math.max(0, audioEl.duration - this.musicLoopCut);
      const overlapStart = Math.max(0, cutoff - this.fadeDuration);
      if (
        !this.nextMusicAudio &&
        this.musicLoopCut > 0 &&
        audioEl.currentTime >= overlapStart
      ) {
        this.startNextMusicLoop(audioEl);
      }
      if (
        this.nextMusicAudio &&
        this.fadeInterval === null &&
        audioEl.currentTime >= cutoff
      ) {
        this.completeMusicSwitch(audioEl);
      }
    };
    audioEl.addEventListener("timeupdate", handler);
    this.loopHandlers.set(audioEl, handler);
  }

  detachLoopWatcher(audioEl) {
    const handler = this.loopHandlers.get(audioEl);
    if (handler) {
      audioEl.removeEventListener("timeupdate", handler);
      this.loopHandlers.delete(audioEl);
    }
  }

  startNextMusicLoop(current) {
    this.nextMusicAudio = this.createAudio(this.musicSrc, false, 0);
    const next = this.nextMusicAudio;
    next.playbackRate = this.playbackRate;
    const startNext = () => next.play().catch(() => {});
    if (next.readyState >= 2) startNext();
    else {
      next.addEventListener("canplaythrough", startNext, { once: true });
      next.addEventListener("loadeddata", startNext, { once: true });
    }
    this.attachMusicLoopWatcher(next);
    this.beginMusicCrossfade(current, next);
  }

  beginMusicCrossfade(current, next) {
    this.clearFadeInterval();
    const durationMs = Math.max(100, this.fadeDuration * 1000);
    const stepMs = 50;
    let elapsed = 0;
    this.fadeInterval = setInterval(() => {
      elapsed += stepMs;
      const t = Math.min(elapsed / durationMs, 1);
      if (current) current.volume = this.volume * (1 - t);
      if (next) next.volume = this.volume * t;
      if (t >= 1) {
        this.completeMusicSwitch(current);
      }
    }, stepMs);
  }

  clearFadeInterval() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  }

  clearMusicTracks() {
    if (this.nextMusicAudio) {
      this.detachLoopWatcher(this.nextMusicAudio);
      this.nextMusicAudio.pause();
      this.nextMusicAudio.currentTime = 0;
      this.nextMusicAudio = null;
    }
    if (this.musicAudio) {
      this.detachLoopWatcher(this.musicAudio);
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
      this.musicAudio = null;
    }
  }

  completeMusicSwitch(prev) {
    this.clearFadeInterval();
    if (prev) {
      this.detachLoopWatcher(prev);
      prev.pause();
      prev.currentTime = 0;
    }
    if (this.nextMusicAudio) {
      this.musicAudio = this.nextMusicAudio;
      this.nextMusicAudio = null;
      this.musicAudio.volume = this.volume;
    }
  }

  playDefeat() {
    if (this.defeatPlayed) return null;
    this.defeatPlayed = true;
    this.clearFadeInterval();

    const defeat = this.createAudio(this.defeatSrc, false, 0);
    this.defeatAudio = defeat;
    const howl = this.howlEndSrc
      ? this.createAudio(
          this.howlEndSrc,
          false,
          Math.min(1, this.sfxVolume + 0.2)
        )
      : null;
    this.howlEndAudio = howl;
    const startDefeat = () => defeat.play().catch(() => {});
    if (defeat.readyState >= 2) startDefeat();
    else {
      defeat.addEventListener("canplaythrough", startDefeat, { once: true });
      defeat.addEventListener("loadeddata", startDefeat, { once: true });
    }
    defeat.load();
    if (howl) {
      const startHowl = () => howl.play().catch(() => {});
      if (howl.readyState >= 2) startHowl();
      else {
        howl.addEventListener("canplaythrough", startHowl, { once: true });
        howl.addEventListener("loadeddata", startHowl, { once: true });
      }
      howl.load();
    }
    this.bindUnlock();

    const fadingTracks = [
      this.musicAudio,
      this.nextMusicAudio,
      this.gongAudio,
    ].filter(Boolean);

    if (!fadingTracks.length) {
      defeat.volume = this.volume;
      return defeat;
    }

    const durationMs = Math.max(100, this.fadeDuration * 1000);
    const stepMs = 50;
    let elapsed = 0;
    this.fadeInterval = setInterval(() => {
      elapsed += stepMs;
      const t = Math.min(elapsed / durationMs, 1);
      const inv = 1 - t;
      for (const track of fadingTracks) {
        track.volume = this.volume * inv;
      }
      defeat.volume = this.volume * t;
      if (t >= 1) {
        this.clearFadeInterval();
        fadingTracks.forEach((track) => {
          track.pause();
          track.currentTime = 0;
        });
        this.clearMusicTracks();
        if (this.gongAudio && !fadingTracks.includes(this.gongAudio)) {
          this.gongAudio.pause();
          this.gongAudio.currentTime = 0;
        }
        this.gongAudio = null;
      }
    }, stepMs);

    return defeat;
  }
}
