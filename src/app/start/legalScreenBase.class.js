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

export class LegalScreenBase {
  constructor({ title, paragraphs }) {
    this.title = title;
    this.paragraphs = paragraphs;
  }

  wrapParagraphs({ ctx, innerWidth, lineHeight }) {
    const wrappedLines = [];
    this.paragraphs.forEach((paragraphText) => {
      if (!paragraphText) {
        wrappedLines.push({ text: "", height: lineHeight * EMPTY_LINE_RATIO });
        return;
      }
      const words = paragraphText.split(" ");
      let currentLine = "";
      words.forEach((word, wordIndex) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > innerWidth) {
          wrappedLines.push({ text: currentLine, height: lineHeight });
          currentLine = word;
        } else {
          currentLine = testLine;
        }
        if (wordIndex === words.length - 1) {
          wrappedLines.push({ text: currentLine, height: lineHeight });
        }
      });
    });
    return wrappedLines;
  }

  render({ ctx, canvas, scroll = 0, onLineRender }) {
    if (!ctx || !canvas) {
      return { maxScroll: 0, closeTextBounds: null, linkBounds: null };
    }

    const panelPadding = 28;
    const panelWidth = Math.min(canvas.width * PANEL_WIDTH_RATIO);
    const panelX = (canvas.width - panelWidth) / 2;
    const panelY = canvas.height * PANEL_Y_RATIO;
    const panelHeight = canvas.height * PANEL_HEIGHT_RATIO;
    const innerWidth = panelWidth - panelPadding * 2;

    // Panel
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

    // Fonts
    const titleFontSize = TITLE_FONT_SIZE;
    const bodyFontSize = BODY_FONT_SIZE;
    const lineHeight = bodyFontSize * LINE_HEIGHT_MULTIPLIER;

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    ctx.font = `bold ${titleFontSize}px sans-serif`;
    ctx.fillStyle = TITLE_COLOR;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(this.title, panelX + panelPadding, panelY + panelPadding);

    ctx.shadowColor = "transparent";
    ctx.font = `${bodyFontSize}px sans-serif`;
    ctx.fillStyle = BODY_COLOR;

    const wrapped = this.wrapParagraphs({ ctx, innerWidth, lineHeight });

    const contentHeight = wrapped.reduce((totalHeight, lineEntry) => totalHeight + lineEntry.height, 0);
    const textStartY = panelY + panelPadding + titleFontSize + TITLE_BODY_GAP;
    const innerHeight = panelHeight - (textStartY - panelY) - panelPadding;
    const maxScroll = Math.max(0, contentHeight - innerHeight);
    const clampedScroll = Math.min(Math.max(scroll, 0), maxScroll);

    const closeFontSize = CLOSE_FONT_SIZE;
    ctx.font = `bold ${closeFontSize}px sans-serif`;
    const closeText = CLOSE_TEXT;
    const closeWidth = ctx.measureText(closeText).width;
    const closeHeight = closeFontSize * CLOSE_HEIGHT_MULTIPLIER;
    const closeX = panelX + panelWidth - panelPadding - closeWidth;
    const closeY = panelY + panelPadding;

    let linkBounds = null;

    ctx.save();
    ctx.beginPath();
    ctx.rect(panelX + panelPadding, textStartY, innerWidth, innerHeight);
    ctx.clip();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.font = `${bodyFontSize}px sans-serif`;
    ctx.fillStyle = "#e4f7f7";

    let currentY = textStartY - clampedScroll;
    wrapped.forEach((lineEntry) => {
      const visible =
        currentY > panelY + panelPadding - lineHeight &&
        currentY < panelY + panelHeight - panelPadding + lineHeight;
      if (lineEntry.text && visible) {
        if (onLineRender) {
          const result = onLineRender({
            ctx,
            lineEntry,
            lineHeight,
            position: { x: panelX + panelPadding, y: currentY },
            fonts: { bodyFontSize },
          });
          if (result?.handled) {
            if (!linkBounds && result.linkBounds) {
              linkBounds = result.linkBounds;
            }
          } else {
            ctx.fillText(lineEntry.text, panelX + panelPadding, currentY);
          }
        } else {
          ctx.fillText(lineEntry.text, panelX + panelPadding, currentY);
        }
      }
      currentY += lineEntry.height;
    });

    ctx.restore();

    return {
      maxScroll,
      linkBounds,
      closeTextBounds: {
        x: closeX,
        y: closeY,
        w: closeWidth,
        h: closeHeight,
        fontSize: closeFontSize,
        text: closeText,
      },
    };
  }
}
