const FAST_FORWARD_ACTIVE_SRC =
  "./assets/icons/mobileControls/button-fast-forward.active.png";
const FAST_FORWARD_INACTIVE_SRC =
  "./assets/icons/mobileControls/button-fast-forward-inactive.png";

export function setupMobileControls() {
  const buttons = document.querySelectorAll(".mobile-control-button");
  buttons.forEach((btn) =>
    btn.addEventListener("contextmenu", (e) => e.preventDefault())
  );

  const emitKeyDown = (key) =>
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  const emitKeyUp = (key) =>
    window.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));

  function bindHold(button, key) {
    if (!button) return;
    const activePointers = new Set();

    const press = (event) => {
      event?.preventDefault?.();
      const pointerId = event?.pointerId;
      if (pointerId != null) {
        if (activePointers.has(pointerId)) return;
        activePointers.add(pointerId);
      }
      if (activePointers.size === 1 || pointerId == null) emitKeyDown(key);
    };

    const release = (event) => {
      const pointerId = event?.pointerId;
      if (pointerId != null) {
        if (!activePointers.has(pointerId)) return;
        activePointers.delete(pointerId);
        if (activePointers.size > 0) return;
      }
      emitKeyUp(key);
    };

    const cancelAll = () => {
      if (activePointers.size === 0) return;
      activePointers.clear();
      emitKeyUp(key);
    };

    button.addEventListener("pointerdown", (event) => {
      button.setPointerCapture?.(event.pointerId);
      press(event);
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", cancelAll);
  }

  const btnLeft = document.querySelector(
    ".mobile-control-container-left .mobile-control-button img[alt='Nach links']"
  )?.closest("button");
  const btnRight = document.querySelector(
    ".mobile-control-container-left .mobile-control-button img[alt='Nach rechts']"
  )?.closest("button");

  bindHold(btnLeft, "ArrowLeft");
  bindHold(btnRight, "ArrowRight");

  const btnJump = document
    .querySelector(
      ".mobile-control-container-right .mobile-control-button img[alt='Springen']"
    )
    ?.closest("button");
  const btnAttack = document
    .querySelector(
      ".mobile-control-container-right .mobile-control-button img[alt='Angriff']"
    )
    ?.closest("button");
  const btnSlide = document
    .querySelector(
      ".mobile-control-container-right .mobile-control-button img[alt='Rutschen']"
    )
    ?.closest("button");

  bindHold(btnJump, " ");
  bindHold(btnAttack, "Enter");

  const updateSlideEnabled = (enabled) => {
    if (!btnSlide) return;
    btnSlide.classList.toggle("mobile-control-button--disabled", !enabled);
  };

  bindHold(btnSlide, "ArrowDown");

  const fastForwardBtn = document.querySelector(
    ".mobile-control-button--fast-forward"
  );
  if (!fastForwardBtn) return;

  const icon = fastForwardBtn.querySelector("img");
  const srcActive = fastForwardBtn.dataset.srcActive || FAST_FORWARD_ACTIVE_SRC;
  const srcInactive =
    fastForwardBtn.dataset.srcInactive || FAST_FORWARD_INACTIVE_SRC;

  let isActive = false;

  const updateIcon = () => {
    if (!icon) return;
    icon.src = isActive ? srcActive : srcInactive;
  };

  const setRunMode = (active) => {
    isActive = !!active;
    if (isActive) {
      emitKeyDown("Shift");
    } else {
      emitKeyUp("Shift");
    }
    updateIcon();
    updateSlideEnabled(isActive);
  };

  fastForwardBtn.addEventListener("click", (event) => {
    event?.preventDefault?.();
    setRunMode(!isActive);
  });

  // ensure initial state
  setRunMode(false);
}
