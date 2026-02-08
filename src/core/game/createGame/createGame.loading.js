/**
 * Updates loading time.
 * Uses timeStamp to perform the operation.
 * @param {number} timeStamp Time stamp.
 */
export function updateLoadingTime(timeStamp) {
  this.loadingAnimTime = timeStamp || 0;
}

/**
 * Draws loading backdrop.
 * Renders to the canvas context.
 */
export function drawLoadingBackdrop() {
  this.ctx.fillStyle = this.LOADING_FILL_STYLE;
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
}

/**
 * Returns loading spinner state.
 * @returns {Object} Loading spinner state.
 */
export function getLoadingSpinnerState() {
  const canvasCenterX = this.canvas.width / 2;
  const canvasCenterY = this.canvas.height / 2;
  const radius = 40;
  const spinnerAngle = (this.loadingAnimTime / this.LOADING_SPINNER_ROTATE_MS) % this.FULL_CIRCLE_RADIANS;
  return { canvasCenterX, canvasCenterY, radius, spinnerAngle };
}

/**
 * Draws loading spinner.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {boolean} [options.canvasCenterX] Canvas center X.
 * @param {boolean} [options.canvasCenterY] Canvas center Y.
 * @param {*} [options.radius] Radius.
 * @param {number} [options.spinnerAngle] Spinner angle.
 */
export function drawLoadingSpinner({ canvasCenterX, canvasCenterY, radius, spinnerAngle }) {
  this.ctx.lineWidth = this.LOADING_STROKE_WIDTH;
  this.ctx.strokeStyle = this.LOADING_STROKE_STYLE;
  this.ctx.beginPath();
  this.ctx.arc(canvasCenterX, canvasCenterY, radius, spinnerAngle, spinnerAngle + this.LOADING_ARC_SWEEP);
  this.ctx.stroke();
}

/**
 * Draws loading text.
 * Renders to the canvas context.
 * @param {boolean} canvasCenterX Canvas center X.
 * @param {boolean} canvasCenterY Canvas center Y.
 */
export function drawLoadingText(canvasCenterX, canvasCenterY) {
  this.ctx.fillStyle = this.LOADING_TEXT_COLOR;
  this.ctx.font = this.LOADING_FONT;
  this.ctx.textAlign = "center";
  this.ctx.textBaseline = "middle";
  this.ctx.fillText("Loading...", canvasCenterX, canvasCenterY + this.LOADING_TEXT_OFFSET_Y);
}

/**
 * Renders loading.
 * Uses timeStamp to perform the operation.
 * @param {number} timeStamp Time stamp.
 */
export function renderLoading(timeStamp) {
  if (!this.isLoading) return;
  this.updateLoadingTime(timeStamp);
  this.clearCanvas();
  this.drawLoadingBackdrop();
  const spinnerState = this.getLoadingSpinnerState();
  this.drawLoadingSpinner(spinnerState);
  this.drawLoadingText(spinnerState.canvasCenterX, spinnerState.canvasCenterY);
  requestAnimationFrame(this.renderLoading);
}
