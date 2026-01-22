import { LegalScreenBase } from "./legalScreenBase.class";

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

const impressumScreenBase = new LegalScreenBase({
  title: "Legal Notice",
  paragraphs: IMPRESSUM_PARAGRAPHS,
});

export function renderImpressumScreen({ ctx, canvas, scroll = 0 }) {
  return impressumScreenBase.render({
    ctx,
    canvas,
    scroll,
    onLineRender: ({ ctx: renderCtx, lineEntry, lineHeight, position, fonts }) => {
      const linkText = "Click here";
      const isLink = lineEntry.text.includes(linkText);
      if (!isLink) return null;

      const before = lineEntry.text.split(linkText)[0];
      const after = lineEntry.text.substring(lineEntry.text.indexOf(linkText) + linkText.length);
      const beforeWidth = renderCtx.measureText(before).width;
      const linkWidth = renderCtx.measureText(linkText).width;

      renderCtx.fillText(before, position.x, position.y);
      renderCtx.save();
      renderCtx.font = `bold ${fonts.bodyFontSize}px sans-serif`;
      renderCtx.fillText(linkText, position.x + beforeWidth, position.y);
      renderCtx.restore();
      if (after?.length) {
        renderCtx.fillText(after, position.x + beforeWidth + linkWidth, position.y);
      }

      return {
        handled: true,
        linkBounds: {
          x: position.x + beforeWidth,
          y: position.y,
          w: linkWidth,
          h: lineHeight,
        },
      };
    },
  });
}
