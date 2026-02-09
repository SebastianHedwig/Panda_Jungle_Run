/**
 * Loads image.
 * Used to support rendering.
 * Uses src to perform the operation.
 * @param {string} src Source URL.
 * @returns {*} Result value.
 */
export function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

/**
 * Loads frames. If omitted, default values are used.
 * Used to support gameplay flow.
 * Uses path, prefix, count, options to perform the operation.
 * @param {string} path Path.
 * @param {*} prefix Prefix.
 * @param {number} count Count.
 * @param {Object} [options] Configuration options.
 * @param {*} [options.pad] Pad.
 */
export function loadFrames(path, prefix, count, { pad = 3 } = {}) {
  return [...Array(count)].map((_, frameIndex) =>
    loadImage(`${path}${prefix}${String(frameIndex).padStart(pad, "0")}.png`)
  );
}

/**
 * Is image valid.
 * Used to decide control flow.
 * Uses img to perform the operation.
 * @param {HTMLImageElement} img Img.
 * @returns {boolean} Whether image valid.
 */
function isImageValid(img) {
  return img.naturalWidth > 0 && img.naturalHeight > 0;
}

/**
 * Handles image error.
 * Used to centralize a specific behavior for rendering.
 * Uses img, finish to perform the operation.
 * @param {HTMLImageElement} img Img.
 * @param {Function} finish Finish.
 */
function handleImageError(img, finish) {
  console.warn("Image failed to load", img?.src || img);
  finish(false);
}

/**
 * Wait for image.
 * Used to support rendering.
 * Uses img to perform the operation.
 * @param {HTMLImageElement} img Img.
 * @returns {*} Result value.
 */
export function waitForImage(img) {
  return new Promise((resolve) => {
    /**
     * Finish.
     * Used to support gameplay flow.
     * Uses ok to perform the operation.
     * @param {*} ok Ok.
     * @returns {*} Result value.
     */
    const finish = (ok) => resolve({ ok, img });
    if (img.complete) {
      finish(isImageValid(img));
      return;
    }
    img.onload = () => finish(true);
    img.onerror = () => handleImageError(img, finish);
  });
}
