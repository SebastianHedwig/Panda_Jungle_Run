export class Input {
  /**
   * Creates a new instance.
   * Reads input state to decide actions.
   * Updates the instance state.
   */
  constructor() {
    this.keysDown = new Set();
    this.keysPressed = new Set();
    this.bindKeyListeners();
  }

  /**
   * Binds key listeners.
   * Binds keydown, keyup event listeners.
   * Updates the instance state.
   */
  bindKeyListeners() {
    window.addEventListener("keydown", (event) => this.handleKeyDown(event));
    window.addEventListener("keyup", (event) => this.handleKeyUp(event));
  }

  /**
   * Returns normalized key.
   * Normalizes keyboard input for consistent handling.
   * @param {Event} event Event object.
   * @returns {*} Normalized key.
   */
  getNormalizedKey(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  /**
   * Handles key down.
   * Reads input state to decide actions.
   * Updates the instance state.
   * @param {Event} event Event object.
   */
  handleKeyDown(event) {
    const key = this.getNormalizedKey(event);
    if (!this.keysDown.has(key)) {
      this.keysPressed.add(key);
    }
    this.keysDown.add(key);
  }

  /**
   * Handles key up.
   * Reads input state to decide actions.
   * Updates the instance state.
   * @param {Event} event Event object.
   */
  handleKeyUp(event) {
    const key = this.getNormalizedKey(event);
    this.keysDown.delete(key);
  }

  /**
   * Is down.
   * Reads input state to decide actions.
   * Updates the instance state.
   * @param {string} key Key.
   * @returns {boolean} Whether down.
   */
  isDown(key) {
    return this.keysDown.has(key);
  }

  /**
   * Is pressed.
   * Reads input state to decide actions.
   * Updates the instance state.
   * @param {string} key Key.
   * @returns {boolean} Whether pressed.
   */
  isPressed(key) {
    return this.keysPressed.has(key);
  }

  /**
   * End frame.
   * Reads input state to decide actions.
   * Updates the instance state.
   */
  endFrame() {
    this.keysPressed.clear();
  }
}
