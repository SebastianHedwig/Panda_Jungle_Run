import { loadImage, waitForImage } from "../../core/game/assets/assetLoader.js";

export const setOverlayActive = (active) => {
  document.body?.classList.toggle("overlay-active", active);
};

export const loadStartImage = (src) =>
  waitForImage(loadImage(src)).then(({ ok, img }) => {
    if (!ok) throw new Error(`Failed to load ${src}`);
    return img;
  });

export const loadFont = (family, descriptor = "1rem") => {
  if (!document.fonts?.load) return Promise.resolve(false);
  return document.fonts.load(`${descriptor} "${family}"`).catch(() => false);
};
