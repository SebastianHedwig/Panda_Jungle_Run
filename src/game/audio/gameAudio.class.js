import { MUSIC_LOOP_CUT, MUSIC_VOLUME } from "../../config/config.js";
import { playWhenReady } from "./audioUtils.js";

const msPerSecond = 1000;

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
    this.minCutoff = 0.01;
    this.loadTimeoutMs = 3000;
    this.minCrossfadeMs = 100; // avoid abrupt volume transitions
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
    this.readyPromise = this.createReadyPromise();

    return this.readyPromise;
  }

  createReadyPromise() {
    return new Promise((resolve) => {
      const finish = () => this.finishReady(resolve);
      this.attachInitListeners(resolve, finish);
      this.audio.load();
      this.bindPlaybackUnlock();
      setTimeout(() => resolve(false), this.loadTimeoutMs);
    });
  }

  finishReady(resolve) {
    if (this.ready) return;
    this.ready = true;
    resolve(true);
  }

  attachInitListeners(resolve, finish) {
    this.audio.addEventListener("loadedmetadata", () => this.handleLoadedMetadata(), { once: true });
    this.audio.addEventListener("canplaythrough", finish, { once: true });
    this.audio.addEventListener("loadeddata", finish, { once: true });
    this.audio.addEventListener("error", () => resolve(false), { once: true });
  }

  handleLoadedMetadata() {
    const duration = this.audio.duration || 0;
    this.cutoff = Math.max(this.minCutoff, duration - this.loopCut);
    this.overlapStart = Math.max(0, this.cutoff - this.overlapDuration);
    this.attachLoopWatcher(this.audio);
  }

  attachLoopWatcher(audioElement) {
    const onTimeUpdate = () => this.handleTimeUpdate(audioElement);
    audioElement.addEventListener("timeupdate", onTimeUpdate);
    this.loopListeners.set(audioElement, onTimeUpdate);
  }

  handleTimeUpdate(audioElement) {
    if (audioElement !== this.audio) return;
    if (this.shouldPrepareNextLoop(audioElement)) this.audioLoopPreparation();
    if (this.shouldCompleteLoop(audioElement)) this.completeLoop();
  }

  shouldPrepareNextLoop(audioElement) {
    return !this.nextAudio && this.cutoff > 0 && audioElement.currentTime >= this.overlapStart;
  }

  shouldCompleteLoop(audioElement) {
    return this.cutoff > 0 && audioElement.currentTime >= this.cutoff;
  }

  audioLoopPreparation() {
    if (this.nextAudio || !this.audio) return;

    this.nextAudio = this.createAudioElement();
    const next = this.nextAudio;
    next.volume = 0;
    this.attachLoopWatcher(next);

    playWhenReady(next);
    this.beginCrossfade(this.audio, next);
  }

  beginCrossfade(current, next) {
    this.clearCrossfade();
    const { durationMs, loudnessStepMs } = this.getCrossfadeTiming();
    let elapsed = 0;

    this.crossfadeTimer = setInterval(() => {
      elapsed += loudnessStepMs;
      const fadeProgress = Math.min(elapsed / durationMs, 1); // 0..1 volume blend
      this.updateCrossfadeVolumes(current, next, fadeProgress);
      if (fadeProgress >= 1) this.clearCrossfade();
    }, loudnessStepMs);
  }

  getCrossfadeTiming() {
    return { durationMs: Math.max(this.minCrossfadeMs, this.overlapDuration * msPerSecond), loudnessStepMs: 50 };
  }

  updateCrossfadeVolumes(current, next, fadeProgress) {
    if (current) current.volume = this.volume * (1 - fadeProgress);
    if (next) next.volume = this.volume * fadeProgress;
  }

  clearCrossfade() {
    if (this.crossfadeTimer) {
      clearInterval(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
  }

  completeLoop() {
    this.clearCrossfade();
    const outgoingAudio = this.audio;
    this.detachLoopListener(outgoingAudio);
    this.swapToNextAudio();
    this.resetOutgoingAudio(outgoingAudio);
    this.resumeAudioIfNeeded();
  }

  detachLoopListener(audioElement) {
    if (!audioElement) return;
    const handler = this.loopListeners.get(audioElement);
    if (handler) {
      audioElement.removeEventListener("timeupdate", handler);
      this.loopListeners.delete(audioElement);
    }
  }

  swapToNextAudio() {
    if (this.nextAudio) {
      this.audio = this.nextAudio;
      this.nextAudio = null;
      return;
    }
    if (this.audio) this.audio.currentTime = 0;
  }

  resetOutgoingAudio(outgoingAudio) {
    if (outgoingAudio && outgoingAudio !== this.audio) {
      outgoingAudio.pause();
      outgoingAudio.currentTime = 0;
    }
  }

  resumeAudioIfNeeded() {
    if (!this.audio) return;
    this.audio.volume = this.volume;
    if (this.audio.paused) this.audio.play();
  }

  async playAudio() {
    if (!this.audio) return false;
    await this.audio.play();
    return true;
  }

  ensureVolume() {
    if (this.crossfadeTimer) return;
    if (this.audio && this.audio.volume !== this.volume) {
      this.audio.volume = this.volume;
    }
    if (this.nextAudio && this.nextAudio.volume !== this.volume) {
      this.nextAudio.volume = this.volume;
    }
  }

  bindPlaybackUnlock() {
    if (this.unlockHandler) return;
    this.unlockHandler = () => {
      this.playAudio().finally(() => {
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

  stopCrossfadeAndCleanup() {
    this.clearCrossfade();
    this.stopAndResetAudioElement(this.audio);
    this.stopAndResetAudioElement(this.nextAudio);
    this.nextAudio = null;
  }

  stopAndResetAudioElement(audioElement) {
    if (!audioElement) return;
    this.detachLoopListener(audioElement);
    audioElement.pause();
    audioElement.currentTime = 0;
  }
}
