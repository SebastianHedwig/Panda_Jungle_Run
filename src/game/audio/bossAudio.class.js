import { BOSS_MUSIC_LOOP_CUT, BOSS_MUSIC_PLAYBACK_RATE, MUSIC_VOLUME, SFX_VOLUME } from "../../config/config.js";
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

function getRandomSource(sourceList) {
  if (!sourceList?.length) return null;
  const randomIndex = Math.floor(Math.random() * sourceList.length);
  return sourceList[randomIndex] ?? null;
}

function buildBossAudioSources({
  gongSrc = BOSS_GONG,
  musicSrc = BOSS_MUSIC,
  defeatSrc = BOSS_DEFEAT,
  whimperSrcs = BOSS_WHIMPER,
  howlEndSrc = BOSS_HOWL_END,
  attack2Src = BOSS_ATTACK2,
  whooshSrc = BOSS_WHOOSH,
  hitSrc = BOSS_HIT,
} = {}) {
  return { gongSrc, musicSrc, defeatSrc, whimperSrcs, howlEndSrc, attack2Src, whooshSrc, hitSrc };
}

function buildBossAudioVolumes({ volume = MUSIC_VOLUME, sfxVolume = SFX_VOLUME } = {}) {
  return { volume, sfxVolume, hitBoostVolume: 0.2, maxVolumeCap: 1 };
}

function buildBossAudioTiming({
  musicLoopCut = BOSS_MUSIC_LOOP_CUT,
  playbackRate = BOSS_MUSIC_PLAYBACK_RATE,
  gongPlayDuration = 3,
  fadeDuration = 1,
} = {}) {
  return { gongPlayDuration, fadeDuration, minFadeDurationMs: 100, loudnessStepMs: 50, musicLoopCut, playbackRate };
}

function buildBossAudioConfig(options = {}) {
  return {
    ...buildBossAudioSources(options),
    ...buildBossAudioVolumes(options),
    ...buildBossAudioTiming(options),
  };
}

function buildBossAudioReferenceState() {
  return {
    gongAudio: null,
    musicAudio: null,
    defeatAudio: null,
    howlEndAudio: null,
    attack2Audio: null,
    whooshAudio: null,
    hitAudio: null,
    nextMusicAudio: null,
  };
}

function buildBossAudioRuntimeState() {
  return {
    whimperCache: new Map(),
    fadeInterval: null,
    fadeStartTimer: null,
    gongStopTimer: null,
    isPlaying: false,
    defeatPlayed: false,
    unlockHandler: null,
    loopHandlers: new WeakMap(),
  };
}

function buildBossAudioState() {
  return {
    ...buildBossAudioReferenceState(),
    ...buildBossAudioRuntimeState(),
  };
}

function stopAndResetAudio(audioElement) {
  if (!audioElement) return null;
  audioElement.pause();
  audioElement.currentTime = 0;
  return null;
}

function clearTimeoutIfNeeded(timerId) {
  if (timerId) clearTimeout(timerId);
  return null;
}

export class BossAudio {
  constructor(options = {}) {
    Object.assign(this, buildBossAudioConfig(options));
    Object.assign(this, buildBossAudioState());
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
    const src = getRandomSource(this.whimperSrcs);
    if (!src) return;
    const cachedWhimperAudio = this.getCachedWhimperAudio(src);
    const audio = cloneOrRestart(cachedWhimperAudio, { volume: this.sfxVolume });
    playWhenReady(audio);
    this.bindUnlock();
  }

  getCachedWhimperAudio(src) {
    let cachedWhimperAudio = this.whimperCache.get(src);
    if (!cachedWhimperAudio) {
      cachedWhimperAudio = this.createSfxAudio(src);
      this.whimperCache.set(src, cachedWhimperAudio);
    }
    return cachedWhimperAudio;
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
    const vol = this.getHitVolume();
    const hitAudio = this.ensureHitAudio(vol);
    const audio = cloneOrRestart(hitAudio, { volume: vol });
    playWhenReady(audio);
    this.bindUnlock();
  }

  getHitVolume() {
    return Math.min(this.maxVolumeCap, this.sfxVolume + this.hitBoostVolume);
  }

  ensureHitAudio(vol) {
    if (!this.hitAudio) {
      this.hitAudio = this.createAudio(this.hitSrc, false, vol);
    } else {
      this.hitAudio.currentTime = 0;
    }
    return this.hitAudio;
  }

  play() {
    this.stopAndCleanupBossAudio();
    this.isPlaying = true;
    this.startGong();
    this.scheduleFadeToMusic();
    this.scheduleGongStop();
  }

  startGong() {
    this.gongAudio = this.createAudio(this.gongSrc, false, this.volume);
    playWhenReady(this.gongAudio);
    this.bindUnlock();
  }

