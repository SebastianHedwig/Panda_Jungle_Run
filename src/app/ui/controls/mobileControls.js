const FAST_FORWARD_ACTIVE_SRC =
  "./assets/icons/mobileControls/button-fast-forward.active.png";
const FAST_FORWARD_INACTIVE_SRC =
  "./assets/icons/mobileControls/button-fast-forward-inactive.png";

/**
 * Emit key event.
 * Uses type, key to perform the operation.
 * @param {string} type Type.
 * @param {string} key Key.
 * @returns {*} Result value.
 */
const emitKeyEvent = (type, key) =>
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
/**
 * Emit key down.
 * Uses key to perform the operation.
 * @param {string} key Key.
 * @returns {*} Result value.
 */
const emitKeyDown = (key) => emitKeyEvent("keydown", key);
/**
 * Emit key up.
 * Uses key to perform the operation.
 * @param {string} key Key.
 * @returns {*} Result value.
 */
const emitKeyUp = (key) => emitKeyEvent("keyup", key);

/**
 * Prevent context menu.
 * Binds contextmenu event listeners.
 * @param {*} buttons Buttons.
 */
const preventContextMenu = (buttons) => {
  buttons.forEach((btn) =>
    btn.addEventListener("contextmenu", (event) => event.preventDefault())
  );
};

/**
 * Returns pointer id.
 * Uses event to compute the result.
 * @param {Event} event Event object.
 * @returns {*} Pointer id.
 */
const getPointerId = (event) => event?.pointerId;

/**
 * Track pointer press.
 * Uses activePointers, pointerId to perform the operation.
 * @param {*} activePointers Active pointers.
 * @param {string} pointerId Pointer element id.
 * @returns {*} Result value.
 */
const trackPointerPress = (activePointers, pointerId) => {
  if (pointerId == null) return true;
  if (activePointers.has(pointerId)) return false;
  activePointers.add(pointerId);
  return activePointers.size === 1;
};

/**
 * Track pointer release.
 * Uses activePointers, pointerId to perform the operation.
 * @param {*} activePointers Active pointers.
 * @param {string} pointerId Pointer element id.
 * @returns {*} Result value.
 */
const trackPointerRelease = (activePointers, pointerId) => {
  if (pointerId == null) return true;
  if (!activePointers.has(pointerId)) return false;
  activePointers.delete(pointerId);
  return activePointers.size === 0;
};

/**
 * Creates press handler.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.activePointers] Active pointers.
 * @param {string} [options.key] Key.
 * @returns {*} Press handler.
 */
const createPressHandler = ({ activePointers, key }) => (event) => {
  event?.preventDefault?.();
  const pointerId = getPointerId(event);
  const shouldEmit = trackPointerPress(activePointers, pointerId);
  if (shouldEmit) emitKeyDown(key);
};

/**
 * Creates release handler.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.activePointers] Active pointers.
 * @param {string} [options.key] Key.
 * @returns {*} Release handler.
 */
const createReleaseHandler = ({ activePointers, key }) => (event) => {
  const pointerId = getPointerId(event);
  const shouldEmit = trackPointerRelease(activePointers, pointerId);
  if (shouldEmit) emitKeyUp(key);
};

/**
 * Creates cancel handler.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.activePointers] Active pointers.
 * @param {string} [options.key] Key.
 * @returns {*} Cancel handler.
 */
const createCancelHandler = ({ activePointers, key }) => () => {
  if (activePointers.size === 0) return;
  activePointers.clear();
  emitKeyUp(key);
};

/**
 * Binds pointer listeners.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLElement} [options.button] Button.
 * @param {*} [options.press] Press.
 * @param {*} [options.release] Release.
 * @param {boolean} [options.cancelAll] Cancel all.
 */
