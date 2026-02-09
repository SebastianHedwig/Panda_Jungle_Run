import { playWhenReady } from "../audioUtils.js";

/**
 * Plays defeat.
 * Used to support audio playback.
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
 * Used to support audio playback.
 * @param {*} defeat Defeat.
 * @returns {*} Result value.
 */
export function finishDefeatWithoutFade(defeat) {
  defeat.volume = this.volume;
  return defeat;
}

/**
 * Creates defeat audio.
 * Used to set up required data for audio playback.
 * @returns {*} Defeat audio.
 */
export function createDefeatAudio() {
  const defeat = this.createAudio(this.defeatSrc, false, 0);
  this.defeatAudio = defeat;
  return defeat;
}

/**
 * Creates howl end audio.
 * Used to set up required data for audio playback.
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
 * Used to support audio playback.
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
 * Used to provide fading tracks for audio playback.
 * @returns {Array<any>} Fading tracks.
 */
export function getFadingTracks() {
  return [this.musicAudio, this.nextMusicAudio, this.gongAudio].filter(Boolean);
}

/**
 * Starts defeat fade.
 * Used to support audio playback.
 * Schedules timed actions.
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
 * Used to apply audio settings.
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
 * Used to support audio playback.
 * Triggers audio playback or updates audio state.
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
 * Used to support audio playback.
 * Triggers audio playback or updates audio state.
 * @param {*} fadingTracks Fading tracks.
 */
export function clearGongAfterDefeat(fadingTracks) {
  if (this.gongAudio && !fadingTracks.includes(this.gongAudio)) {
    this.gongAudio.pause();
    this.gongAudio.currentTime = 0;
  }
  this.gongAudio = null;
}
