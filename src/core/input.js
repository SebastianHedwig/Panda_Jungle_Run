export class Input {
  constructor() {
    this.keysDown = new Set();
    this.keysPressed = new Set();

    window.addEventListener("keydown", (event) => {
      if (!this.keysDown.has(event.key)) {
        this.keysPressed.add(event.key);
      }
      this.keysDown.add(event.key);
    });

    window.addEventListener("keyup", (event) => {
      this.keysDown.delete(event.key);
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