const bindPointerListeners = ({ button, press, release, cancelAll }) => {
  button.addEventListener("pointerdown", (event) => {
    button.setPointerCapture?.(event.pointerId);
    press(event);
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", cancelAll);
};

/**
 * Binds hold.
 * Uses button, key to perform the operation.
 * @param {HTMLElement} button Button.
 * @param {string} key Key.
 */
function bindHold(button, key) {
  if (!button) return;
  const activePointers = new Set();
  const press = createPressHandler({ activePointers, key });
  const release = createReleaseHandler({ activePointers, key });
  const cancelAll = createCancelHandler({ activePointers, key });
  bindPointerListeners({ button, press, release, cancelAll });
}

/**
 * Find button by control.
 * Uses control to perform the operation.
 * @param {*} control Control.
 * @returns {*} Result value.
 */
const findButtonByControl = (control) =>
  document.querySelector(`.mobile-control-button[data-control="${control}"]`);

/**
 * Returns move buttons.
 * @returns {*} Move buttons.
 */
const getMoveButtons = () => ({
  btnLeft: findButtonByControl("left"),
  btnRight: findButtonByControl("right"),
});

/**
 * Returns action buttons.
 * @returns {*} Action buttons.
 */
const getActionButtons = () => ({
  btnJump: findButtonByControl("jump"),
  btnAttack: findButtonByControl("attack"),
  btnSlide: findButtonByControl("slide"),
});

/**
 * Returns fast forward button.
 * @returns {*} Fast forward button.
 */
const getFastForwardButton = () => findButtonByControl("fast-forward");

/**
 * Returns mobile buttons.
 * Resolves DOM elements from the document.
 * @returns {Object} Mobile buttons.
 */
const getMobileButtons = () => {
  const allButtons = document.querySelectorAll(".mobile-control-button");
  const { btnLeft, btnRight } = getMoveButtons();
  const { btnJump, btnAttack, btnSlide } = getActionButtons();
  const fastForwardBtn = getFastForwardButton();
  return { allButtons, btnLeft, btnRight, btnJump, btnAttack, btnSlide, fastForwardBtn };
};

/**
 * Binds movement controls.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {number} [options.btnLeft] Btn left.
 * @param {number} [options.btnRight] Btn right.
 */
const bindMovementControls = ({ btnLeft, btnRight }) => {
  bindHold(btnLeft, "ArrowLeft");
  bindHold(btnRight, "ArrowRight");
};

/**
 * Binds action controls.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.btnJump] Btn jump.
 * @param {*} [options.btnAttack] Btn attack.
 * @param {*} [options.btnSlide] Btn slide.
 */
const bindActionControls = ({ btnJump, btnAttack, btnSlide }) => {
  bindHold(btnJump, " ");
  bindHold(btnAttack, "Enter");
  bindHold(btnSlide, "ArrowDown");
};

/**
 * Creates slide enabled.
 * Uses btnSlide to compute the result.
 * @param {*} btnSlide Btn slide.
 * @returns {*} Slide enabled.
 */
const createSlideEnabled = (btnSlide) => (enabled) => {
  if (!btnSlide) return;
  btnSlide.classList.toggle("mobile-control-button--disabled", !enabled);
};

/**
 * Returns fast forward assets.
 * Resolves DOM elements from the document.
 * @param {*} fastForwardBtn Fast forward btn.
 * @returns {Object} Fast forward assets.
 */
const getFastForwardAssets = (fastForwardBtn) => {
  const icon = fastForwardBtn.querySelector("img");
  const srcActive = fastForwardBtn.dataset.srcActive || FAST_FORWARD_ACTIVE_SRC;
  const srcInactive = fastForwardBtn.dataset.srcInactive || FAST_FORWARD_INACTIVE_SRC;
  return { icon, srcActive, srcInactive };
};

/**
 * Updates fast forward icon.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLImageElement} [options.icon] Icon.
 * @param {boolean} [options.isActive] Whether active.
 * @param {boolean} [options.srcActive] Src active.
 * @param {boolean} [options.srcInactive] Src inactive.
 */
const updateFastForwardIcon = ({ icon, isActive, srcActive, srcInactive }) => {
  if (!icon) return;
  icon.src = isActive ? srcActive : srcInactive;
};

/**
 * Applies run mode.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {boolean} [options.isActive] Whether active.
 * @param {HTMLImageElement} [options.updateIcon] Update icon.
 * @param {boolean} [options.updateSlideEnabled] Update slide enabled.
 */
const applyRunMode = ({ isActive, updateIcon, updateSlideEnabled }) => {
  if (isActive) {
    emitKeyDown("Shift");
  } else {
    emitKeyUp("Shift");
  }
  updateIcon();
  updateSlideEnabled(isActive);
};

/**
 * Creates run mode controller.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {HTMLImageElement} [options.icon] Icon.
 * @param {boolean} [options.srcActive] Src active.
 * @param {boolean} [options.srcInactive] Src inactive.
 * @param {boolean} [options.updateSlideEnabled] Update slide enabled.
 */
const createRunModeController = ({ icon, srcActive, srcInactive, updateSlideEnabled }) => {
  let isActive = false;
  /**
   * Updates icon.
   * @returns {*} Result value.
   */
  const updateIcon = () => updateFastForwardIcon({ icon, isActive, srcActive, srcInactive });
  /**
   * Sets run mode.
   * Uses active to perform the operation.
   * @param {boolean} active Active.
   */
  const setRunMode = (active) => {
    isActive = !!active;
    applyRunMode({ isActive, updateIcon, updateSlideEnabled });
  };
  /**
   * Toggles run mode.
   * @returns {*} Result value.
   */
  const toggleRunMode = () => setRunMode(!isActive);
  return { setRunMode, toggleRunMode };
};

/**
 * Binds fast forward click.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.fastForwardBtn] Fast forward btn.
 * @param {HTMLElement} [options.toggleRunMode] Toggle run mode.
 */
const bindFastForwardClick = ({ fastForwardBtn, toggleRunMode }) => {
  fastForwardBtn.addEventListener("click", (event) => {
    event?.preventDefault?.();
    toggleRunMode();
  });
};

/**
 * Sets up fast forward.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.fastForwardBtn] Fast forward btn.
 * @param {boolean} [options.updateSlideEnabled] Update slide enabled.
 */
const setupFastForward = ({ fastForwardBtn, updateSlideEnabled }) => {
  if (!fastForwardBtn) return;
  const { icon, srcActive, srcInactive } = getFastForwardAssets(fastForwardBtn);
  const { setRunMode, toggleRunMode } = createRunModeController({ icon, srcActive, srcInactive, updateSlideEnabled });
  bindFastForwardClick({ fastForwardBtn, toggleRunMode });
  setRunMode(false);
};

/**
 * Sets up mobile controls.
 */
export function setupMobileControls() {
  const { allButtons, btnLeft, btnRight, btnJump, btnAttack, btnSlide, fastForwardBtn } = getMobileButtons();
  preventContextMenu(allButtons);
  bindMovementControls({ btnLeft, btnRight });
  bindActionControls({ btnJump, btnAttack, btnSlide });
  const updateSlideEnabled = createSlideEnabled(btnSlide);
  setupFastForward({ fastForwardBtn, updateSlideEnabled });
}
