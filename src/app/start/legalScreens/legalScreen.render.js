const PANEL_WIDTH_RATIO = 0.8;
const PANEL_Y_RATIO = 0.05;
const PANEL_HEIGHT_RATIO = 0.8;
const PANEL_CORNER_RADIUS = 16;
const PANEL_FILL_COLOR = "rgba(0, 0, 0, 0.8)";
const PANEL_STROKE_COLOR = "rgba(0, 110, 110, 0.8)";
const PANEL_STROKE_WIDTH = 3;
const PANEL_SHADOW_COLOR = "rgba(0,0,0,0.4)";
const PANEL_SHADOW_BLUR = 10;

const TITLE_FONT_SIZE = 32;
const BODY_FONT_SIZE = 16;
const LINE_HEIGHT_MULTIPLIER = 1.5;
const TITLE_COLOR = "rgb(0, 110, 110)";
const BODY_COLOR = "#e4f7f7";
const TITLE_BODY_GAP = 24;

const CLOSE_FONT_SIZE = 18;
const CLOSE_TEXT = "Close";
const CLOSE_HEIGHT_MULTIPLIER = 1.2;

/**
 * Creates panel metrics.
 * Used to set up required data for camera-relative placement.
 * Uses canvas to compute the result.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @returns {Object} Panel metrics.
 */
export const createPanelMetrics = (canvas) => {
  const panelPadding = 28;
  const panelWidth = Math.min(canvas.width * PANEL_WIDTH_RATIO);
  const panelX = (canvas.width - panelWidth) / 2;
  const panelY = canvas.height * PANEL_Y_RATIO;
  const panelHeight = canvas.height * PANEL_HEIGHT_RATIO;
  const innerWidth = panelWidth - panelPadding * 2;
  return { panelPadding, panelWidth, panelX, panelY, panelHeight, innerWidth };
};

/**
 * Draws panel.
 * Used to render panel.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {number} [options.panelX] Panel X.
 * @param {number} [options.panelY] Panel Y.
 * @param {number} [options.panelWidth] Panel width.
 * @param {number} [options.panelHeight] Panel height.
 */
const drawPanel = ({ ctx, panelX, panelY, panelWidth, panelHeight }) => {
  ctx.save();
  ctx.fillStyle = PANEL_FILL_COLOR;
  ctx.strokeStyle = PANEL_STROKE_COLOR;
  ctx.lineWidth = PANEL_STROKE_WIDTH;
  ctx.shadowColor = PANEL_SHADOW_COLOR;
  ctx.shadowBlur = PANEL_SHADOW_BLUR;
  ctx.roundRect(panelX, panelY, panelWidth, panelHeight, PANEL_CORNER_RADIUS);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

/**
 * Returns font metrics.
 * Used to provide font metrics for rendering.
 * @returns {Object} Font metrics.
 */
export const getFontMetrics = () => {
  const titleFontSize = TITLE_FONT_SIZE;
  const bodyFontSize = BODY_FONT_SIZE;
  const lineHeight = bodyFontSize * LINE_HEIGHT_MULTIPLIER;
  return { titleFontSize, bodyFontSize, lineHeight };
};

/**
 * Draws title text.
 * Used to render title text.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {string} [options.title] Title.
 * @param {number} [options.panelX] Panel X.
 * @param {number} [options.panelY] Panel Y.
 * @param {number} [options.panelPadding] Panel padding.
 * @param {number} [options.titleFontSize] Title font size.
 */
const drawTitleText = ({ ctx, title, panelX, panelY, panelPadding, titleFontSize }) => {
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.font = `bold ${titleFontSize}px sans-serif`;
  ctx.fillStyle = TITLE_COLOR;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(title, panelX + panelPadding, panelY + panelPadding);
};

/**
 * Applies body font.
 * Used to keep state consistent before the next step for camera-relative placement.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {number} [options.bodyFontSize] Body font size.
 */
const applyBodyFont = ({ ctx, bodyFontSize }) => {
  ctx.shadowColor = "transparent";
  ctx.font = `${bodyFontSize}px sans-serif`;
  ctx.fillStyle = BODY_COLOR;
};

/**
 * Returns scroll metrics.
 * Used to provide scroll metrics for camera-relative placement.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.wrapped] Wrapped.
 * @param {number} [options.panelY] Panel Y.
 * @param {number} [options.panelHeight] Panel height.
 * @param {number} [options.panelPadding] Panel padding.
 * @param {number} [options.titleFontSize] Title font size.
 * @param {*} [options.scroll] Scroll.
 */
export const getScrollMetrics = ({ wrapped, panelY, panelHeight, panelPadding, titleFontSize, scroll }) => {
  const contentHeight = wrapped.reduce((totalHeight, lineEntry) => totalHeight + lineEntry.height, 0);
  const textStartY = panelY + panelPadding + titleFontSize + TITLE_BODY_GAP;
  const innerHeight = panelHeight - (textStartY - panelY) - panelPadding;
  const maxScroll = Math.max(0, contentHeight - innerHeight);
  const clampedScroll = Math.min(Math.max(scroll, 0), maxScroll);
  return { contentHeight, textStartY, innerHeight, maxScroll, clampedScroll };
};

/**
 * Returns close text bounds.
 * Used to provide close text bounds for rendering.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {number} [options.panelX] Panel X.
 * @param {number} [options.panelY] Panel Y.
 * @param {number} [options.panelWidth] Panel width.
 * @param {number} [options.panelPadding] Panel padding.
 */
export const getCloseTextBounds = ({ ctx, panelX, panelY, panelWidth, panelPadding }) => {
  const closeFontSize = CLOSE_FONT_SIZE;
  ctx.font = `bold ${closeFontSize}px sans-serif`;
  const closeText = CLOSE_TEXT;
  const closeWidth = ctx.measureText(closeText).width;
  const closeHeight = closeFontSize * CLOSE_HEIGHT_MULTIPLIER;
  const closeX = panelX + panelWidth - panelPadding - closeWidth;
  const closeY = panelY + panelPadding;
  return { x: closeX, y: closeY, w: closeWidth, h: closeHeight, fontSize: closeFontSize, text: closeText };
};

/**
 * Begin content clip.
 * Used to support camera-relative placement.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {number} [options.panelX] Panel X.
 * @param {number} [options.panelPadding] Panel padding.
 * @param {number} [options.textStartY] Text start Y.
 * @param {number} [options.innerWidth] Inner width.
 * @param {number} [options.innerHeight] Inner height.
 * @param {number} [options.bodyFontSize] Body font size.
 */
const beginContentClip = ({ ctx, panelX, panelPadding, textStartY, innerWidth, innerHeight, bodyFontSize }) => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(panelX + panelPadding, textStartY, innerWidth, innerHeight);
  ctx.clip();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.font = `${bodyFontSize}px sans-serif`;
  ctx.fillStyle = "#e4f7f7";
};

