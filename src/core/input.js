export class Input {
  constructor() {
    this.keys = new Set();

    window.addEventListener("keydown", (event) => this.keys.add(event.key));
    window.addEventListener("keyup", (event) => this.keys.delete(event.key));
  }

  isDown(key) {
    return this.keys.has(key);
  }
}
