/**
 * Draws hearts.
 * Updates the player state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {Player} player Player instance.
 */
export function drawHearts(ctx, player) {
  const heartSettings = this.getHeartSettings();
  const states = player.heartStates;
  const lastFilledIndex = this.getLastFilledIndex(states);
  this.drawHeartsFromStates(ctx, states, heartSettings, lastFilledIndex, player);
}

/**
 * Returns heart settings.
 * @returns {Object} Heart settings.
 */
export function getHeartSettings() {
  return {
    heartSize: 32,
    heartStartX: 30,
    heartY: 5,
    heartSpacing: 10,
    lastHeartPulseAmplitude: 0.07,
    lastHeartPulseFrequency: 6,
    baseWaveOffset: 0.5,
    baseWaveScale: 0.5,
    hitPulseAmplitude: 0.18,
    hitPulseFrequency: 14 };
}

/**
 * Returns last filled index.
 * Uses states to compute the result.
 * @param {*} states States.
 * @returns {Array<any>} Last filled index.
 */
export function getLastFilledIndex(states) {
  return [...states].map((state, heartIndex) => ({ state, heartIndex })).filter((heart) => heart.state > 0).pop()?.heartIndex;
}

/**
 * Draws hearts from states.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} states States.
 * @param {*} heartSettings Heart settings.
 * @param {number} lastFilledIndex Last filled index.
 * @param {Player} player Player instance.
 */
export function drawHeartsFromStates(ctx, states, heartSettings, lastFilledIndex, player) {
  states.forEach((state, heartIndex) => {
    const x = heartSettings.heartStartX + heartIndex * (heartSettings.heartSize + heartSettings.heartSpacing);
    this.drawHeartAtIndex(ctx, state, heartIndex, x, heartSettings, lastFilledIndex, player);
  });
}

/**
 * Draws heart at index.
 * Renders to the canvas context.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} state State.
 * @param {number} heartIndex Heart index.
 * @param {number} x X.
 * @param {*} heartSettings Heart settings.
 * @param {number} lastFilledIndex Last filled index.
 * @param {Player} player Player instance.
 */
export function drawHeartAtIndex(ctx, state, heartIndex, x, heartSettings, lastFilledIndex, player) {
  ctx.save();
  ctx.translate(x + heartSettings.heartSize / 2, heartSettings.heartY + heartSettings.heartSize / 2);
  const scale = this.getHeartScale(heartIndex, lastFilledIndex, player, heartSettings);
  ctx.scale(scale, scale);
  this.drawHeartShape(ctx, state, heartSettings.heartSize);
  ctx.restore();
}

/**
 * Returns heart scale.
 * Updates the player state.
 * @param {number} heartIndex Heart index.
 * @param {number} lastFilledIndex Last filled index.
 * @param {Player} player Player instance.
 * @param {*} heartSettings Heart settings.
 * @returns {*} Heart scale.
 */
export function getHeartScale(heartIndex, lastFilledIndex, player, heartSettings) {
  let scale = 1;
  if (heartIndex === lastFilledIndex) {
    const baseWave = heartSettings.baseWaveOffset + heartSettings.baseWaveScale * Math.sin(this.heartPulseTime * heartSettings.lastHeartPulseFrequency);
    scale += heartSettings.lastHeartPulseAmplitude * baseWave;
  }
  if (player.healthPulse > 0) {
    const hitAmp = heartSettings.hitPulseAmplitude * player.healthPulse;
    const hitWave = heartSettings.baseWaveOffset + heartSettings.baseWaveScale * Math.sin(this.heartPulseTime * heartSettings.hitPulseFrequency);
    scale += hitAmp * hitWave;
  }
  return scale;
}

/**
 * Draws heart shape.
 * Renders to the canvas context.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} heartState Heart state.
 * @param {number} size Size.
 */
export function drawHeartShape(ctx, heartState, size) {
  const heartStyle = this.getHeartStyle();
  this.traceHeartPath(ctx, size, heartStyle);
  this.applyHeartOutline(ctx, heartStyle);
  this.applyHeartFill(ctx, heartState, heartStyle);
  ctx.fill();
  ctx.stroke();
}

/**
 * Returns heart style.
 * @returns {Object} Heart style.
 */
export function getHeartStyle() {
  return {
    topOffsetFactor: 0.35,
    curveFactor: 0.6,
    curveTopOffsetFactor: 0.1,
    outlineWidth: 3,
    fullHeartColor: "rgba(182, 0, 0, 1)",
    halfHeartColor: "rgba(192, 69, 69, 0.6)",
    emptyHeartColor: "rgba(58, 58, 58, 0.2)",
    outlineColor: "#000" };
}

/**
 * Trace heart path.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} size Size.
 * @param {*} heartStyle Heart style.
 */
export function traceHeartPath(ctx, size, heartStyle) {
  ctx.beginPath();
  const heartWidth = size, heartHeight = size;
  ctx.moveTo(0, heartHeight * heartStyle.topOffsetFactor);
  ctx.bezierCurveTo(-heartWidth * heartStyle.curveFactor, -heartHeight * heartStyle.curveTopOffsetFactor, -heartWidth * heartStyle.curveFactor, heartHeight * heartStyle.curveFactor, 0, heartHeight);
  ctx.bezierCurveTo(heartWidth * heartStyle.curveFactor, heartHeight * heartStyle.curveFactor, heartWidth * heartStyle.curveFactor, -heartHeight * heartStyle.curveTopOffsetFactor, 0, heartHeight * heartStyle.topOffsetFactor);
}

/**
 * Applies heart outline.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} heartStyle Heart style.
 */
export function applyHeartOutline(ctx, heartStyle) {
  ctx.lineWidth = heartStyle.outlineWidth;
  ctx.strokeStyle = heartStyle.outlineColor;
}

/**
 * Applies heart fill.
 * Renders to the canvas context.
 * Updates the player state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} heartState Heart state.
 * @param {*} heartStyle Heart style.
 */
export function applyHeartFill(ctx, heartState, heartStyle) {
  // heartState from player.heartStates: 2 = full, 1 = half, 0 = empty.
  if (heartState === 2) ctx.fillStyle = heartStyle.fullHeartColor;
  else if (heartState === 1) ctx.fillStyle = heartStyle.halfHeartColor;
  else ctx.fillStyle = heartStyle.emptyHeartColor;
}
