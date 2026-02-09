import { MUSIC_LOOP_CUT, MUSIC_VOLUME } from "../../config/config.js";
import { playWhenReady } from "./audioUtils.js";

const msPerSecond = 1000;

export class GameAudio {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Used to set up required data for audio playback.
   * Performs hitbox or collision checks.
   * @param {string} [src] Source URL.
   */
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

  /**
   * Creates audio element.
   * Used to set up required data for audio playback.
   * Triggers audio playback or updates audio state.
   * @returns {*} Audio element.
   */
  createAudioElement() {
    const element = new Audio(this.src);
    element.loop = false;
    element.volume = this.volume;
    element.preload = "auto";
    element.autoplay = true;
    return element;
  }

  /**
   * Initializes.
   * Used to set default state before use for audio playback.
   * @returns {*} Result value.
   */
  init() {
    if (this.readyPromise) return this.readyPromise;
    this.audio = this.createAudioElement();
    this.readyPromise = this.createReadyPromise();

    return this.readyPromise;
  }

  /**
   * Creates ready promise.
   * Used to set up required data for audio playback.
   * Schedules timed actions.
   * @returns {*} Ready promise.
   */
  createReadyPromise() {
    return new Promise((resolve) => {
      /**
       * Finish.
       * Used to support audio playback.
       * @returns {*} Result value.
       */
      const finish = () => this.finishReady(resolve);
      this.attachInitListeners(resolve, finish);
      this.audio.load();
      this.bindPlaybackUnlock();
      setTimeout(() => resolve(false), this.loadTimeoutMs);
    });
  }

  /**
   * Finish ready.
   * Used to support audio playback.
   * @param {Function} resolve Resolve.
   */
  finishReady(resolve) {
    if (this.ready) return;
    this.ready = true;
    resolve(true);
  }

  /**
   * Attaches init listeners.
   * Used to support audio playback.
   * Binds canplaythrough, error, loadeddata, loadedmetadata event listeners.
   * @param {Function} resolve Resolve.
   * @param {*} finish Finish.
   */
  attachInitListeners(resolve, finish) {
    this.audio.addEventListener("loadedmetadata", () => this.handleLoadedMetadata(), { once: true });
    this.audio.addEventListener("canplaythrough", finish, { once: true });
    this.audio.addEventListener("loadeddata", finish, { once: true });
    this.audio.addEventListener("error", () => resolve(false), { once: true });
  }

  /**
   * Handles loaded metadata.
   * Performs hitbox or collision checks.
   */
  handleLoadedMetadata() {
    const duration = this.audio.duration || 0;
    this.cutoff = Math.max(this.minCutoff, duration - this.loopCut);
    this.overlapStart = Math.max(0, this.cutoff - this.overlapDuration);
    this.attachLoopWatcher(this.audio);
  }

  /**
   * Attaches loop watcher.
   * Used to support audio playback.
   * Binds timeupdate event listeners.
   * @param {HTMLElement} audioElement Audio element.
   */
  attachLoopWatcher(audioElement) {
    /**
     * On time update.
     * Used to support audio playback.
     * @returns {*} Result value.
     */
    const onTimeUpdate = () => this.handleTimeUpdate(audioElement);
    audioElement.addEventListener("timeupdate", onTimeUpdate);
    this.loopListeners.set(audioElement, onTimeUpdate);
  }

  /**
   * Handles time update.
   * Used to centralize a specific behavior for audio playback.
   * @param {HTMLElement} audioElement Audio element.
   */
  handleTimeUpdate(audioElement) {
    if (audioElement !== this.audio) return;
    if (this.shouldPrepareNextLoop(audioElement)) this.audioLoopPreparation();
    if (this.shouldCompleteLoop(audioElement)) this.completeLoop();
  }

  /**
   * Should prepare next loop.
   * Used to decide control flow.
   * Performs hitbox or collision checks.
   * @param {HTMLElement} audioElement Audio element.
   * @returns {boolean} Whether prepare next loop.
   */
  shouldPrepareNextLoop(audioElement) {
    return !this.nextAudio && this.cutoff > 0 && audioElement.currentTime >= this.overlapStart;
  }

  /**
   * Should complete loop.
   * Used to decide control flow.
   * @param {HTMLElement} audioElement Audio element.
   * @returns {boolean} Whether complete loop.
   */
  shouldCompleteLoop(audioElement) {
    return this.cutoff > 0 && audioElement.currentTime >= this.cutoff;
  }

