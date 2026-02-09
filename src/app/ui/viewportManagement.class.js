
const PORTRAIT_QUERY = "(orientation: portrait) and (max-width: 1024px)";
const ASPECT_RATIO_QUERY = "(max-aspect-ratio: 7/5) and (max-width: 1024px)";
const ROTATE_OVERLAY_MARKUP = /*HTML*/ `
  <div class="rotate-overlay__panel">
    <div class="rotate-overlay__icon">
      <div class="rotate-overlay__device rotate-overlay__device--portrait"></div>
      <div class="rotate-overlay__device rotate-overlay__device--landscape"></div>
      <div class="rotate-overlay__hint-line"></div>
    </div>
    <div class="rotate-overlay__text">
      <div class="rotate-overlay__title">Change to Landscape</div>
      <div class="rotate-overlay__subtitle">Rotate your device to play!</div>
    </div>
  </div>
`;

export class ViewportManagement {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Used to set up required data for camera-relative placement.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   * @param {string} [options.containerId] Container element id.
   * @param {string} [options.overlayId] Overlay element id.
   * @param {boolean} [options.setPaused] Set paused.
   * @param {*} [options.getPaused }] Get paused.
   */
  constructor({ containerId = "game-container", overlayId = "rotate-overlay", setPaused, getPaused } = {}) {
    this.setContainer(containerId);
    this.setPauseHandlers(setPaused, getPaused);
    this.resetViewportState();
    this.overlay = this.ensureOverlay(overlayId);
    this.setupMediaQueries();
    this.bindHandlers();
    this.addViewportListeners();
    this.handleViewportChange();
  }

  /**
   * Sets container.
   * Used to support camera-relative placement.
   * Resolves DOM elements from the document.
   * @param {string} containerId Container element id.
   */
  setContainer(containerId) {
    this.container = document.getElementById(containerId);
  }

  /**
   * Sets pause handlers.
   * Used to support camera-relative placement.
   * @param {boolean} setPaused Set paused.
   * @param {boolean} getPaused Get paused.
   */
  setPauseHandlers(setPaused, getPaused) {
    this.setPaused = setPaused;
    this.getPaused = getPaused;
  }

  /**
   * Resets viewport state.
   */
  resetViewportState() {
    this.pausedByViewport = false;
    this.locked = false;
  }

  /**
   * Sets up media queries.
   */
  setupMediaQueries() {
    this.mediaQueries = [PORTRAIT_QUERY, ASPECT_RATIO_QUERY].map((query) => window.matchMedia(query));
  }

  /**
   * Binds handlers.
   */
  bindHandlers() {
    this.handleViewportChange = this.handleViewportChange.bind(this);
  }

  /**
   * Adds viewport listeners.
   * Binds change, orientationchange, resize event listeners.
   */
  addViewportListeners() {
    this.mediaQueries.forEach((mq) => mq.addEventListener("change", this.handleViewportChange));
    window.addEventListener("resize", this.handleViewportChange);
    window.addEventListener("orientationchange", this.handleViewportChange);
  }

  /**
   * Ensure overlay.
   * Used to support UI interaction handling.
   * @param {string} overlayId Overlay element id.
   * @returns {*} Result value.
   */
  ensureOverlay(overlayId) {
    const existingOverlay = this.getExistingOverlay(overlayId);
    if (existingOverlay) return existingOverlay;
    const overlay = this.createOverlayElement(overlayId);
    this.appendOverlay(overlay);
    return overlay;
  }

  /**
   * Returns existing overlay.
   * Used to provide existing overlay for UI interaction handling.
   * Resolves DOM elements from the document.
   * @param {string} overlayId Overlay element id.
   * @returns {*} Existing overlay.
   */
  getExistingOverlay(overlayId) {
    return document.getElementById(overlayId);
  }

  /**
   * Creates overlay element.
   * Used to set up required data for UI interaction handling.
   * Uses overlayId to compute the result.
   * @param {string} overlayId Overlay element id.
   * @returns {*} Overlay element.
   */
  createOverlayElement(overlayId) {
    const overlay = document.createElement("div");
    overlay.id = overlayId;
    overlay.className = "rotate-overlay";
    overlay.innerHTML = ROTATE_OVERLAY_MARKUP;
    return overlay;
  }

  /**
   * Append overlay.
   * Used to support UI interaction handling.
   * Uses overlay to perform the operation.
   * @param {HTMLElement} overlay Overlay.
   */
  appendOverlay(overlay) {
    document.body.appendChild(overlay);
  }

  /**
   * Handles viewport change.
   */
  handleViewportChange() {
    const shouldLock = this.mediaQueries.some((mq) => mq.matches);
    this.toggleOverlay(shouldLock);
    this.toggleGameplay(shouldLock);
  }

  /**
   * Toggles overlay.
   * Used to support UI interaction handling.
   * Updates CSS classes to reflect the current state.
   * @param {boolean} shouldShow Whether show.
   */
  toggleOverlay(shouldShow) {
    if (!this.overlay) return;
    this.overlay.classList.toggle("is-active", shouldShow);
    document.body?.classList.toggle("viewport-locked", shouldShow);
  }

  /**
   * Toggles gameplay.
   * Used to support camera-relative placement.
   * @param {boolean} shouldLock Whether lock.
   */
  toggleGameplay(shouldLock) {
    if (!this.setPaused || !this.getPaused) return;

    if (shouldLock && !this.locked) {
      this.lockGameplay();
      return;
    }

    if (!shouldLock && this.locked) {
      this.unlockGameplay();
    }
  }

  /**
   * Lock gameplay.
   */
  lockGameplay() {
    this.locked = true;
    this.pausedByViewport = !this.getPaused();
    if (this.pausedByViewport) {
      this.setPaused(true);
    }
  }

  /**
   * Unlock gameplay.
   */
  unlockGameplay() {
    this.locked = false;
    if (this.pausedByViewport && this.getPaused()) {
      this.setPaused(false);
    }
    this.pausedByViewport = false;
  }
}
