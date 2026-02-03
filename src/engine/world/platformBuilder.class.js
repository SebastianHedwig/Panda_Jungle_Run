import { Platform } from "./platform.class.js";

export class PlatformBuilder {
  constructor(platformArray, sprites) {
    this.platforms = platformArray;
    this.sprites = sprites;
    this.startLongOffset = 40;
  }

  /* ============================================================
     BASE CALL – inserts ONE platform
     ============================================================ */

  add(type, x, y) {
    const img = this.sprites[type];
    this.platforms.push(new Platform(img, x, y, type));
    return img.width;
  }

  /* ============================================================
     PLATFORM PARTS (manual level building)
     ============================================================ */

  startLong(x, y)  { return this.add("startLong", x + this.startLongOffset, y); }
  middleLong(x, y) { return this.add("middleLong", x, y); }
  endLong(x, y)    { return this.add("endLong", x, y); }
  startShort(x, y) { return this.add("startShort", x, y); }
  middleShort(x, y) { return this.add("middleShort", x, y); }
  endShort(x, y) { return this.add("endShort", x, y); }
  small(x, y) { return this.add("small", x, y); }
  filler(x, y) { return this.add("filler", x, y); }

  /* ============================================================
     FREE ROWS – only middle elements
     ============================================================ */

  row(x, y, count, type) {
    let offset = 0;
    for (let segmentIndex = 0; segmentIndex < count; segmentIndex++) {
      offset = this.addRowSegment(type, x, y, offset);
    }
    return offset;
  }

  addRowSegment(type, x, y, offset) {
    return offset + this.add(type, x + offset, y);
  }

  stackFiller(x, y, rows = 1, count = 1, width) {
    const fillerHeight = this.sprites.filler.height;
    for (let columnIndex = 0; columnIndex < count; columnIndex++) {
      this.stackFillerColumn(x, y, columnIndex, rows, width, fillerHeight);
    }
  }

  stackFillerColumn(x, y, columnIndex, rows, width, fillerHeight) {
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      this.filler(x + columnIndex * width, y + (rowIndex + 1) * fillerHeight);
    }
  }

  /* ============================================================
     PREBUILT SEGMENTS – level building
     ============================================================ */

  islandSmall(x, y) {
    this.small(x, y);
  }


  stairUp(x, y, steps = 3, stepHeight = 40, type = "middleLong") {
    let offset = 0;
    for (let stepIndex = 0; stepIndex < steps; stepIndex++) {
      offset = this.addStairStep(type, x, y, offset, stepIndex, -stepHeight);
    }
  }

  stairDown(x, y, steps = 3, stepHeight = 40, type = "middleLong") {
    let offset = 0;
    for (let stepIndex = 0; stepIndex < steps; stepIndex++) {
      offset = this.addStairStep(type, x, y, offset, stepIndex, stepHeight);
    }
  }

  addStairStep(type, x, y, offset, stepIndex, stepHeight) {
    return offset + this.add(type, x + offset, y + stepIndex * stepHeight);
  }
}
