export function renderBackButton({
  ctx,
  uiImage,
  sprite,
  pointer,
  containerX,
  containerY,
  containerHeight,
  targetSize,
  margin,
  extraOffsetY = 0,
  hoverScale = 1,
  shadow = { color: "rgba(0, 0, 0, 0.45)", blur: 10, offsetX: 0, offsetY: 3 },
}) {
  if (!ctx || !uiImage?.naturalWidth || !sprite) return { bounds: null, isHover: false };

  const baseScale = targetSize / sprite.w;
  const iconW = sprite.w * baseScale;
  const iconH = sprite.h * baseScale;
  const iconX = containerX + margin;
  const iconY = containerY + containerHeight - iconH - margin - extraOffsetY;

  const isHover =
    !!pointer &&
    pointer.x >= iconX &&
    pointer.x <= iconX + iconW &&
    pointer.y >= iconY &&
    pointer.y <= iconY + iconH;
  const drawScale = isHover ? hoverScale : 1;
  const drawW = iconW * drawScale;
  const drawH = iconH * drawScale;
  const drawX = iconX - (drawW - iconW) / 2;
  const drawY = iconY - (drawH - iconH) / 2;

  ctx.save();
  ctx.shadowColor = shadow.color;
  ctx.shadowBlur = shadow.blur;
  ctx.shadowOffsetX = shadow.offsetX;
  ctx.shadowOffsetY = shadow.offsetY;
  ctx.drawImage(
    uiImage,
    sprite.x,
    sprite.y,
    sprite.w,
    sprite.h,
    drawX,
    drawY,
    drawW,
    drawH
  );
  ctx.restore();

  return { bounds: { x: drawX, y: drawY, w: drawW, h: drawH }, isHover };
}

export function applyOverlayTextStyle(
  ctx,
  { fill = "rgb(0, 110, 110)", shadowColor = "rgba(0, 0, 0, 0)", shadowBlur = 0 } = {}
) {
  ctx.fillStyle = fill;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = shadowBlur;
}
