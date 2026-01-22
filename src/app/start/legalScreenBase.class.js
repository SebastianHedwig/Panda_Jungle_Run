export class LegalScreenBase {
  constructor({ title, paragraphs }) {
    this.title = title;
    this.paragraphs = paragraphs;
  }

  wrapParagraphs({ ctx, innerWidth, lineHeight }) {
    const wrappedLines = [];
    this.paragraphs.forEach((paragraphText) => {
      if (!paragraphText) {
        wrappedLines.push({ text: "", height: lineHeight * 0.6 });
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
      return { maxScroll: 0, closeBounds: null, linkBounds: null };
    }

    const padding = 28;
    const panelWidth = Math.min(canvas.width * 0.8);
    const panelX = (canvas.width - panelWidth) / 2;
    const panelY = canvas.height * 0.05;
    const panelHeight = canvas.height * 0.8;
    const innerWidth = panelWidth - padding * 2;

    // Panel
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.strokeStyle = "rgba(0, 110, 110, 0.8)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 10;
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Fonts
    const titleFontSize = 32;
    const bodyFontSize = 16;
    const lineHeight = bodyFontSize * 1.5;

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    ctx.font = `bold ${titleFontSize}px sans-serif`;
    ctx.fillStyle = "rgb(0, 110, 110)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(this.title, panelX + padding, panelY + padding);

    ctx.shadowColor = "transparent";
    ctx.font = `${bodyFontSize}px sans-serif`;
    ctx.fillStyle = "#e4f7f7";

    const wrapped = this.wrapParagraphs({ ctx, innerWidth, lineHeight });

    const contentHeight = wrapped.reduce(
      (totalHeight, lineEntry) => totalHeight + lineEntry.height,
      0
    );
    const textStartY = panelY + padding + titleFontSize + 24;
    const innerHeight = panelHeight - (textStartY - panelY) - padding;
    const maxScroll = Math.max(0, contentHeight - innerHeight);
    const clampedScroll = Math.min(Math.max(scroll, 0), maxScroll);

    const closeFontSize = 18;
    ctx.font = `bold ${closeFontSize}px sans-serif`;
    const closeText = "Close";
    const closeWidth = ctx.measureText(closeText).width;
    const closeHeight = closeFontSize * 1.2;
    const closeX = panelX + panelWidth - padding - closeWidth;
    const closeY = panelY + padding;

    let linkBounds = null;

    ctx.save();
    ctx.beginPath();
    ctx.rect(panelX + padding, textStartY, innerWidth, innerHeight);
    ctx.clip();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.font = `${bodyFontSize}px sans-serif`;
    ctx.fillStyle = "#e4f7f7";

    let currentY = textStartY - clampedScroll;
    wrapped.forEach((lineEntry) => {
      const visible =
        currentY > panelY + padding - lineHeight &&
        currentY < panelY + panelHeight - padding + lineHeight;
      if (lineEntry.text && visible) {
        if (onLineRender) {
          const result = onLineRender({
            ctx,
            lineEntry,
            lineHeight,
            position: { x: panelX + padding, y: currentY },
            fonts: { bodyFontSize },
          });
          if (result?.handled) {
            if (!linkBounds && result.linkBounds) {
              linkBounds = result.linkBounds;
            }
          } else {
            ctx.fillText(lineEntry.text, panelX + padding, currentY);
          }
        } else {
          ctx.fillText(lineEntry.text, panelX + padding, currentY);
        }
      }
      currentY += lineEntry.height;
    });

    ctx.restore();

    return {
      maxScroll,
      linkBounds,
      closeBounds: { x: closeX, y: closeY, w: closeWidth, h: closeHeight, fontSize: closeFontSize, text: closeText },
    };
  }
}
