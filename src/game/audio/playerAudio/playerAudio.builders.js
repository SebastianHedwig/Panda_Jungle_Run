import { SFX_VOLUME } from "../../../config/config.js";
import {
  PLAYER_DEAD,
  PLAYER_PUNCH,
  PLAYER_OUCH,
  PLAYER_HIT,
  PLAYER_SHOOT,
  PLAYER_JUMP,
  PLAYER_LANDING,
  PLAYER_SLIDE,
} from "./playerAudio.class.js";

/**
 * Builds player audio sources. If omitted, default values are used.
 * Applies physics updates like gravity and velocity.
 * @param {Object} [options] Configuration options.
 * @param {string} [options.deadSrc] Dead src.
 * @param {*} [options.punchSrcs] Punch srcs.
 * @param {*} [options.ouchSrcs] Ouch srcs.
 * @param {string} [options.hitSrc] Hit src.
 * @param {string} [options.shootSrc] Shoot src.
 * @param {string} [options.jumpSrc] Jump src.
 * @param {string} [options.landingSrc] Landing src.
 * @param {*} [options.slideSrcs] Slide srcs.
 * @param {*} [options.}] Value.
 */
export function buildPlayerAudioSources({
  deadSrc = PLAYER_DEAD,
  punchSrcs = PLAYER_PUNCH,
  ouchSrcs = PLAYER_OUCH,
  hitSrc = PLAYER_HIT,
  shootSrc = PLAYER_SHOOT,
  jumpSrc = PLAYER_JUMP,
  landingSrc = PLAYER_LANDING,
  slideSrcs = PLAYER_SLIDE,
} = {}) {
  return { deadSrc, punchSrcs, ouchSrcs, hitSrc, shootSrc, jumpSrc, landingSrc, slideSrcs };
}

/**
 * Builds player audio settings. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 * @param {number} [options.landingOffset] Landing offset.
 * @param {number} [options.landingVolume] Landing volume.
 * @param {number} [options.volume] Volume.
 * @param {number} [options.deadRate] Dead rate.
 * @param {*} [options.}] Value.
 */
export function buildPlayerAudioSettings({
  landingOffset = 0.3,
  landingVolume = SFX_VOLUME + 0.3,
  volume = SFX_VOLUME,
  deadRate = 2.5,
} = {}) {
  return { landingOffset, landingVolume: Math.min(1, landingVolume ?? volume), deadRate, volume };
}

/**
 * Builds player audio config. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 */
export function buildPlayerAudioConfig(options = {}) {
  return { ...buildPlayerAudioSources(options), ...buildPlayerAudioSettings(options) };
}

/**
 * Builds player audio state.
 * Applies physics updates like gravity and velocity.
 * @returns {Object} Player audio state.
 */
export function buildPlayerAudioState() {
  return {
    deadAudio: null,
    punchCache: new Map(),
    hitAudio: null,
    ouchCache: new Map(),
    shootAudio: null,
    jumpAudio: null,
    landingBase: null,
    slideAudio0: null,
    slideAudio1: null,
    unlockHandler: null,
  };
}
