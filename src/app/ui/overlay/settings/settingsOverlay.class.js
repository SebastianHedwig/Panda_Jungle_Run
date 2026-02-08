import { OverlayRenderer } from "../base/overlay.base.class.js";
import { ControlsOverlay } from "../controls/controlsOverlay.class.js";
import { ControlsOverlayMobile } from "../controls/mobileControlsOverlay.class.js";
import {
  exitControlsOverlay,
  getItemHitIndex,
  handleControlsClick,
  handleMenuItemHit,
  handleSettingsOverlayClick,
  isInsideBounds,
  isPointerInsideBounds,
  openControls,
  quitGame,
} from "./settingsOverlay.interaction.js";
import {
  applyMenuFont,
  drawMenuItem,
  drawPausedText,
  drawSettingsTitle,
  getListLayout,
  getMenuItemLayout,
  getMenuItems,
  getTitleY,
  render,
  renderControlsLayer,
  renderMenuContent,
  renderMenuItems,
  renderMenuLayer,
  textStyle,
} from "./settingsOverlay.render.js";

export class SettingsOverlay {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   * @param {HTMLImageElement} [options.backgroundImage] Background image.
   * @param {HTMLImageElement} [options.uiImage] Ui image.
   * @param {Function} [options.onQuit] On quit.
   */
  constructor({ backgroundImage = null, uiImage = null, onQuit = null } = {}) {
    this.renderer = new OverlayRenderer();
    this.controlsOverlayDesktop = new ControlsOverlay({ showBackButton: true });
    this.controlsOverlayMobile = new ControlsOverlayMobile({ showBackButton: true });
    this.assets = { bgImage: backgroundImage, uiImage };
    this.pointer = null;
    this.itemBounds = [];
    this.showControls = false;
    this.onQuit = onQuit;
  }

  /**
   * Returns active controls overlay.
   * Resolves DOM elements from the document.
   * Updates the instance state.
   * @returns {*} Active controls overlay.
   */
  getActiveControlsOverlay() {
    const container = document.getElementById("game-container");
    const useMobile = container?.classList?.contains("auto-fullscreen");
    return useMobile ? this.controlsOverlayMobile : this.controlsOverlayDesktop;
  }

  /**
   * Sets assets.
   * Uses options to perform the operation.
   * @param {Object} options Configuration options.
   * @param {HTMLImageElement} [options.bgImage] Bg image.
   * @param {HTMLImageElement} [options.uiImage] Ui image.
   */
  setAssets({ bgImage, uiImage }) {
    this.assets = { bgImage, uiImage };
    this.controlsOverlayDesktop.setAssets({ bgImage, uiImage });
    this.controlsOverlayMobile.setAssets({ bgImage, uiImage });
  }

  /**
   * Sets pointer.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   */
  setPointer(x, y) {
    this.pointer = x == null || y == null ? null : { x, y };
    if (this.showControls) {
      this.getActiveControlsOverlay().setPointer(x, y);
    } else {
      this.renderer.setPointer(x, y);
    }
  }

  /**
   * Clears pointer.
   * Updates the instance state.
   */
  clearPointer() {
    this.pointer = null;
    this.itemBounds = [];
    this.renderer.clearPointer();
    this.controlsOverlayDesktop.clearPointer();
    this.controlsOverlayMobile.clearPointer();
  }
}

Object.assign(SettingsOverlay.prototype, {
  isInsideBounds,
  isPointerInsideBounds,
  exitControlsOverlay,
  handleControlsClick,
  getItemHitIndex,
  openControls,
  quitGame,
  handleMenuItemHit,
  handleSettingsOverlayClick,
  textStyle,
  renderControlsLayer,
  getTitleY,
  drawSettingsTitle,
  drawPausedText,
  getListLayout,
  applyMenuFont,
  getMenuItems,
  getMenuItemLayout,
  drawMenuItem,
  renderMenuItems,
  renderMenuLayer,
  renderMenuContent,
  render,
});
