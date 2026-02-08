import { BOSS_MUSIC_LOOP_CUT, BOSS_MUSIC_PLAYBACK_RATE, MUSIC_VOLUME, SFX_VOLUME } from "../../../config/config.js";
import {
  BOSS_GONG,
  BOSS_MUSIC,
  BOSS_DEFEAT,
  BOSS_WHIMPER,
  BOSS_HOWL_END,
  BOSS_ATTACK2,
  BOSS_WHOOSH,
  BOSS_HIT,
} from "./bossAudio.class.js";

/**
 * Builds boss audio sources. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 * @param {string} [options.gongSrc] Gong src.
 * @param {string} [options.musicSrc] Music src.
 * @param {string} [options.defeatSrc] Defeat src.
 * @param {*} [options.whimperSrcs] Whimper srcs.
 * @param {string} [options.howlEndSrc] Howl end src.
 * @param {string} [options.attack2Src] Attack 2 src.
 * @param {string} [options.whooshSrc] Whoosh src.
 * @param {string} [options.hitSrc] Hit src.
 * @param {*} [options.}] Value.
 */
export function buildBossAudioSources({
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

/**
 * Builds boss audio volumes. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 * @param {number} [options.volume] Volume.
 * @param {number} [options.sfxVolume] Sfx volume.
 */
export function buildBossAudioVolumes({ volume = MUSIC_VOLUME, sfxVolume = SFX_VOLUME } = {}) {
  return { volume, sfxVolume, hitBoostVolume: 0.2, maxVolumeCap: 1 };
}

/**
 * Builds boss audio timing. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 * @param {*} [options.musicLoopCut] Music loop cut.
 * @param {number} [options.playbackRate] Playback rate.
 * @param {number} [options.gongPlayDuration] Gong play duration.
 * @param {number} [options.fadeDuration] Fade duration.
 * @param {*} [options.}] Value.
 */
export function buildBossAudioTiming({
  musicLoopCut = BOSS_MUSIC_LOOP_CUT,
  playbackRate = BOSS_MUSIC_PLAYBACK_RATE,
  gongPlayDuration = 3,
  fadeDuration = 1,
} = {}) {
  return { gongPlayDuration, fadeDuration, minFadeDurationMs: 100, loudnessStepMs: 50, musicLoopCut, playbackRate };
}

/**
 * Builds boss audio config. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 */
export function buildBossAudioConfig(options = {}) {
  return {
    ...buildBossAudioSources(options),
    ...buildBossAudioVolumes(options),
    ...buildBossAudioTiming(options),
  };
}

/**
 * Builds boss audio reference state.
 * @returns {Object} Boss audio reference state.
 */
export function buildBossAudioReferenceState() {
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

/**
 * Builds boss audio runtime state.
 * @returns {Object} Boss audio runtime state.
 */
export function buildBossAudioRuntimeState() {
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

/**
 * Builds boss audio state.
 * @returns {Object} Boss audio state.
 */
export function buildBossAudioState() {
  return {
    ...buildBossAudioReferenceState(),
    ...buildBossAudioRuntimeState(),
  };
}