  /**
   * Audio loop preparation.
   */
  audioLoopPreparation() {
    if (this.nextAudio || !this.audio) return;

    this.nextAudio = this.createAudioElement();
    const next = this.nextAudio;
    next.volume = 0;
    this.attachLoopWatcher(next);

    playWhenReady(next);
    this.beginCrossfade(this.audio, next);
  }

  /**
   * Begin crossfade.
   * Used to support audio playback.
   * Schedules timed actions.
   * @param {*} current Current.
   * @param {*} next Next.
   */
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

  /**
   * Returns crossfade timing.
   * Used to provide crossfade timing for audio playback.
   * Performs hitbox or collision checks.
   * @returns {Object} Crossfade timing.
   */
  getCrossfadeTiming() {
    return { durationMs: Math.max(this.minCrossfadeMs, this.overlapDuration * msPerSecond), loudnessStepMs: 50 };
  }

  /**
   * Updates crossfade volumes.
   * Used to advance state during the update loop for audio playback.
   * @param {*} current Current.
   * @param {*} next Next.
   * @param {number} fadeProgress Fade progress.
   */
  updateCrossfadeVolumes(current, next, fadeProgress) {
    if (current) current.volume = this.volume * (1 - fadeProgress);
    if (next) next.volume = this.volume * fadeProgress;
  }

  /**
   * Clears crossfade.
   * Clears pending timers.
   */
  clearCrossfade() {
    if (this.crossfadeTimer) {
      clearInterval(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
  }

  /**
   * Complete loop.
   */
  completeLoop() {
    this.clearCrossfade();
    const outgoingAudio = this.audio;
    this.detachLoopListener(outgoingAudio);
    this.swapToNextAudio();
    this.resetOutgoingAudio(outgoingAudio);
    this.resumeAudioIfNeeded();
  }

  /**
   * Detach loop listener.
   * Used to support audio playback.
   * @param {HTMLElement} audioElement Audio element.
   */
  detachLoopListener(audioElement) {
    if (!audioElement) return;
    const handler = this.loopListeners.get(audioElement);
    if (handler) {
      audioElement.removeEventListener("timeupdate", handler);
      this.loopListeners.delete(audioElement);
    }
  }

  /**
   * Swap to next audio.
   */
  swapToNextAudio() {
    if (this.nextAudio) {
      this.audio = this.nextAudio;
      this.nextAudio = null;
      return;
    }
    if (this.audio) this.audio.currentTime = 0;
  }

  /**
   * Resets outgoing audio.
   * Used to support audio playback.
   * Triggers audio playback or updates audio state.
   * @param {*} outgoingAudio Outgoing audio.
   */
  resetOutgoingAudio(outgoingAudio) {
    if (outgoingAudio && outgoingAudio !== this.audio) {
      outgoingAudio.pause();
      outgoingAudio.currentTime = 0;
    }
  }

  /**
   * Resumes audio if needed.
   * Triggers audio playback or updates audio state.
   */
  resumeAudioIfNeeded() {
    if (!this.audio) return;
    this.audio.volume = this.volume;
    if (this.audio.paused) this.audio.play();
  }

  /**
   * Plays audio.
   * Used to support audio playback.
   * Triggers audio playback or updates audio state.
   * @returns {*} Result value.
   */
  async playAudio() {
    if (!this.audio) return false;
    await this.audio.play();
    return true;
  }

  /**
   * Ensure volume.
   */
  ensureVolume() {
    if (this.crossfadeTimer) return;
    if (this.audio && this.audio.volume !== this.volume) {
      this.audio.volume = this.volume;
    }
    if (this.nextAudio && this.nextAudio.volume !== this.volume) {
      this.nextAudio.volume = this.volume;
    }
  }

  /**
   * Binds playback unlock.
   * Binds keydown, pointerdown, touchstart event listeners.
   */
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

  /**
   * Stops crossfade and cleanup.
   */
  stopCrossfadeAndCleanup() {
    this.clearCrossfade();
    this.stopAndResetAudioElement(this.audio);
    this.stopAndResetAudioElement(this.nextAudio);
    this.nextAudio = null;
  }

  /**
   * Stops and reset audio element.
   * Used to support audio playback.
   * Triggers audio playback or updates audio state.
   * @param {HTMLElement} audioElement Audio element.
   */
  stopAndResetAudioElement(audioElement) {
    if (!audioElement) return;
    this.detachLoopListener(audioElement);
    audioElement.pause();
    audioElement.currentTime = 0;
  }
}
