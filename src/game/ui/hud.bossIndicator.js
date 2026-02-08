/**
 * Draws boss indicator.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {Camera} camera Camera instance.
 * @param {Boss} boss Boss instance.
 */
export function drawBossIndicator(ctx, canvas, camera, boss) {
  if (!this.shouldRenderBossIndicator(boss)) return;
  const indicatorStyle = this.getBossIndicatorStyle();
  const placement = this.getBossIndicatorPlacement(boss, canvas, camera, indicatorStyle);
  if (!placement.isOffscreen) return;
  this.drawBossIndicatorContent(ctx, placement, indicatorStyle);
}

/**
 * Should render boss indicator.
 * Updates the boss state.
 * @param {Boss} boss Boss instance.
 * @returns {boolean} Whether render boss indicator.
 */
export function shouldRenderBossIndicator(boss) {
  return boss && !boss.remove && !(boss.isDead && boss.health <= 0);
}

/**
 * Returns boss indicator style.
 * @returns {Object} Boss indicator style.
 */
export function getBossIndicatorStyle() {
  return { margin: 16, bossTopOffset: 30, bossBarWidthFactor: 0.8, bossBarHeight: 12, arrowSize: 20, arrowYOffset: 9.25, bossNameOffsetX: 16, bossNameColor: "rgba(143, 0, 0, 0.9)", arrowColor: "rgba(0, 0, 0, 0.6)", bossNameFont: "1rem ComixLoud, sans-serif" };
}

/**
 * Draws boss indicator content.
 * Renders to the canvas context.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} placement Placement.
 * @param {*} indicatorStyle Indicator style.
 */
export function drawBossIndicatorContent(ctx, placement, indicatorStyle) {
  ctx.save();
  ctx.fillStyle = indicatorStyle.arrowColor;
  if (placement.offLeft || placement.offRight) this.drawSideIndicator(ctx, placement, indicatorStyle);
  else this.drawVerticalIndicator(ctx, placement, indicatorStyle);
  ctx.restore();
}

/**
 * Draws side indicator.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} placement Placement.
 * @param {*} indicatorStyle Indicator style.
 */
export function drawSideIndicator(ctx, placement, indicatorStyle) {
  const angle = placement.offLeft ? Math.PI : 0;
  this.drawIndicatorArrow(ctx, placement.arrowX, placement.arrowY, angle, indicatorStyle.arrowSize);
  this.drawIndicatorLabel(ctx, this.bossName, placement.textX, placement.textY, placement.offLeft ? "left" : "right", indicatorStyle.bossNameFont, indicatorStyle.bossNameColor);
}

/**
 * Draws vertical indicator.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} placement Placement.
 * @param {*} indicatorStyle Indicator style.
 */
export function drawVerticalIndicator(ctx, placement, indicatorStyle) {
  const angle = placement.offTop ? -Math.PI / 2 : Math.PI / 2;
  this.drawIndicatorArrow(ctx, placement.drawX, placement.arrowY, angle, indicatorStyle.arrowSize);
  this.drawIndicatorLabel(ctx, this.bossName, placement.drawX, placement.textY, "center", indicatorStyle.bossNameFont, indicatorStyle.bossNameColor);
}

/**
 * Returns boss indicator placement.
 * Updates the instance state.
 * @param {Boss} boss Boss instance.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {Camera} camera Camera instance.
 * @param {*} indicatorStyle Indicator style.
 * @returns {*} Boss indicator placement.
 */
export function getBossIndicatorPlacement(boss, canvas, camera, indicatorStyle) {
  const base = this.getBossIndicatorBase(boss, camera, indicatorStyle);
  const offscreen = this.getBossIndicatorOffscreen(base, canvas, indicatorStyle.margin);
  return this.buildBossIndicatorPlacement(base, offscreen, canvas, indicatorStyle);
}

/**
 * Returns boss indicator base.
 * Updates the boss state.
 * @param {Boss} boss Boss instance.
 * @param {Camera} camera Camera instance.
 * @param {*} indicatorStyle Indicator style.
 * @returns {Object} Boss indicator base.
 */
