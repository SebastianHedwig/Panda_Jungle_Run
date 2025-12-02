import { Platform } from "./platform.class.js";

export class PlatformBuilder {
  constructor(platformArray, sprites) {
    this.platforms = platformArray;
    this.sprites = sprites;
  }

  /* ============================================================
     BASIS-CALL – fügt EINE Plattform ein
     ============================================================ */

  add(type, x, y) {
    const img = this.sprites[type];
    this.platforms.push(new Platform(img, x, y, type));
    return img.width;
  }

  /* ============================================================
     PRIMITIVE PLATTFORM TEILE (Manuelles Levelbuilding)
     ============================================================ */

  startLong(x, y)  { return this.add("startLong", x + 40, y); }
  middleLong(x, y) { return this.add("middleLong", x, y); }
  endLong(x, y)    { return this.add("endLong", x, y); }
  startShort(x, y)  { return this.add("startShort", x, y); }
  middleShort(x, y) { return this.add("middleShort", x, y); }
  endShort(x, y)    { return this.add("endShort", x, y); }
  small(x, y)  { return this.add("small", x, y); }
  filler(x, y) { return this.add("filler", x, y); }

  /* ============================================================
     FREIE REIHEN – nur Middle-Elemente
     ============================================================ */

  row(x, y, count, type) {
    let offset = 0;
    for (let i = 0; i < count; i++) {
      offset += this.add(type, x + offset, y);
    }
    return offset;
  }

  stackFiller(x, y, rows = 1, count = 1, width) {
    const h = this.sprites.filler.height;
    for (let c = 0; c < count; c++) {
      for (let r = 0; r < rows; r++) {
        this.filler(x + c * width, y + (r + 1) * h);
      }
    }
  }

  /* ============================================================
     VORGEFERTIGTE SEGMENTE – Levelbuilding in Sekunden
     ============================================================ */

  islandSmall(x, y) {
    this.small(x, y);
  }


  stairUp(x, y, steps = 3, h = 40, type = "middleLong") {
    let offset = 0;
    for (let i = 0; i < steps; i++) {
      offset += this.add(type, x + offset, y - i * h);
    }
  }

  stairDown(x, y, steps = 3, h = 40, type = "middleLong") {
    let offset = 0;
    for (let i = 0; i < steps; i++) {
      offset += this.add(type, x + offset, y + i * h);
    }
  }
}
