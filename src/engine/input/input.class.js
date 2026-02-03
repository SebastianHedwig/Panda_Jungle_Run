export class Input {
  constructor() {
    this.keysDown = new Set();
    this.keysPressed = new Set();
    this.bindKeyListeners();
  }

  bindKeyListeners() {
    window.addEventListener("keydown", (event) => this.handleKeyDown(event));
    window.addEventListener("keyup", (event) => this.handleKeyUp(event));
  }

  getNormalizedKey(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  handleKeyDown(event) {
    const key = this.getNormalizedKey(event);
    if (!this.keysDown.has(key)) {
      this.keysPressed.add(key);
    }
    this.keysDown.add(key);
  }

  handleKeyUp(event) {
    const key = this.getNormalizedKey(event);
    this.keysDown.delete(key);
  }

  isDown(key) {
    return this.keysDown.has(key);
  }

  isPressed(key) {
    return this.keysPressed.has(key);
  }

  endFrame() {
    this.keysPressed.clear();
  }
}
