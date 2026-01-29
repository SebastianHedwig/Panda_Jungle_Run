import {
  BOSS_MUSIC_LOOP_CUT,
  BOSS_MUSIC_PLAYBACK_RATE,
  MUSIC_VOLUME,
  SFX_VOLUME,
} from "../../config/config.js";
import { cloneOrRestart, createAudioElement, playWhenReady } from "./audioUtils.js";

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
const msPerSecond = 1000;

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
    musicLoopCut = BOSS_MUSIC_LOOP_CUT,
    playbackRate = BOSS_MUSIC_PLAYBACK_RATE,
    gongPlayDuration = 3,
    fadeDuration = 1,
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
    this.hitBoostVolume = 0.2;
    this.gongPlayDuration = gongPlayDuration;
    this.fadeDuration = fadeDuration;
    this.minFadeDurationMs = 100;
    this.loudnessStepMs = 50;
    this.musicLoopCut = musicLoopCut;
    this.playbackRate = playbackRate;
    this.maxVolumeCap = 1;

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
    return createAudioElement(src, { loop, volume });
  }

  createSfxAudio(src) {
    return this.createAudio(src, false, this.sfxVolume);
  }

  createMusicAudio(volume = 0) {
    return createAudioElement(this.musicSrc, {
      volume,
      playbackRate: this.playbackRate,
    });
  }

  playWhimper() {
    if (!this.whimperSrcs?.length) return;
    const randomWhimperIndex = Math.floor(Math.random() * this.whimperSrcs.length);
    const src = this.whimperSrcs[randomWhimperIndex];
    if (!src) return;

    let cachedWhimperAudio = this.whimperCache.get(src);
    if (!cachedWhimperAudio) {
      cachedWhimperAudio = this.createSfxAudio(src);
      this.whimperCache.set(src, cachedWhimperAudio);
    }

    const audio = cloneOrRestart(cachedWhimperAudio, { volume: this.sfxVolume });
    playWhenReady(audio);
    this.bindUnlock();
  }

  playAttack2() {
    if (!this.attack2Src) return;
    if (!this.attack2Audio) this.attack2Audio = this.createSfxAudio(this.attack2Src);
    const audio = cloneOrRestart(this.attack2Audio, { volume: this.sfxVolume });
    playWhenReady(audio);
    this.bindUnlock();
  }

  playAttack1() {
    if (!this.whooshSrc) return;
    const base =
      this.whooshAudio || (this.whooshAudio = this.createSfxAudio(this.whooshSrc));
    const audio = cloneOrRestart(base, { volume: this.sfxVolume });
    playWhenReady(audio);
    this.bindUnlock();
  }

  playHit() {
    if (!this.hitSrc) return;
    if (!this.hitAudio) {
      this.hitAudio = this.createAudio(
        this.hitSrc,
        false,
        Math.min(this.maxVolumeCap, this.sfxVolume + this.hitBoostVolume)
      );
    } else {
      this.hitAudio.currentTime = 0;
    }
    const vol = Math.min(this.maxVolumeCap, this.sfxVolume + this.hitBoostVolume);
    const audio = cloneOrRestart(this.hitAudio, { volume: vol });
    playWhenReady(audio);
    this.bindUnlock();
  }

  play() {
    this.stopAndCleanupBossAudio();
    this.isPlaying = true;

    this.gongAudio = this.createAudio(this.gongSrc, false, this.volume);
    playWhenReady(this.gongAudio);
    this.bindUnlock();

    const fadeStartMs = Math.max(0, (this.gongPlayDuration - this.fadeDuration) * msPerSecond);
    this.fadeStartTimer = setTimeout(
      () => this.startFadeToMusic(),
      fadeStartMs
    );

    this.gongStopTimer = setTimeout(() => {
      if (this.gongAudio) {
        this.gongAudio.pause();
        this.gongAudio.currentTime = 0;
      }
    }, this.gongPlayDuration * msPerSecond);
  }

  startFadeToMusic() {
    if (this.musicAudio) return;
    this.musicAudio = this.createMusicAudio(0);
    const music = this.musicAudio;
    this.attachMusicLoopWatcher(music);
    playWhenReady(music, {
      beforePlay: () => {
        music.playbackRate = this.playbackRate;
      },
    });

    const durationMs = Math.max(this.minFadeDurationMs, this.fadeDuration * msPerSecond);
    const loudnessStepMs = this.loudnessStepMs;
    let elapsedMs = 0;
    this.fadeInterval = setInterval(() => {
      elapsedMs += loudnessStepMs;
      const fadeProgress = Math.min(elapsedMs / durationMs, 1);
      music.volume = this.volume * fadeProgress;
      if (fadeProgress >= 1 && this.fadeInterval) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
    }, loudnessStepMs);
  }

  stopAndCleanupBossAudio() {
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
      this.gongAudio?.play();
      this.musicAudio?.play();
      this.defeatAudio?.play();
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

  attachMusicLoopWatcher(audioElement) {
    const handler = () => {
      if (!audioElement.duration || !isFinite(audioElement.duration)) return;
      const cutoff = Math.max(0, audioElement.duration - this.musicLoopCut);
      const overlapStart = Math.max(0, cutoff - this.fadeDuration);
      if (
        !this.nextMusicAudio &&
        this.musicLoopCut > 0 &&
        audioElement.currentTime >= overlapStart
      ) {
        this.startNextMusicLoop(audioElement);
      }
      if (
        this.nextMusicAudio &&
        this.fadeInterval === null &&
        audioElement.currentTime >= cutoff
      ) {
        this.completeMusicSwitch(audioElement);
      }
    };
    audioElement.addEventListener("timeupdate", handler);
    this.loopHandlers.set(audioElement, handler);
  }

  detachLoopWatcher(audioElement) {
    const handler = this.loopHandlers.get(audioElement);
    if (handler) {
      audioElement.removeEventListener("timeupdate", handler);
      this.loopHandlers.delete(audioElement);
    }
  }

  startNextMusicLoop(current) {
    this.nextMusicAudio = this.createMusicAudio(0);
    const next = this.nextMusicAudio;
    this.attachMusicLoopWatcher(next);
    this.beginMusicCrossfade(current, next);
    playWhenReady(next, {
      beforePlay: () => {
        next.playbackRate = this.playbackRate;
      },
    });
  }

  beginMusicCrossfade(current, next) {
    this.clearFadeInterval();
    const durationMs = Math.max(this.minFadeDurationMs, this.fadeDuration * msPerSecond);
    const loudnessStepMs = this.loudnessStepMs;
    let elapsedMs = 0;
    this.fadeInterval = setInterval(() => {
      elapsedMs += loudnessStepMs;
      const fadeProgress = Math.min(elapsedMs / durationMs, 1); // 0..1 volume blend
      if (current) current.volume = this.volume * (1 - fadeProgress);
      if (next) next.volume = this.volume * fadeProgress;
      if (fadeProgress >= 1) {
        this.completeMusicSwitch(current);
      }
    }, loudnessStepMs);
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
      ? this.createAudio(this.howlEndSrc, false, Math.min(this.maxVolumeCap, this.sfxVolume + this.hitBoostVolume))
      : null;
    this.howlEndAudio = howl;
    playWhenReady(defeat);
    if (howl) {
      playWhenReady(howl);
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

    const durationMs = Math.max(this.minFadeDurationMs, this.fadeDuration * msPerSecond);
    const loudnessStepMs = this.loudnessStepMs;
    let elapsedMs = 0;
    this.fadeInterval = setInterval(() => {
      elapsedMs += loudnessStepMs;
      const fadeProgress = Math.min(elapsedMs / durationMs, 1); // 0..1 volume blend
      const invertFadeProgress = 1 - fadeProgress; // 1..0 volume blend
      for (const track of fadingTracks) {
        track.volume = this.volume * invertFadeProgress;
      }
      defeat.volume = this.volume * fadeProgress;
      if (fadeProgress >= 1) {
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
    }, loudnessStepMs);

    return defeat;
  }
}
