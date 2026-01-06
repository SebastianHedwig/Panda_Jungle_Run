export class Menu {
  constructor({ backgroundImage } = {}) {
    this.backgroundImage = backgroundImage || null;
  }

  render(ctx, canvas) {
    const img = this.backgroundImage;
    if (!ctx || !canvas || !img || img.naturalWidth === 0) return;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const maxW = canvas.width * 0.9;
    const maxH = canvas.height * 0.9;
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 2);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const x = (canvas.width - drawW) / 2;
    const y = (canvas.height - drawH) / 2;

    ctx.drawImage(img, x, y, drawW, drawH);
    ctx.restore();
  }
}
