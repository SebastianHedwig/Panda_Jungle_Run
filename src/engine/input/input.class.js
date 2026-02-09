export class Input {
  /**
   * Creates a new instance.
   * Reads input state to decide actions.
   */
  constructor() {
    this.keysDown = new Set();
    this.keysPressed = new Set();
    this.bindKeyListeners();
  }

  /**
   * Binds key listeners.
   * Binds keydown, keyup event listeners.
   */
  bindKeyListeners() {
    window.addEventListener("keydown", (event) => this.handleKeyDown(event));
    window.addEventListener("keyup", (event) => this.handleKeyUp(event));
  }

  /**
   * Returns normalized key.
   * Used to provide normalized key for UI interaction handling.
   * Normalizes keyboard input for consistent handling.
   * @param {Event} event Event object.
   * @returns {*} Normalized key.
   */
  getNormalizedKey(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  /**
   * Handles key down.
   * Used to centralize a specific behavior for UI interaction handling.
   * Reads input state to decide actions.
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
   * Used to centralize a specific behavior for UI interaction handling.
   * Reads input state to decide actions.
   * @param {Event} event Event object.
   */
  handleKeyUp(event) {
    const key = this.getNormalizedKey(event);
    this.keysDown.delete(key);
  }

  /**
   * Is down.
   * Used to decide UI hit testing outcomes.
   * Reads input state to decide actions.
   * @param {string} key Key.
   * @returns {boolean} Whether down.
   */
  isDown(key) {
    return this.keysDown.has(key);
  }

  /**
   * Is pressed.
   * Used to decide UI hit testing outcomes.
   * Reads input state to decide actions.
   * @param {string} key Key.
   * @returns {boolean} Whether pressed.
   */
  isPressed(key) {
    return this.keysPressed.has(key);
  }

  /**
   * End frame.
   * Reads input state to decide actions.
   */
  endFrame() {
    this.keysPressed.clear();
  }
}