  scheduleFadeToMusic() {
    const fadeStartMs = this.getFadeStartMs();
    this.fadeStartTimer = setTimeout(() => this.startFadeToMusic(), fadeStartMs);
  }

  getFadeStartMs() {
    return Math.max(0, (this.gongPlayDuration - this.fadeDuration) * msPerSecond);
  }

  scheduleGongStop() {
    this.gongStopTimer = setTimeout(
      () => this.stopGongAudio(),
      this.gongPlayDuration * msPerSecond
    );
  }

  stopGongAudio() {
    if (!this.gongAudio) return;
    this.gongAudio.pause();
    this.gongAudio.currentTime = 0;
  }

  startFadeToMusic() {
    if (this.musicAudio) return;
    const music = this.createAndStartMusicAudio();
    this.beginMusicFadeIn(music);
  }

  createAndStartMusicAudio() {
    this.musicAudio = this.createMusicAudio(0);
    const music = this.musicAudio;
    this.attachMusicLoopWatcher(music);
    playWhenReady(music, {
      beforePlay: () => {
        music.playbackRate = this.playbackRate;
      },
    });
    return music;
  }

  beginMusicFadeIn(music) {
    const durationMs = this.getFadeDurationMs();
    const loudnessStepMs = this.loudnessStepMs;
    let elapsedMs = 0;
    this.fadeInterval = setInterval(() => {
      elapsedMs += loudnessStepMs;
      const fadeProgress = Math.min(elapsedMs / durationMs, 1);
      music.volume = this.volume * fadeProgress;
      if (fadeProgress >= 1) this.clearFadeInterval();
    }, loudnessStepMs);
  }

  getFadeDurationMs() {
    return Math.max(this.minFadeDurationMs, this.fadeDuration * msPerSecond);
  }

  stopAndCleanupBossAudio() {
    this.isPlaying = false;
    this.clearBossTimers();
    this.stopGongAudioAndClear();
    this.stopNextMusicAudio();
    this.stopMusicAudio();
    this.stopDefeatAudio();
    this.stopAttack2Audio();
    this.stopWhooshAudio();
    this.stopHitAudio();
    this.stopHowlEndAudio();
    this.unbindUnlock();
  }

  clearBossTimers() {
    this.fadeStartTimer = clearTimeoutIfNeeded(this.fadeStartTimer);
    this.gongStopTimer = clearTimeoutIfNeeded(this.gongStopTimer);
    this.clearFadeInterval();
  }

  stopGongAudioAndClear() {
    this.gongAudio = stopAndResetAudio(this.gongAudio);
  }

  stopNextMusicAudio() {
    this.nextMusicAudio = this.stopLoopedAudioInstance(this.nextMusicAudio);
  }

  stopMusicAudio() {
    this.musicAudio = this.stopLoopedAudioInstance(this.musicAudio);
  }

  stopDefeatAudio() {
    this.defeatAudio = stopAndResetAudio(this.defeatAudio);
  }

  stopAttack2Audio() {
    this.attack2Audio = stopAndResetAudio(this.attack2Audio);
  }

  stopWhooshAudio() {
    this.whooshAudio = stopAndResetAudio(this.whooshAudio);
  }

  stopHitAudio() {
    this.hitAudio = stopAndResetAudio(this.hitAudio);
  }

  stopHowlEndAudio() {
    this.howlEndAudio = stopAndResetAudio(this.howlEndAudio);
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
    const handler = () => this.handleMusicLoopTimeUpdate(audioElement);
    audioElement.addEventListener("timeupdate", handler);
    this.loopHandlers.set(audioElement, handler);
  }

  handleMusicLoopTimeUpdate(audioElement) {
    if (!audioElement.duration || !isFinite(audioElement.duration)) return;
    const cutoff = this.getMusicLoopCutoff(audioElement.duration);
    const overlapStart = this.getMusicOverlapStart(cutoff);
    this.tryStartNextLoop(audioElement, overlapStart);
    this.tryCompleteLoop(audioElement, cutoff);
  }

  getMusicLoopCutoff(duration) {
    return Math.max(0, duration - this.musicLoopCut);
  }

  getMusicOverlapStart(cutoff) {
    return Math.max(0, cutoff - this.fadeDuration);
  }

  tryStartNextLoop(audioElement, overlapStart) {
    if (this.shouldStartNextLoop(audioElement, overlapStart)) {
      this.startNextMusicLoop(audioElement);
    }
  }

  shouldStartNextLoop(audioElement, overlapStart) {
    return (
      !this.nextMusicAudio &&
      this.musicLoopCut > 0 &&
      audioElement.currentTime >= overlapStart
    );
  }

