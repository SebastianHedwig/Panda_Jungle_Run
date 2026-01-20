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


export function renderImpressumScreen({ ctx, canvas, scroll = 0 }) {
  if (!ctx || !canvas) return { maxScroll: 0, closeBounds: null, linkBounds: null };

  const padding = 28;
  const panelWidth = Math.min(canvas.width * 0.8);
  const panelX = (canvas.width - panelWidth) / 2;
  const panelY = canvas.height * 0.05;
  const panelHeight = canvas.height * 0.8;
  const innerWidth = panelWidth - padding * 2;

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

  const titleFontSize = 32;
  const bodyFontSize = 16;
  const lineHeight = bodyFontSize * 1.5;

  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.font = `bold ${titleFontSize}px sans-serif`;
  ctx.fillStyle = "rgb(0, 110, 110)";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Legal Notice", panelX + padding, panelY + padding);

  ctx.shadowColor = "transparent";
  ctx.font = `${bodyFontSize}px sans-serif`;
  ctx.fillStyle = "#e4f7f7";

  const wrapped = [];
  IMPRESSUM_PARAGRAPHS.forEach((para) => {
    if (!para) {
      wrapped.push({ text: "", height: lineHeight * 0.6 });
      return;
    }
    const words = para.split(" ");
    let current = "";
    words.forEach((word, idx) => {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > innerWidth) {
        wrapped.push({ text: current, height: lineHeight });
        current = word;
      } else {
        current = test;
      }
      if (idx === words.length - 1) {
        wrapped.push({ text: current, height: lineHeight });
      }
    });
  });

  const contentHeight = wrapped.reduce((sum, line) => sum + line.height, 0);
  const textStartY = panelY + padding + titleFontSize + 24;
  const innerHeight = panelHeight - (textStartY - panelY) - padding;
  const maxScroll = Math.max(0, contentHeight - innerHeight);
  const clampedScroll = Math.min(Math.max(scroll, 0), maxScroll);

  // Close button metrics (top-right)
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

  // Reset styling for body text
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.font = `${bodyFontSize}px sans-serif`;
  ctx.fillStyle = "#e4f7f7";

  let currentY = textStartY - clampedScroll;
  wrapped.forEach((line) => {
    const visible =
      currentY > panelY + padding - lineHeight && currentY < panelY + panelHeight - padding + lineHeight;
    if (line.text && visible) {
      const isLink = line.text.includes("Click here");
      if (isLink) {
        const before = line.text.split("Click here")[0];
        const linkText = "Click here";
        const after = line.text.substring(line.text.indexOf("Click here") + linkText.length);
        const beforeWidth = ctx.measureText(before).width;
        const linkWidth = ctx.measureText(linkText).width;

        ctx.fillText(before, panelX + padding, currentY);
        ctx.save();
        ctx.font = `bold ${bodyFontSize}px sans-serif`;
        ctx.fillText(linkText, panelX + padding + beforeWidth, currentY);
        ctx.restore();
        if (after?.length) {
          ctx.fillText(after, panelX + padding + beforeWidth + linkWidth, currentY);
        }

        if (!linkBounds) {
          linkBounds = {
            x: panelX + padding + beforeWidth,
            y: currentY,
            w: linkWidth,
            h: lineHeight,
          };
        }
      } else {
        ctx.fillText(line.text, panelX + padding, currentY);
      }
    }
    currentY += line.height;
  });

  ctx.restore();

  return {
    maxScroll,
    linkBounds,
    closeBounds: { x: closeX, y: closeY, w: closeWidth, h: closeHeight, fontSize: closeFontSize, text: closeText },
  };
}
