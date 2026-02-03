const FAST_FORWARD_ACTIVE_SRC =
  "./assets/icons/mobileControls/button-fast-forward.active.png";
const FAST_FORWARD_INACTIVE_SRC =
  "./assets/icons/mobileControls/button-fast-forward-inactive.png";

const emitKeyEvent = (type, key) =>
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
const emitKeyDown = (key) => emitKeyEvent("keydown", key);
const emitKeyUp = (key) => emitKeyEvent("keyup", key);

const preventContextMenu = (buttons) => {
  buttons.forEach((btn) =>
    btn.addEventListener("contextmenu", (event) => event.preventDefault())
  );
};

const getPointerId = (event) => event?.pointerId;

const trackPointerPress = (activePointers, pointerId) => {
  if (pointerId == null) return true;
  if (activePointers.has(pointerId)) return false;
  activePointers.add(pointerId);
  return activePointers.size === 1;
};

const trackPointerRelease = (activePointers, pointerId) => {
  if (pointerId == null) return true;
  if (!activePointers.has(pointerId)) return false;
  activePointers.delete(pointerId);
  return activePointers.size === 0;
};

const createPressHandler = ({ activePointers, key }) => (event) => {
  event?.preventDefault?.();
  const pointerId = getPointerId(event);
  const shouldEmit = trackPointerPress(activePointers, pointerId);
  if (shouldEmit) emitKeyDown(key);
};

const createReleaseHandler = ({ activePointers, key }) => (event) => {
  const pointerId = getPointerId(event);
  const shouldEmit = trackPointerRelease(activePointers, pointerId);
  if (shouldEmit) emitKeyUp(key);
};

const createCancelHandler = ({ activePointers, key }) => () => {
  if (activePointers.size === 0) return;
  activePointers.clear();
  emitKeyUp(key);
};

const bindPointerListeners = ({ button, press, release, cancelAll }) => {
  button.addEventListener("pointerdown", (event) => {
    button.setPointerCapture?.(event.pointerId);
    press(event);
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", cancelAll);
};

function bindHold(button, key) {
  if (!button) return;
  const activePointers = new Set();
  const press = createPressHandler({ activePointers, key });
  const release = createReleaseHandler({ activePointers, key });
  const cancelAll = createCancelHandler({ activePointers, key });
  bindPointerListeners({ button, press, release, cancelAll });
}

const findButtonByControl = (control) =>
  document.querySelector(`.mobile-control-button[data-control="${control}"]`);

const getMoveButtons = () => ({
  btnLeft: findButtonByControl("left"),
  btnRight: findButtonByControl("right"),
});

const getActionButtons = () => ({
  btnJump: findButtonByControl("jump"),
  btnAttack: findButtonByControl("attack"),
  btnSlide: findButtonByControl("slide"),
});

const getFastForwardButton = () => findButtonByControl("fast-forward");

const getMobileButtons = () => {
  const allButtons = document.querySelectorAll(".mobile-control-button");
  const { btnLeft, btnRight } = getMoveButtons();
  const { btnJump, btnAttack, btnSlide } = getActionButtons();
  const fastForwardBtn = getFastForwardButton();
  return { allButtons, btnLeft, btnRight, btnJump, btnAttack, btnSlide, fastForwardBtn };
};

const bindMovementControls = ({ btnLeft, btnRight }) => {
  bindHold(btnLeft, "ArrowLeft");
  bindHold(btnRight, "ArrowRight");
};

const bindActionControls = ({ btnJump, btnAttack, btnSlide }) => {
  bindHold(btnJump, " ");
  bindHold(btnAttack, "Enter");
  bindHold(btnSlide, "ArrowDown");
};

const createSlideEnabled = (btnSlide) => (enabled) => {
  if (!btnSlide) return;
  btnSlide.classList.toggle("mobile-control-button--disabled", !enabled);
};

const getFastForwardAssets = (fastForwardBtn) => {
  const icon = fastForwardBtn.querySelector("img");
  const srcActive = fastForwardBtn.dataset.srcActive || FAST_FORWARD_ACTIVE_SRC;
  const srcInactive = fastForwardBtn.dataset.srcInactive || FAST_FORWARD_INACTIVE_SRC;
  return { icon, srcActive, srcInactive };
};

const updateFastForwardIcon = ({ icon, isActive, srcActive, srcInactive }) => {
  if (!icon) return;
  icon.src = isActive ? srcActive : srcInactive;
};

const applyRunMode = ({ isActive, updateIcon, updateSlideEnabled }) => {
  if (isActive) {
    emitKeyDown("Shift");
  } else {
    emitKeyUp("Shift");
  }
  updateIcon();
  updateSlideEnabled(isActive);
};

const createRunModeController = ({ icon, srcActive, srcInactive, updateSlideEnabled }) => {
  let isActive = false;
  const updateIcon = () => updateFastForwardIcon({ icon, isActive, srcActive, srcInactive });
  const setRunMode = (active) => {
    isActive = !!active;
    applyRunMode({ isActive, updateIcon, updateSlideEnabled });
  };
  const toggleRunMode = () => setRunMode(!isActive);
  return { setRunMode, toggleRunMode };
};

const bindFastForwardClick = ({ fastForwardBtn, toggleRunMode }) => {
  fastForwardBtn.addEventListener("click", (event) => {
    event?.preventDefault?.();
    toggleRunMode();
  });
};

const setupFastForward = ({ fastForwardBtn, updateSlideEnabled }) => {
  if (!fastForwardBtn) return;
  const { icon, srcActive, srcInactive } = getFastForwardAssets(fastForwardBtn);
  const { setRunMode, toggleRunMode } = createRunModeController({ icon, srcActive, srcInactive, updateSlideEnabled });
  bindFastForwardClick({ fastForwardBtn, toggleRunMode });
  setRunMode(false);
};

export function setupMobileControls() {
  const { allButtons, btnLeft, btnRight, btnJump, btnAttack, btnSlide, fastForwardBtn } = getMobileButtons();
  preventContextMenu(allButtons);
  bindMovementControls({ btnLeft, btnRight });
  bindActionControls({ btnJump, btnAttack, btnSlide });
  const updateSlideEnabled = createSlideEnabled(btnSlide);
  setupFastForward({ fastForwardBtn, updateSlideEnabled });
}