  tryCompleteLoop(audioElement, cutoff) {
    if (this.shouldCompleteLoop(audioElement, cutoff)) {
      this.completeMusicSwitch(audioElement);
    }
  }

  shouldCompleteLoop(audioElement, cutoff) {
    return (
      this.nextMusicAudio &&
      this.fadeInterval === null &&
      audioElement.currentTime >= cutoff
    );
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
    const durationMs = this.getFadeDurationMs();
    const loudnessStepMs = this.loudnessStepMs;
    let elapsedMs = 0;
    this.fadeInterval = setInterval(() => {
      elapsedMs += loudnessStepMs;
      const fadeProgress = Math.min(elapsedMs / durationMs, 1); // 0..1 volume blend
      this.applyCrossfadeVolumes(current, next, fadeProgress);
      if (fadeProgress >= 1) this.completeMusicSwitch(current);
    }, loudnessStepMs);
  }

  applyCrossfadeVolumes(current, next, fadeProgress) {
    if (current) current.volume = this.volume * (1 - fadeProgress);
    if (next) next.volume = this.volume * fadeProgress;
  }

  clearFadeInterval() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  }

  clearMusicTracks() {
    this.stopNextMusicAudio();
    this.stopMusicAudio();
  }

  completeMusicSwitch(prev) {
    this.clearFadeInterval();
    this.stopPreviousMusicAudio(prev);
    this.swapToNextMusicAudio();
  }

  stopLoopedAudioInstance(audioElement) {
    if (!audioElement) return null;
    this.detachLoopWatcher(audioElement);
    audioElement.pause();
    audioElement.currentTime = 0;
    return null;
  }

  stopPreviousMusicAudio(prev) {
    if (!prev) return;
    this.detachLoopWatcher(prev);
    prev.pause();
    prev.currentTime = 0;
  }

  swapToNextMusicAudio() {
    if (!this.nextMusicAudio) return;
    this.musicAudio = this.nextMusicAudio;
    this.nextMusicAudio = null;
    this.musicAudio.volume = this.volume;
  }

  playDefeat() {
    if (this.defeatPlayed) return null;
    this.defeatPlayed = true; this.clearFadeInterval();
    const defeat = this.createDefeatAudio(); const howl = this.createHowlEndAudio();
    this.playDefeatAudio(defeat, howl); this.bindUnlock();
    const fadingTracks = this.getFadingTracks();
    if (!fadingTracks.length) return this.finishDefeatWithoutFade(defeat);
    this.startDefeatFade(defeat, fadingTracks);
    return defeat;
  }

  finishDefeatWithoutFade(defeat) {
    defeat.volume = this.volume;
    return defeat;
  }

  createDefeatAudio() {
    const defeat = this.createAudio(this.defeatSrc, false, 0);
    this.defeatAudio = defeat;
    return defeat;
  }

  createHowlEndAudio() {
    const howl = this.howlEndSrc
      ? this.createAudio(this.howlEndSrc, false, this.getHitVolume())
      : null;
    this.howlEndAudio = howl;
    return howl;
  }

  playDefeatAudio(defeat, howl) {
    playWhenReady(defeat);
    if (howl) playWhenReady(howl);
  }

  getFadingTracks() {
    return [this.musicAudio, this.nextMusicAudio, this.gongAudio].filter(Boolean);
  }

  startDefeatFade(defeat, fadingTracks) {
    const durationMs = this.getFadeDurationMs();
    const loudnessStepMs = this.loudnessStepMs;
    let elapsedMs = 0;
    this.fadeInterval = setInterval(() => {
      elapsedMs += loudnessStepMs;
      const fadeProgress = Math.min(elapsedMs / durationMs, 1); // 0..1 volume blend
      this.applyDefeatFadeVolumes(defeat, fadingTracks, fadeProgress);
      if (fadeProgress >= 1) this.finishDefeatFade(fadingTracks);
    }, loudnessStepMs);
  }

  applyDefeatFadeVolumes(defeat, fadingTracks, fadeProgress) {
    const invertFadeProgress = 1 - fadeProgress; // 1..0 volume blend
    for (const track of fadingTracks) {
      track.volume = this.volume * invertFadeProgress;
    }
    defeat.volume = this.volume * fadeProgress;
  }

  finishDefeatFade(fadingTracks) {
    this.clearFadeInterval();
    fadingTracks.forEach((track) => {
      track.pause();
      track.currentTime = 0;
    });
    this.clearMusicTracks();
    this.clearGongAfterDefeat(fadingTracks);
  }

  clearGongAfterDefeat(fadingTracks) {
    if (this.gongAudio && !fadingTracks.includes(this.gongAudio)) {
      this.gongAudio.pause();
      this.gongAudio.currentTime = 0;
    }
    this.gongAudio = null;
  }
}