/**
 * End content clip.
 * Used to support camera-relative placement.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @returns {*} Result value.
 */
const endContentClip = (ctx) => ctx.restore();

/**
 * Is line visible.
 * Used to decide camera placement.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {number} [options.currentY] Current Y.
 * @param {number} [options.panelY] Panel Y.
 * @param {number} [options.panelPadding] Panel padding.
 * @param {number} [options.lineHeight] Line height.
 * @param {number} [options.panelHeight] Panel height.
 * @returns {boolean} Whether line visible.
 */
const isLineVisible = ({ currentY, panelY, panelPadding, lineHeight, panelHeight }) =>
  currentY > panelY + panelPadding - lineHeight && currentY < panelY + panelHeight - panelPadding + lineHeight;

/**
 * Returns line position.
 * Used to provide line position for camera-relative placement.
 * Uses panelX, panelPadding, currentY to compute the result.
 * @param {number} panelX Panel X.
 * @param {number} panelPadding Panel padding.
 * @param {number} currentY Current Y.
 * @returns {*} Line position.
 */
const getLinePosition = (panelX, panelPadding, currentY) => ({ x: panelX + panelPadding, y: currentY });

/**
 * Renders line entry.
 * Used to render line entry.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {*} [options.lineEntry] Line entry.
 * @param {number} [options.lineHeight] Line height.
 * @param {*} [options.position] Position.
 * @param {number} [options.bodyFontSize] Body font size.
 * @param {Function} [options.onLineRender] On line render.
 */
const renderLineEntry = ({ ctx, lineEntry, lineHeight, position, bodyFontSize, onLineRender }) => {
  if (!onLineRender) {
    ctx.fillText(lineEntry.text, position.x, position.y);
    return null;
  }
  const result = onLineRender({ ctx, lineEntry, lineHeight, position, fonts: { bodyFontSize } });
  if (!result?.handled) {
    ctx.fillText(lineEntry.text, position.x, position.y);
    return null;
  }
  return result.linkBounds || null;
};

/**
 * Updates link bounds.
 * Used to advance state during the update loop for collision and hit testing.
 * Uses linkBounds, nextBounds to perform the operation.
 * @param {*} linkBounds Link bounds.
 * @param {*} nextBounds Next bounds.
 * @returns {*} Result value.
 */
const updateLinkBounds = (linkBounds, nextBounds) => (linkBounds || !nextBounds ? linkBounds : nextBounds);

