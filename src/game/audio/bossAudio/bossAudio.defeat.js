import { playWhenReady } from "../audioUtils.js";

/**
 * Plays defeat.
 * Updates the instance state.
 * @returns {*} Result value.
 */
export function playDefeat() {
  if (this.defeatPlayed) return null;
  this.defeatPlayed = true; this.clearFadeInterval();
  const defeat = this.createDefeatAudio(); const howl = this.createHowlEndAudio();
  this.playDefeatAudio(defeat, howl); this.bindUnlock();
  const fadingTracks = this.getFadingTracks();
  if (!fadingTracks.length) return this.finishDefeatWithoutFade(defeat);
  this.startDefeatFade(defeat, fadingTracks);
  return defeat;
}

/**
 * Finish defeat without fade.
 * Updates the instance state.
 * @param {*} defeat Defeat.
 * @returns {*} Result value.
 */
export function finishDefeatWithoutFade(defeat) {
  defeat.volume = this.volume;
  return defeat;
}

/**
 * Creates defeat audio.
 * Updates the instance state.
 * @returns {*} Defeat audio.
 */
export function createDefeatAudio() {
  const defeat = this.createAudio(this.defeatSrc, false, 0);
  this.defeatAudio = defeat;
  return defeat;
}

/**
 * Creates howl end audio.
 * Updates the instance state.
 * @returns {*} Howl end audio.
 */
export function createHowlEndAudio() {
  const howl = this.howlEndSrc
    ? this.createAudio(this.howlEndSrc, false, this.getHitVolume())
    : null;
  this.howlEndAudio = howl;
  return howl;
}

/**
 * Plays defeat audio.
 * Uses defeat, howl to perform the operation.
 * @param {*} defeat Defeat.
 * @param {*} howl Howl.
 */
export function playDefeatAudio(defeat, howl) {
  playWhenReady(defeat);
  if (howl) playWhenReady(howl);
}

/**
 * Returns fading tracks.
 * Updates the instance state.
 * @returns {Array<any>} Fading tracks.
 */
export function getFadingTracks() {
  return [this.musicAudio, this.nextMusicAudio, this.gongAudio].filter(Boolean);
}

/**
 * Starts defeat fade.
 * Schedules timed actions.
 * Updates the instance state.
 * @param {*} defeat Defeat.
 * @param {*} fadingTracks Fading tracks.
 */
export function startDefeatFade(defeat, fadingTracks) {
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

/**
 * Applies defeat fade volumes.
 * Updates the instance state.
 * @param {*} defeat Defeat.
 * @param {*} fadingTracks Fading tracks.
 * @param {number} fadeProgress Fade progress.
 */
export function applyDefeatFadeVolumes(defeat, fadingTracks, fadeProgress) {
  const invertFadeProgress = 1 - fadeProgress; // 1..0 volume blend
  for (const track of fadingTracks) {
    track.volume = this.volume * invertFadeProgress;
  }
  defeat.volume = this.volume * fadeProgress;
}

/**
 * Finish defeat fade.
 * Triggers audio playback or updates audio state.
 * Updates the instance state.
 * @param {*} fadingTracks Fading tracks.
 */
export function finishDefeatFade(fadingTracks) {
  this.clearFadeInterval();
  fadingTracks.forEach((track) => {
    track.pause();
    track.currentTime = 0;
  });
  this.clearMusicTracks();
  this.clearGongAfterDefeat(fadingTracks);
}

/**
 * Clears gong after defeat.
 * Triggers audio playback or updates audio state.
 * Updates the instance state.
 * @param {*} fadingTracks Fading tracks.
 */
export function clearGongAfterDefeat(fadingTracks) {
  if (this.gongAudio && !fadingTracks.includes(this.gongAudio)) {
    this.gongAudio.pause();
    this.gongAudio.currentTime = 0;
  }
  this.gongAudio = null;
}
