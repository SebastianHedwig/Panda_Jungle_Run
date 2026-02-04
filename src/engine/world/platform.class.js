const SIDE_TRIMS = {
  small:       { left: 0.25, right: 0.25 },
  startLong:   { left: 0.10, right: 0.10 },
  middleLong:  { left: 0.045, right: 0.045 },
  endLong:     { left: 0.10, right: 0.10 },
  startShort:  { left: 0.08, right: 0.04 },
  middleShort: { left: 0.12, right: 0.12 },
  endShort:    { left: 0.04, right: 0.08 },
  filler:      { left: 0.08, right: 0.08 },
};

const DEFAULT_SIDE_TRIM = { left: 0.045, right: 0.045 };

const CORNER_CUTS = {
  small:     { left: 0.5, right: 0.5 },
  startLong: { left: 0.5, right: 0.0 },
  endLong:   { left: 0.0, right: 0.5 },
};

const DEFAULT_CORNER_CUT = { left: 0, right: 0 };

const FULL_RATIO = 1; // 100% of the dimension
const SIDE_WALL_GAP_RATIO = 0.30; // 30% of the collider height

export class Platform {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Updates the instance state.
   * @param {HTMLImageElement} image Image.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {string} [type] Type.
   */
  constructor(image, x, y, type = "generic") {
    this.img = image;
    this.x = x;
    this.y = y;
    this.type = type;

    this.setDimensions(image);
    this.setDefaults(type);
    this.applySideTrims(type);
    this.applyCornerCuts(type);
    this.calculateCollider();
    this.calculateCollisionBounds();
  }

  /**
   * Sets dimensions.
   * Updates the instance state.
   * @param {HTMLImageElement} image Image.
   */
  setDimensions(image) {
    this.width = image.width;
    this.height = image.height;
  }

  /**
   * Sets defaults.
   * Updates the instance state.
   * @param {string} type Type.
   */
  setDefaults(type) {
    this.decorRatio = 0.32;
    this.bottomTrim = 0.3;
    this.supportsLanding = type !== "filler";
    this.hasSideWalls = true;
  }

  /**
   * Applies side trims.
   * Updates the instance state.
   * @param {string} type Type.
   */
  applySideTrims(type) {
    const trims = SIDE_TRIMS[type] || DEFAULT_SIDE_TRIM;
    this.sideTrimLeft = trims.left;
    this.sideTrimRight = trims.right;
  }

  /**
   * Applies corner cuts.
   * Updates the instance state.
   * @param {string} type Type.
   */
  applyCornerCuts(type) {
    const cuts = CORNER_CUTS[type] || DEFAULT_CORNER_CUT;
    this.cornerCutLeft = cuts.left;
    this.cornerCutRight = cuts.right;
  }

  /**
   * Calculates collider.
   * Updates the instance state.
   */
  calculateCollider() {
    this.colliderOffset = Math.floor(this.height * this.decorRatio);
    this.colliderHeight = Math.floor(this.height * (FULL_RATIO - this.decorRatio - this.bottomTrim));
    this.colliderWidth = Math.floor(this.width * (FULL_RATIO - this.sideTrimLeft - this.sideTrimRight));
    this.sideWallGap = Math.floor(this.colliderHeight * SIDE_WALL_GAP_RATIO);
  }

  /**
   * Calculates collision bounds.
   * Updates the instance state.
   */
  calculateCollisionBounds() {
    this.top = this.y + this.colliderOffset;
    this.bottom = this.top + this.colliderHeight;
    this.left = this.x + Math.floor(this.width * this.sideTrimLeft);
    this.right = this.left + this.colliderWidth;
  }

  /**
   * Rect.
   * Updates the instance state.
   * @returns {Object} Result value.
   */
  get rect() {
    return {
      x: this.left,
      y: this.top,
      width: this.colliderWidth,
      height: this.colliderHeight,
    };
  }

  /**
   * Renders.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {import("./camera.class.js").Camera} camera Camera instance.
   */
  render(ctx, camera) {
    ctx.drawImage(
      this.img,
      this.x - camera.x,
      this.y - camera.y,
      this.width,
      this.height
    );
  }
}
