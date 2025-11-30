export class Input {
  constructor() {
    this.keysDown = new Set();     // dauerhaft gedrückt
    this.keysPressed = new Set();  // nur im Frame des Keydowns

    window.addEventListener("keydown", (event) => {
      if (!this.keysDown.has(event.key)) {
        this.keysPressed.add(event.key); // einmalig triggern
      }
      this.keysDown.add(event.key);
    });

    window.addEventListener("keyup", (event) => {
      this.keysDown.delete(event.key);
    });
  }

  /** Taste wird gehalten */
  isDown(key) {
    return this.keysDown.has(key);
  }

  /** Taste wurde in diesem Frame gedrückt */
  isPressed(key) {
    return this.keysPressed.has(key);
  }

  /** Am Ende des Frames aufrufen */
  endFrame() {
    this.keysPressed.clear();
  }
}