export function getBossIndicatorBase(boss, camera, indicatorStyle) {
  const centerX = boss.x + boss.width / 2 - camera.x;
  const topY = boss.y - camera.y - indicatorStyle.bossTopOffset;
  const barW = boss.width * indicatorStyle.bossBarWidthFactor;
  const barH = indicatorStyle.bossBarHeight;
  return { centerX, topY, barW, barH };
}

/**
 * Returns boss indicator offscreen.
 * Uses base, canvas, margin to compute the result.
 * @param {*} base Base.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {*} margin Margin.
 * @returns {Object} Boss indicator offscreen.
 */
export function getBossIndicatorOffscreen(base, canvas, margin) {
  let drawX = base.centerX;
  let drawY = base.topY;
  const offLeft = drawX < margin;
  const offRight = drawX > canvas.width - margin;
  const offTop = drawY < margin;
  const offBottom = drawY > canvas.height - margin;
  if (offLeft) drawX = margin;
  if (offRight) drawX = canvas.width - margin;
  if (offTop) drawY = margin;
  if (offBottom) drawY = canvas.height - margin;
  const isOffscreen = offLeft || offRight || offTop || offBottom;
  return { drawX, drawY, offLeft, offRight, offTop, offBottom, isOffscreen };
}

/**
 * Builds boss indicator placement.
 * Uses base, offscreen, canvas, indicatorStyle to compute the result.
 * @param {*} base Base.
 * @param {*} offscreen Offscreen.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {*} indicatorStyle Indicator style.
 * @returns {Object} Boss indicator placement.
 */
export function buildBossIndicatorPlacement(base, offscreen, canvas, indicatorStyle) {
  const barY = offscreen.drawY;
  const arrowY = barY + base.barH + indicatorStyle.arrowYOffset;
  const textY = arrowY;
  const arrowX = offscreen.offLeft ? indicatorStyle.margin : canvas.width - indicatorStyle.margin;
  const textX = offscreen.offLeft ? arrowX + indicatorStyle.arrowSize + indicatorStyle.bossNameOffsetX : arrowX - indicatorStyle.arrowSize - indicatorStyle.bossNameOffsetX;
  return { drawX: offscreen.drawX, drawY: offscreen.drawY, barW: base.barW, barH: base.barH, barY, offLeft: offscreen.offLeft, offRight: offscreen.offRight, offTop: offscreen.offTop, offBottom: offscreen.offBottom, isOffscreen: offscreen.isOffscreen, arrowX, arrowY, textX, textY };
}

/**
 * Draws indicator arrow.
 * Renders to the canvas context.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number} angle Angle.
 * @param {number} arrowSize Arrow size.
 */
export function drawIndicatorArrow(ctx, x, y, angle, arrowSize) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const arrowGeometry = this.getArrowGeometry(arrowSize);
  this.drawArrowPath(ctx, arrowGeometry);
  ctx.restore();
}

/**
 * Returns arrow geometry.
 * Uses arrowSize to compute the result.
 * @param {number} arrowSize Arrow size.
 * @returns {Object} Arrow geometry.
 */
export function getArrowGeometry(arrowSize) {
  const arrowHeightFactor = 1.5;
  const arrowHalfHeight = arrowSize / arrowHeightFactor;
  const arrowLeftX = -arrowSize;
  const arrowTipX = arrowSize;
  const arrowBaseTop = { x: arrowLeftX, y: -arrowHalfHeight };
  const arrowBaseBottom = { x: arrowLeftX, y: arrowHalfHeight };
  return { arrowBaseTop, arrowBaseBottom, arrowTipX };
}

/**
 * Draws arrow path.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} arrowGeometry Arrow geometry.
 */
export function drawArrowPath(ctx, arrowGeometry) {
  ctx.beginPath();
  ctx.moveTo(arrowGeometry.arrowBaseTop.x, arrowGeometry.arrowBaseTop.y);
  ctx.lineTo(arrowGeometry.arrowBaseBottom.x, arrowGeometry.arrowBaseBottom.y);
  ctx.lineTo(arrowGeometry.arrowTipX, 0);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws indicator label.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {string} text Text.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {*} align Align.
 * @param {string} font Font.
 * @param {string} color Color.
 */
export function drawIndicatorLabel(ctx, text, x, y, align, font, color) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}
