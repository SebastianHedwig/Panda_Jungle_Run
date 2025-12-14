export class Input {
  constructor() {
    this.keysDown = new Set();
    this.keysPressed = new Set();

    window.addEventListener("keydown", (event) => {
      const key =
        event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (!this.keysDown.has(key)) {
        this.keysPressed.add(key);
      }
      this.keysDown.add(key);
    });

    window.addEventListener("keyup", (event) => {
      const key =
        event.key.length === 1 ? event.key.toLowerCase() : event.key;
      this.keysDown.delete(key);
    });
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
