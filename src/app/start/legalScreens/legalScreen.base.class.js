import { createPanelMetrics, drawLegalLayout, getFontMetrics, getScrollMetrics, getCloseTextBounds, renderContent } from "./legalScreen.render.js";
import { wrapParagraphText } from "./legalScreen.wrap.js";

/**
 * Renders legal screen.
 * Used to render legal screen.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.scroll] Scroll.
 * @param {Function} [options.onLineRender] On line render.
 * @param {string} [options.title] Title.
 * @param {*} [options.wrapParagraphs] Wrap paragraphs.
 */
const renderLegalScreen = ({ ctx, canvas, scroll, onLineRender, title, wrapParagraphs }) => {
  if (!ctx || !canvas) return { maxScroll: 0, closeTextBounds: null, linkBounds: null };
  const { panelPadding, panelWidth, panelX, panelY, panelHeight, innerWidth } = createPanelMetrics(canvas);
  const { titleFontSize, bodyFontSize, lineHeight } = getFontMetrics();
  drawLegalLayout({ ctx, title, panelX, panelY, panelWidth, panelHeight, panelPadding, titleFontSize, bodyFontSize });
  const wrapped = wrapParagraphs({ ctx, innerWidth, lineHeight });
  const { textStartY, innerHeight, maxScroll, clampedScroll } = getScrollMetrics({ wrapped, panelY, panelHeight, panelPadding, titleFontSize, scroll });
  const closeTextBounds = getCloseTextBounds({ ctx, panelX, panelY, panelWidth, panelPadding });
  const linkBounds = renderContent({ ctx, wrapped, panelX, panelY, panelPadding, panelHeight, lineHeight, bodyFontSize, textStartY, innerWidth, innerHeight, clampedScroll, onLineRender });
  return { maxScroll, linkBounds, closeTextBounds };
};

export class LegalScreenBase {
  /**
   * Creates a new instance.
   * Used to set up required data for camera-relative placement.
   * Uses options to perform the operation.
   * @param {Object} options Configuration options.
   * @param {string} [options.title] Title.
   * @param {*} [options.paragraphs] Paragraphs.
   */
  constructor({ title, paragraphs }) {
    this.title = title;
    this.paragraphs = paragraphs;
  }

  /**
   * Wrap paragraphs.
   * Used to support camera-relative placement.
   * Uses options to perform the operation.
   * @param {Object} options Configuration options.
   * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
   * @param {number} [options.innerWidth] Inner width.
   * @param {number} [options.lineHeight] Line height.
   */
  wrapParagraphs({ ctx, innerWidth, lineHeight }) {
    const wrappedLines = [];
    this.paragraphs.forEach((paragraphText) => {
      wrapParagraphText({ ctx, innerWidth, lineHeight, paragraphText, wrappedLines });
    });
    return wrappedLines;
  }

  /**
   * Renders. If omitted, default values are used.
   * Used to support camera-relative placement.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
   * @param {HTMLCanvasElement} [options.canvas] Target canvas.
   * @param {*} [options.scroll] Scroll.
   * @param {Function} [options.onLineRender] On line render.
   */
  render({ ctx, canvas, scroll = 0, onLineRender }) {
    return renderLegalScreen({
      ctx,
      canvas,
      scroll,
      onLineRender,
      title: this.title,
      wrapParagraphs: (args) => this.wrapParagraphs(args),
    });
  }
}
