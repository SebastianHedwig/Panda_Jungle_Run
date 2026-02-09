import { Platform } from "./platform.class.js";

export class PlatformBuilder {
  /**
   * Creates a new instance.
   * Used to set up required data for platform collision handling.
   * Advances animation state and sprites.
   * @param {Platform} platformArray Platform array.
   * @param {*} sprites Sprites.
   */
  constructor(platformArray, sprites) {
    this.platforms = platformArray;
    this.sprites = sprites;
    this.startLongOffset = 40;
  }

  /* ============================================================
     BASE CALL – inserts ONE platform
     ============================================================ */

  /**
   * Adds.
   * Used to support platform collision handling.
   * Advances animation state and sprites.
   * @param {string} type Type.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  add(type, x, y) {
    const img = this.sprites[type];
    this.platforms.push(new Platform(img, x, y, type));
    return img.width;
  }

  /* ============================================================
     PLATFORM PARTS (manual level building)
     ============================================================ */

  /**
   * Starts long.
   * Used to support platform collision handling.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  startLong(x, y)  { return this.add("startLong", x + this.startLongOffset, y); }
  /**
   * Middle long.
   * Used to support platform collision handling.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  middleLong(x, y) { return this.add("middleLong", x, y); }
  /**
   * End long.
   * Used to support platform collision handling.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  endLong(x, y)    { return this.add("endLong", x, y); }
  /**
   * Starts short.
   * Used to support platform collision handling.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  startShort(x, y) { return this.add("startShort", x, y); }
  /**
   * Middle short.
   * Used to support platform collision handling.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  middleShort(x, y) { return this.add("middleShort", x, y); }
  /**
   * End short.
   * Used to support platform collision handling.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  endShort(x, y) { return this.add("endShort", x, y); }
  /**
   * Small.
   * Used to support platform collision handling.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  small(x, y) { return this.add("small", x, y); }
  /**
   * Filler.
   * Used to support platform collision handling.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  filler(x, y) { return this.add("filler", x, y); }

  /* ============================================================
     FREE ROWS – only middle elements
     ============================================================ */

  /**
   * Row.
   * Used to support platform collision handling.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {number} count Count.
   * @param {string} type Type.
   * @returns {*} Result value.
   */
  row(x, y, count, type) {
    let offset = 0;
    for (let segmentIndex = 0; segmentIndex < count; segmentIndex++) {
      offset = this.addRowSegment(type, x, y, offset);
    }
    return offset;
  }

  /**
   * Adds row segment.
   * Used to support platform collision handling.
   * @param {string} type Type.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {number} offset Offset.
   * @returns {*} Result value.
   */
  addRowSegment(type, x, y, offset) {
    return offset + this.add(type, x + offset, y);
  }

  /**
   * Stack filler. If omitted, default values are used.
   * Used to support platform collision handling.
   * Advances animation state and sprites.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} [rows] Rows.
   * @param {number} [count] Count.
   * @param {number} width Width.
   */
  stackFiller(x, y, rows = 1, count = 1, width) {
    const fillerHeight = this.sprites.filler.height;
    for (let columnIndex = 0; columnIndex < count; columnIndex++) {
      this.stackFillerColumn(x, y, columnIndex, rows, width, fillerHeight);
    }
  }

  /**
   * Stack filler column.
   * Used to support platform collision handling.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {number} columnIndex Column index.
   * @param {*} rows Rows.
   * @param {number} width Width.
   * @param {number} fillerHeight Filler height.
   */
  stackFillerColumn(x, y, columnIndex, rows, width, fillerHeight) {
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      this.filler(x + columnIndex * width, y + (rowIndex + 1) * fillerHeight);
    }
  }

  /* ============================================================
     PREBUILT SEGMENTS – level building
     ============================================================ */

  /**
   * Island small.
   * Used to support platform collision handling.
   * @param {number} x X.
   * @param {number} y Y.
   */
  islandSmall(x, y) {
    this.small(x, y);
  }


  /**
   * Stair up. If omitted, default values are used.
   * Used to support platform collision handling.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} [steps] Steps.
   * @param {number} [stepHeight] Step height.
   * @param {string} [type] Type.
   */
  stairUp(x, y, steps = 3, stepHeight = 40, type = "middleLong") {
    let offset = 0;
    for (let stepIndex = 0; stepIndex < steps; stepIndex++) {
      offset = this.addStairStep(type, x, y, offset, stepIndex, -stepHeight);
    }
  }

  /**
   * Stair down. If omitted, default values are used.
   * Used to support platform collision handling.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} [steps] Steps.
   * @param {number} [stepHeight] Step height.
   * @param {string} [type] Type.
   */
  stairDown(x, y, steps = 3, stepHeight = 40, type = "middleLong") {
    let offset = 0;
    for (let stepIndex = 0; stepIndex < steps; stepIndex++) {
      offset = this.addStairStep(type, x, y, offset, stepIndex, stepHeight);
    }
  }

  /**
   * Adds stair step.
   * Used to support platform collision handling.
   * @param {string} type Type.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {number} offset Offset.
   * @param {number} stepIndex Step index.
   * @param {number} stepHeight Step height.
   * @returns {*} Result value.
   */
  addStairStep(type, x, y, offset, stepIndex, stepHeight) {
    return offset + this.add(type, x + offset, y + stepIndex * stepHeight);
  }
}
