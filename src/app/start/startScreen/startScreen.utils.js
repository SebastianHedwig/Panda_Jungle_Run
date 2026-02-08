import { loadImage, waitForImage } from "../../../core/game/assets/assetLoader.js";

/**
 * Sets overlay active.
 * Updates CSS classes to reflect the current state.
 * @param {boolean} active Active.
 */
export const setOverlayActive = (active) => {
  document.body?.classList.toggle("overlay-active", active);
};

/**
 * Sets legal screen active.
 * Updates CSS classes to reflect the current state.
 * @param {boolean} active Active.
 */
export const setLegalScreenActive = (active) => {
  document.body?.classList.toggle("legal-screen-active", active);
};

/**
 * Marks next start screen action consumed.
 * Uses state to perform the operation.
 * @param {Object} state Start screen state.
 */
export const markNextStartScreenActionConsumed = (state) => {
  if (!state) return;
  state.consumeNextAction = true;
};

/**
 * Consumes next start screen action.
 * Uses state to perform the operation.
 * @param {Object} state Start screen state.
 * @returns {boolean} Whether action consumed.
 */
export const consumeNextStartScreenAction = (state) => {
  if (!state?.consumeNextAction) return false;
  state.consumeNextAction = false;
  return true;
};

/**
 * Loads start image.
 * Uses src to perform the operation.
 * @param {string} src Source URL.
 * @returns {*} Result value.
 */
export const loadStartImage = (src) =>
  waitForImage(loadImage(src)).then(({ ok, img }) => {
    if (!ok) throw new Error(`Failed to load ${src}`);
    return img;
  });

/**
 * Loads font. If omitted, default values are used.
 * Uses family, descriptor to perform the operation.
 * @param {*} family Family.
 * @param {*} [descriptor] Descriptor.
 * @returns {*} Result value.
 */
export const loadFont = (family, descriptor = "1rem") => {
  if (!document.fonts?.load) return Promise.resolve(false);
  return document.fonts.load(`${descriptor} "${family}"`).catch(() => false);
};
