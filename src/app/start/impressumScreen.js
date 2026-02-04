import { LegalScreenBase } from "./legalScreenBase.class.js";

const IMPRESSUM_PARAGRAPHS = [
  "Information pursuant to § 5 DDG",
  "",
  "Sebastian Hedwig",
  "Moselstraße 3",
  "65439 Flörsheim am Main",
  "",
  "Represented by:",
  "Sebastian Hedwig",
  "",
  "Contact:",
  "Phone: +49 151 23537848",
  "Email: sebastian.hedwig@web.de",
  "",
  "Consumer dispute resolution / Universal arbitration board",
  "I do not participate in dispute resolution proceedings before a consumer arbitration board and am not obliged to do so.",
  "",
  "Privacy Policy",
  "You can find the privacy policy at the following link: Click here",
  "",
  "Imprint from WebsiteWissen.com, the guide for WordPress websites, WordPress hosting, and website costs, based on a template by Kanzlei Hasselbach Rechtsanwälte.",
];

const IMPRESSUM_LINK_TEXT = "Click here";

const impressumScreenBase = new LegalScreenBase({
  title: "Legal Notice",
  paragraphs: IMPRESSUM_PARAGRAPHS,
});

/**
 * Returns impressum link parts.
 * Uses lineEntry, linkText to compute the result.
 * @param {*} lineEntry Line entry.
 * @param {string} linkText Link text.
 * @returns {Object} Impressum link parts.
 */
const getImpressumLinkParts = (lineEntry, linkText) => {
  const before = lineEntry.text.split(linkText)[0];
  const after = lineEntry.text.substring(lineEntry.text.indexOf(linkText) + linkText.length);
  return { before, after };
};

/**
 * Measure impressum link.
 * Uses renderCtx, before, linkText to perform the operation.
 * @param {*} renderCtx Render ctx.
 * @param {*} before Before.
 * @param {string} linkText Link text.
 * @returns {Object} Result value.
 */
const measureImpressumLink = (renderCtx, before, linkText) => {
  const beforeWidth = renderCtx.measureText(before).width;
  const linkWidth = renderCtx.measureText(linkText).width;
  return { beforeWidth, linkWidth };
};

/**
 * Draws impressum link.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.renderCtx] Render ctx.
 * @param {*} [options.position] Position.
 * @param {*} [options.fonts] Fonts.
 * @param {*} [options.before] Before.
 * @param {*} [options.after] After.
 * @param {number} [options.beforeWidth] Before width.
 * @param {string} [options.linkText] Link text.
 * @param {number} [options.linkWidth] Link width.
 */
const drawImpressumLink = ({ renderCtx, position, fonts, before, after, beforeWidth, linkText, linkWidth }) => {
  renderCtx.fillText(before, position.x, position.y);
  renderCtx.save();
  renderCtx.font = `bold ${fonts.bodyFontSize}px sans-serif`;
  renderCtx.fillText(linkText, position.x + beforeWidth, position.y);
  renderCtx.restore();
  if (after?.length) {
    renderCtx.fillText(after, position.x + beforeWidth + linkWidth, position.y);
  }
};

/**
 * Creates impressum link bounds.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.position] Position.
 * @param {number} [options.beforeWidth] Before width.
 * @param {number} [options.linkWidth] Link width.
 * @param {number} [options.lineHeight] Line height.
 * @returns {*} Impressum link bounds.
 */
const createImpressumLinkBounds = ({ position, beforeWidth, linkWidth, lineHeight }) => ({
  x: position.x + beforeWidth,
  y: position.y,
  w: linkWidth,
  h: lineHeight,
});

/**
 * Renders impressum link.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {*} [options.lineEntry] Line entry.
 * @param {number} [options.lineHeight] Line height.
 * @param {*} [options.position] Position.
 * @param {*} [options.fonts] Fonts.
 */
const renderImpressumLink = ({ ctx: renderCtx, lineEntry, lineHeight, position, fonts }) => {
  const linkText = IMPRESSUM_LINK_TEXT;
  const isLink = lineEntry.text.includes(linkText);
  if (!isLink) return null;
  const { before, after } = getImpressumLinkParts(lineEntry, linkText);
  const { beforeWidth, linkWidth } = measureImpressumLink(renderCtx, before, linkText);
  drawImpressumLink({ renderCtx, position, fonts, before, after, beforeWidth, linkText, linkWidth });
  return { handled: true, linkBounds: createImpressumLinkBounds({ position, beforeWidth, linkWidth, lineHeight }) };
};

/**
 * Renders impressum screen. If omitted, default values are used.
 * Uses options to perform the operation.
 * @param {Object} [options] Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.scroll] Scroll.
 */
export function renderImpressumScreen({ ctx, canvas, scroll = 0 }) {
  return impressumScreenBase.render({ ctx, canvas, scroll, onLineRender: renderImpressumLink });
}
