import { loadFont, loadStartImage } from "./startScreen.utils.js";

/**
 * Loads start assets.
 * Used to support camera-relative placement.
 * @returns {*} Result value.
 */
export const loadStartAssets = () =>
  Promise.all([
    loadStartImage("./assets/img/canvas-start-game_bg.jpg"),
    loadStartImage("./assets/img/gui/game-ui.png"),
    loadStartImage("./assets/img/menu_bg.png"),
    loadFont("ComixLoud", "4rem"),
  ]);

/**
 * Applies loaded assets.
 * Used to keep state consistent before the next step for camera-relative placement.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.bg] Bg.
 * @param {*} [options.ui] Ui.
 * @param {*} [options.menuBg] Menu bg.
 * @param {*} [options.startScreenState] Start screen state.
 */
export const applyLoadedAssets = ({ bg, ui, menuBg, startScreenState }) => {
  startScreenState.startAssets = { bg, ui, menuBg };
  document.body?.classList.add("start-screen-active");
};

/**
 * Loads and render start assets.
 * Used to support camera-relative placement.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.startScreenState] Start screen state.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
export const loadAndRenderStartAssets = ({ startScreenState, drawStartScreen }) => {
  loadStartAssets()
    .then(([bg, ui, menuBg, _fontLoaded]) => {
      applyLoadedAssets({ bg, ui, menuBg, startScreenState });
      drawStartScreen();
    })
    .catch((err) => console.error("Failed to load start assets", err));
};