/**
 * Renders wrapped line.
 * Used to render wrapped line.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {*} [options.lineEntry] Line entry.
 * @param {number} [options.lineHeight] Line height.
 * @param {number} [options.bodyFontSize] Body font size.
 * @param {Function} [options.onLineRender] On line render.
 * @param {number} [options.panelX] Panel X.
 * @param {number} [options.panelY] Panel Y.
 * @param {number} [options.panelPadding] Panel padding.
 * @param {number} [options.panelHeight] Panel height.
 * @param {number} [options.currentY] Current Y.
 * @param {*} [options.linkBounds] Link bounds.
 */
const renderWrappedLine = ({ ctx, lineEntry, lineHeight, bodyFontSize, onLineRender, panelX, panelY, panelPadding, panelHeight, currentY, linkBounds }) => {
  const visible = isLineVisible({ currentY, panelY, panelPadding, lineHeight, panelHeight });
  if (!lineEntry.text || !visible) return linkBounds;
  const position = getLinePosition(panelX, panelPadding, currentY);
  const newBounds = renderLineEntry({ ctx, lineEntry, lineHeight, position, bodyFontSize, onLineRender });
  return updateLinkBounds(linkBounds, newBounds);
};

/**
 * Renders wrapped lines.
 * Used to render wrapped lines.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {*} [options.wrapped] Wrapped.
 * @param {number} [options.panelX] Panel X.
 * @param {number} [options.panelY] Panel Y.
 * @param {number} [options.panelPadding] Panel padding.
 * @param {number} [options.panelHeight] Panel height.
 * @param {number} [options.lineHeight] Line height.
 * @param {number} [options.bodyFontSize] Body font size.
 * @param {number} [options.textStartY] Text start Y.
 * @param {*} [options.clampedScroll] Clamped scroll.
 * @param {Function} [options.onLineRender] On line render.
 */
const renderWrappedLines = ({ ctx, wrapped, panelX, panelY, panelPadding, panelHeight, lineHeight, bodyFontSize, textStartY, clampedScroll, onLineRender }) => {
  let linkBounds = null;
  let currentY = textStartY - clampedScroll;
  wrapped.forEach((lineEntry) => {
    linkBounds = renderWrappedLine({ ctx, lineEntry, lineHeight, bodyFontSize, onLineRender, panelX, panelY, panelPadding, panelHeight, currentY, linkBounds });
    currentY += lineEntry.height;
  });
  return linkBounds;
};

/**
 * Renders content.
 * Used to render content.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {*} [options.wrapped] Wrapped.
 * @param {number} [options.panelX] Panel X.
 * @param {number} [options.panelY] Panel Y.
 * @param {number} [options.panelPadding] Panel padding.
 * @param {number} [options.panelHeight] Panel height.
 * @param {number} [options.lineHeight] Line height.
 * @param {number} [options.bodyFontSize] Body font size.
 * @param {number} [options.textStartY] Text start Y.
 * @param {number} [options.innerWidth] Inner width.
 * @param {number} [options.innerHeight] Inner height.
 * @param {*} [options.clampedScroll] Clamped scroll.
 * @param {Function} [options.onLineRender] On line render.
 */
export const renderContent = ({ ctx, wrapped, panelX, panelY, panelPadding, panelHeight, lineHeight, bodyFontSize, textStartY, innerWidth, innerHeight, clampedScroll, onLineRender }) => {
  beginContentClip({ ctx, panelX, panelPadding, textStartY, innerWidth, innerHeight, bodyFontSize });
  const linkBounds = renderWrappedLines({ ctx, wrapped, panelX, panelY, panelPadding, panelHeight, lineHeight, bodyFontSize, textStartY, clampedScroll, onLineRender });
  endContentClip(ctx);
  return linkBounds;
};

/**
 * Draws legal layout.
 * Used to render legal layout.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {string} [options.title] Title.
 * @param {number} [options.panelX] Panel X.
 * @param {number} [options.panelY] Panel Y.
 * @param {number} [options.panelWidth] Panel width.
 * @param {number} [options.panelHeight] Panel height.
 * @param {number} [options.panelPadding] Panel padding.
 * @param {number} [options.titleFontSize] Title font size.
 * @param {number} [options.bodyFontSize] Body font size.
 */
export const drawLegalLayout = ({ ctx, title, panelX, panelY, panelWidth, panelHeight, panelPadding, titleFontSize, bodyFontSize }) => {
  drawPanel({ ctx, panelX, panelY, panelWidth, panelHeight });
  drawTitleText({ ctx, title, panelX, panelY, panelPadding, titleFontSize });
  applyBodyFont({ ctx, bodyFontSize });
};
