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
const EMPTY_LINE_RATIO = 0.6;
const TITLE_COLOR = "rgb(0, 110, 110)";
const BODY_COLOR = "#e4f7f7";
const TITLE_BODY_GAP = 24;

const CLOSE_FONT_SIZE = 18;
const CLOSE_TEXT = "Close";
const CLOSE_HEIGHT_MULTIPLIER = 1.2;

const createLineEntry = (text, height) => ({ text, height });

const addEmptyLine = (wrappedLines, lineHeight) =>
  wrappedLines.push(createLineEntry("", lineHeight * EMPTY_LINE_RATIO));

const appendLine = (wrappedLines, currentLine, lineHeight) =>
  wrappedLines.push(createLineEntry(currentLine, lineHeight));

const getTestLine = (currentLine, word) => (currentLine ? `${currentLine} ${word}` : word);

const shouldWrapLine = (ctx, innerWidth, testLine) => ctx.measureText(testLine).width > innerWidth;

const wrapWordsIntoLines = ({ ctx, innerWidth, lineHeight, words, wrappedLines }) => {
  let currentLine = "";
  words.forEach((word, wordIndex) => {
    const testLine = getTestLine(currentLine, word);
    if (shouldWrapLine(ctx, innerWidth, testLine)) {
      appendLine(wrappedLines, currentLine, lineHeight);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
    if (wordIndex === words.length - 1) appendLine(wrappedLines, currentLine, lineHeight);
  });
};

const wrapParagraphText = ({ ctx, innerWidth, lineHeight, paragraphText, wrappedLines }) => {
  if (!paragraphText) {
    addEmptyLine(wrappedLines, lineHeight);
    return;
  }
  const words = paragraphText.split(" ");
  wrapWordsIntoLines({ ctx, innerWidth, lineHeight, words, wrappedLines });
};

const createPanelMetrics = (canvas) => {
  const panelPadding = 28;
  const panelWidth = Math.min(canvas.width * PANEL_WIDTH_RATIO);
  const panelX = (canvas.width - panelWidth) / 2;
  const panelY = canvas.height * PANEL_Y_RATIO;
  const panelHeight = canvas.height * PANEL_HEIGHT_RATIO;
  const innerWidth = panelWidth - panelPadding * 2;
  return { panelPadding, panelWidth, panelX, panelY, panelHeight, innerWidth };
};

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

const getFontMetrics = () => {
  const titleFontSize = TITLE_FONT_SIZE;
  const bodyFontSize = BODY_FONT_SIZE;
  const lineHeight = bodyFontSize * LINE_HEIGHT_MULTIPLIER;
  return { titleFontSize, bodyFontSize, lineHeight };
};

const drawTitleText = ({ ctx, title, panelX, panelY, panelPadding, titleFontSize }) => {
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.font = `bold ${titleFontSize}px sans-serif`;
  ctx.fillStyle = TITLE_COLOR;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(title, panelX + panelPadding, panelY + panelPadding);
};

const applyBodyFont = ({ ctx, bodyFontSize }) => {
  ctx.shadowColor = "transparent";
  ctx.font = `${bodyFontSize}px sans-serif`;
  ctx.fillStyle = BODY_COLOR;
};

const getScrollMetrics = ({ wrapped, panelY, panelHeight, panelPadding, titleFontSize, scroll }) => {
  const contentHeight = wrapped.reduce((totalHeight, lineEntry) => totalHeight + lineEntry.height, 0);
  const textStartY = panelY + panelPadding + titleFontSize + TITLE_BODY_GAP;
  const innerHeight = panelHeight - (textStartY - panelY) - panelPadding;
  const maxScroll = Math.max(0, contentHeight - innerHeight);
  const clampedScroll = Math.min(Math.max(scroll, 0), maxScroll);
  return { contentHeight, textStartY, innerHeight, maxScroll, clampedScroll };
};

const getCloseTextBounds = ({ ctx, panelX, panelY, panelWidth, panelPadding }) => {
  const closeFontSize = CLOSE_FONT_SIZE;
  ctx.font = `bold ${closeFontSize}px sans-serif`;
  const closeText = CLOSE_TEXT;
  const closeWidth = ctx.measureText(closeText).width;
  const closeHeight = closeFontSize * CLOSE_HEIGHT_MULTIPLIER;
  const closeX = panelX + panelWidth - panelPadding - closeWidth;
  const closeY = panelY + panelPadding;
  return { x: closeX, y: closeY, w: closeWidth, h: closeHeight, fontSize: closeFontSize, text: closeText };
};

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

const endContentClip = (ctx) => ctx.restore();

const isLineVisible = ({ currentY, panelY, panelPadding, lineHeight, panelHeight }) =>
  currentY > panelY + panelPadding - lineHeight && currentY < panelY + panelHeight - panelPadding + lineHeight;

const getLinePosition = (panelX, panelPadding, currentY) => ({ x: panelX + panelPadding, y: currentY });

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

const updateLinkBounds = (linkBounds, nextBounds) => (linkBounds || !nextBounds ? linkBounds : nextBounds);

const renderWrappedLine = ({ ctx, lineEntry, lineHeight, bodyFontSize, onLineRender, panelX, panelY, panelPadding, panelHeight, currentY, linkBounds }) => {
  const visible = isLineVisible({ currentY, panelY, panelPadding, lineHeight, panelHeight });
  if (!lineEntry.text || !visible) return linkBounds;
  const position = getLinePosition(panelX, panelPadding, currentY);
  const newBounds = renderLineEntry({ ctx, lineEntry, lineHeight, position, bodyFontSize, onLineRender });
  return updateLinkBounds(linkBounds, newBounds);
};

const renderWrappedLines = ({ ctx, wrapped, panelX, panelY, panelPadding, panelHeight, lineHeight, bodyFontSize, textStartY, clampedScroll, onLineRender }) => {
  let linkBounds = null;
  let currentY = textStartY - clampedScroll;
  wrapped.forEach((lineEntry) => {
    linkBounds = renderWrappedLine({ ctx, lineEntry, lineHeight, bodyFontSize, onLineRender, panelX, panelY, panelPadding, panelHeight, currentY, linkBounds });
    currentY += lineEntry.height;
  });
  return linkBounds;
};

const renderContent = ({ ctx, wrapped, panelX, panelY, panelPadding, panelHeight, lineHeight, bodyFontSize, textStartY, innerWidth, innerHeight, clampedScroll, onLineRender }) => {
  beginContentClip({ ctx, panelX, panelPadding, textStartY, innerWidth, innerHeight, bodyFontSize });
  const linkBounds = renderWrappedLines({ ctx, wrapped, panelX, panelY, panelPadding, panelHeight, lineHeight, bodyFontSize, textStartY, clampedScroll, onLineRender });
  endContentClip(ctx);
  return linkBounds;
};


const drawLegalLayout = ({ ctx, title, panelX, panelY, panelWidth, panelHeight, panelPadding, titleFontSize, bodyFontSize }) => {
  drawPanel({ ctx, panelX, panelY, panelWidth, panelHeight });
  drawTitleText({ ctx, title, panelX, panelY, panelPadding, titleFontSize });
  applyBodyFont({ ctx, bodyFontSize });
};

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
  constructor({ title, paragraphs }) {
    this.title = title;
    this.paragraphs = paragraphs;
  }

  wrapParagraphs({ ctx, innerWidth, lineHeight }) {
    const wrappedLines = [];
    this.paragraphs.forEach((paragraphText) => {
      wrapParagraphText({ ctx, innerWidth, lineHeight, paragraphText, wrappedLines });
    });
    return wrappedLines;
  }

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
