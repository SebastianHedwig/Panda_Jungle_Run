import { setOverlayActive } from "./startScreenUtils.js";

export function createStartScreenHandlers({
  canvas,
  settingsToggle,
  settingsLabel,
  settingsIcon,
  defaultSettingsLabel,
  settingsIconDefaultSrc,
  getActiveControlsOverlay,
  drawStartScreen,
  showLegalPage,
  stopMenuMusic,
  onStart,
  mobileAudioUnlock,
  state,
}) {
  const handleClick = (event) => {
    if (!state.startScreenActive) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

    if (state.legalPage) {
      if (
        state.legalPage === "impressum" &&
        state.impressumLinkBounds &&
        x >= state.impressumLinkBounds.x &&
        x <= state.impressumLinkBounds.x + state.impressumLinkBounds.w &&
        y >= state.impressumLinkBounds.y &&
        y <= state.impressumLinkBounds.y + state.impressumLinkBounds.h
      ) {
        showLegalPage("privacy");
        return;
      }
      const canClose =
        state.legalReturnBounds &&
        x >= state.legalReturnBounds.x &&
        x <= state.legalReturnBounds.x + state.legalReturnBounds.w &&
        y >= state.legalReturnBounds.y &&
        y <= state.legalReturnBounds.y + state.legalReturnBounds.h;
      if (canClose) {
        state.legalPage = null;
        setOverlayActive(false);
        canvas.style.cursor = "default";
        state.legalReturnBounds = null;
        state.legalReturnHover = false;
        drawStartScreen();
      }
      return;
    }

    if (state.settingsOpen) {
      const overlay = getActiveControlsOverlay();
      if (overlay.handleClick(x, y)) {
        state.settingsOpen = false;
        overlay.clearPointer();
        setOverlayActive(false);
        canvas.style.cursor = "default";
        drawStartScreen();
      }
      return;
    }

    if (!state.startButtonBounds) return;
    const {
      x: startButtonX,
      y: startButtonY,
      w: startButtonWidth,
      h: startButtonHeight,
    } = state.startButtonBounds;
    const inside =
      x >= startButtonX &&
      x <= startButtonX + startButtonWidth &&
      y >= startButtonY &&
      y <= startButtonY + startButtonHeight;
    if (inside) {
      state.startScreenActive = false;
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseleave", handleLeave);
      settingsToggle?.removeEventListener("click", handleSettingsClick, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      state.settingsOpen = false;
      setOverlayActive(false);
      document.body?.classList.remove("start-screen-active");
      canvas.style.cursor = "default";
      if (settingsLabel) settingsLabel.textContent = defaultSettingsLabel;
      if (settingsIcon) {
        settingsIcon.src = settingsIconDefaultSrc;
        settingsIcon.alt = "Settings";
      }
      settingsToggle?.classList.add("settings-toggle--spin");
      stopMenuMusic();
      mobileAudioUnlock.unlock();
      onStart?.();
    }
  };

  const handleMove = (event) => {
    if (!state.startScreenActive) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

    if (state.legalPage) {
      const overReturn =
        state.legalReturnBounds &&
        x >= state.legalReturnBounds.x &&
        x <= state.legalReturnBounds.x + state.legalReturnBounds.w &&
        y >= state.legalReturnBounds.y &&
        y <= state.legalReturnBounds.y + state.legalReturnBounds.h;
      if (state.legalReturnHover !== overReturn) {
        state.legalReturnHover = overReturn;
        drawStartScreen();
      }
      const overLink =
        state.legalPage === "impressum" &&
        state.impressumLinkBounds &&
        x >= state.impressumLinkBounds.x &&
        x <= state.impressumLinkBounds.x + state.impressumLinkBounds.w &&
        y >= state.impressumLinkBounds.y &&
        y <= state.impressumLinkBounds.y + state.impressumLinkBounds.h;
      canvas.style.cursor = overReturn || overLink ? "pointer" : "default";
      return;
    }

    if (state.settingsOpen) {
      const overlay = getActiveControlsOverlay();
      overlay.setPointer(x, y);
      const hovering = overlay.isHovering();
      canvas.style.cursor = hovering ? "pointer" : "default";
      drawStartScreen();
      return;
    }

    if (!state.startButtonBounds) return;
    const {
      x: startButtonX,
      y: startButtonY,
      w: startButtonWidth,
      h: startButtonHeight,
    } = state.startButtonBounds;
    const inside =
      x >= startButtonX &&
      x <= startButtonX + startButtonWidth &&
      y >= startButtonY &&
      y <= startButtonY + startButtonHeight;
    if (inside !== state.startButtonHover) {
      state.startButtonHover = inside;
      canvas.style.cursor = inside ? "pointer" : "default";
      drawStartScreen();
    } else if (inside) {
      canvas.style.cursor = "pointer";
    }
  };

  const handleLeave = () => {
    if (!state.startScreenActive) return;
    if (state.legalPage) {
      canvas.style.cursor = "default";
      if (state.legalReturnHover) {
        state.legalReturnHover = false;
        drawStartScreen();
      }
      return;
    }
    if (state.settingsOpen) {
      const overlay = getActiveControlsOverlay();
      overlay.clearPointer();
      drawStartScreen();
      setOverlayActive(true);
      canvas.style.cursor = "default";
      return;
    }
    if (state.startButtonHover) {
      state.startButtonHover = false;
      drawStartScreen();
    }
    canvas.style.cursor = "default";
  };

  const handleSettingsClick = (event) => {
    if (!state.startScreenActive) return;
    event?.preventDefault();
    event?.stopImmediatePropagation();
    state.settingsOpen = !state.settingsOpen;
    state.startButtonHover = false;
    const overlay = getActiveControlsOverlay();
    overlay.clearPointer();
    canvas.style.cursor = "default";
    setOverlayActive(state.settingsOpen);
    drawStartScreen();
  };

  const handleKeyDown = (event) => {
    if (!state.startScreenActive || event.key !== "Escape") return;
    if (state.legalPage) {
      event.preventDefault();
      event.stopImmediatePropagation();
      state.legalPage = null;
      setOverlayActive(false);
      drawStartScreen();
      return;
    }
    if (state.settingsOpen) {
      event.preventDefault();
      event.stopImmediatePropagation();
      state.settingsOpen = false;
      const overlay = getActiveControlsOverlay();
      overlay.clearPointer();
      setOverlayActive(false);
      drawStartScreen();
    }
  };

  const handleWheel = (event) => {
    if (!state.legalPage) return;
    event.preventDefault();
    const scrollDeltaY = event.deltaY;
    state.legalScroll = Math.min(state.legalMaxScroll, Math.max(0, state.legalScroll + scrollDeltaY));
    drawStartScreen();
  };

  const handleTouchStart = (event) => {
    if (!state.legalPage) return;
    const firstTouch = event.touches?.[0];
    if (!firstTouch) return;
    state.touchScrollStartY = firstTouch.clientY;
  };

  const handleTouchMove = (event) => {
    if (!state.legalPage || state.touchScrollStartY === null) return;
    const firstTouch = event.touches?.[0];
    if (!firstTouch) return;
    const scrollDeltaY = state.touchScrollStartY - firstTouch.clientY;
    state.legalScroll = Math.min(state.legalMaxScroll, Math.max(0, state.legalScroll + scrollDeltaY));
    state.touchScrollStartY = firstTouch.clientY;
    event.preventDefault();
    drawStartScreen();
  };

  const handleTouchEnd = () => {
    state.touchScrollStartY = null;
  };

  return {
    handleClick,
    handleMove,
    handleLeave,
    handleSettingsClick,
    handleKeyDown,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
