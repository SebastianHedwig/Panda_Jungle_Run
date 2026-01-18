
const PORTRAIT_QUERY = "(orientation: portrait) and (max-width: 920px)";
const ASPECT_RATIO_QUERY = "(max-aspect-ratio: 7/5) and (max-width: 800px)";

export class ViewportManagement {
  constructor({ containerId = "game-container", overlayId = "rotate-overlay", setPaused, getPaused } = {}) {
    this.container = document.getElementById(containerId);
    this.setPaused = setPaused;
    this.getPaused = getPaused;
    this.pausedByViewport = false;
    this.locked = false;

    this.overlay = this.ensureOverlay(overlayId);

    this.mediaQueries = [PORTRAIT_QUERY, ASPECT_RATIO_QUERY].map((query) =>
      window.matchMedia(query)
    );
    this.handleViewportChange = this.handleViewportChange.bind(this);
    this.mediaQueries.forEach((mq) => mq.addEventListener("change", this.handleViewportChange));
    window.addEventListener("resize", this.handleViewportChange);
    window.addEventListener("orientationchange", this.handleViewportChange);

    this.handleViewportChange();
  }

  ensureOverlay(overlayId) {
    let overlay = document.getElementById(overlayId);
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = overlayId;
    overlay.className = "rotate-overlay";
    overlay.innerHTML = /*HTML*/ `
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

    document.body.appendChild(overlay);
    return overlay;
  }

  handleViewportChange() {
    const shouldLock = this.mediaQueries.some((mq) => mq.matches);
    this.toggleOverlay(shouldLock);
    this.toggleGameplay(shouldLock);
  }

  toggleOverlay(shouldShow) {
    if (!this.overlay) return;
    this.overlay.classList.toggle("is-active", shouldShow);
    document.body?.classList.toggle("viewport-locked", shouldShow);
  }

  toggleGameplay(shouldLock) {
    if (!this.setPaused || !this.getPaused) return;

    if (shouldLock && !this.locked) {
      this.locked = true;
      this.pausedByViewport = !this.getPaused();
      if (this.pausedByViewport) {
        this.setPaused(true);
      }
      return;
    }

    if (!shouldLock && this.locked) {
      this.locked = false;
      if (this.pausedByViewport && this.getPaused()) {
        this.setPaused(false);
      }
      this.pausedByViewport = false;
    }
  }
}
