export class Platform {
  constructor(image, x, y, type = "generic") {
    this.img = image;
    this.x = x;
    this.y = y;

    this.width = image.width;
    this.height = image.height;

    this.decorRatio = 0.32;
    this.bottomTrim = 0.3;
    this.supportsLanding = type !== "filler";
    this.hasSideWalls = true;

    const typeSideTrims = {
      small:       { left: 0.25, right: 0.25 },
      startLong:   { left: 0.10, right: 0.10 },
      middleLong:  { left: 0.045, right: 0.045 },
      endLong:     { left: 0.10, right: 0.10 },
      startShort:  { left: 0.08, right: 0.04 },
      middleShort: { left: 0.06, right: 0.06 },
      endShort:    { left: 0.04, right: 0.08 },
      filler:      { left: 0.045, right: 0.045 }
    };
    const trims = typeSideTrims[type] || { left: 0.045, right: 0.045 };
    this.sideTrimLeft = trims.left;
    this.sideTrimRight = trims.right;

    const typeCornerCuts = {
      small:     { left: 0.5, right: 0.5 },
      startLong: { left: 0.5, right: 0.0 },
      endLong:   { left: 0.0, right: 0.5 },
    };
    const cuts = typeCornerCuts[type] || { left: 0, right: 0 };
    this.cornerCutLeft = cuts.left;
    this.cornerCutRight = cuts.right;

    this.colliderOffset = Math.floor(this.height * this.decorRatio);
    this.colliderHeight = Math.floor(
      this.height * (1 - this.decorRatio - this.bottomTrim)
    );
    this.colliderWidth = Math.floor(
      this.width * (1 - this.sideTrimLeft - this.sideTrimRight)
    );

    this.sideWallGap = Math.floor(this.colliderHeight * 0.30);

    this.top = this.y + this.colliderOffset;
    this.bottom = this.top + this.colliderHeight;
    this.left = this.x + Math.floor(this.width * this.sideTrimLeft);
    this.right = this.left + this.colliderWidth;
  }

  get rect() {
    return {
      x: this.left,
      y: this.top,
      width: this.colliderWidth,
      height: this.colliderHeight
    };
  }

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
