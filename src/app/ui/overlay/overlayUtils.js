function getBackButtonBaseRect({ sprite, targetSize, containerX, containerY, containerHeight, margin, extraOffsetY }) {
  const baseScale = targetSize / sprite.w;
  const iconW = sprite.w * baseScale;
  const iconH = sprite.h * baseScale;
  const iconX = containerX + margin;
  const iconY = containerY + containerHeight - iconH - margin - extraOffsetY;
  return { x: iconX, y: iconY, w: iconW, h: iconH };
}

function isPointerInsideRect(pointer, rect) {
  return !!pointer && pointer.x >= rect.x && pointer.x <= rect.x + rect.w && pointer.y >= rect.y && pointer.y <= rect.y + rect.h;
}

function getScaledRect(rect, scale) {
  const drawW = rect.w * scale;
  const drawH = rect.h * scale;
  const drawX = rect.x - (drawW - rect.w) / 2;
  const drawY = rect.y - (drawH - rect.h) / 2;
  return { x: drawX, y: drawY, w: drawW, h: drawH };
}

function drawBackButtonSprite(ctx, uiImage, sprite, rect, shadow) {
  ctx.save();
  ctx.shadowColor = shadow.color;
  ctx.shadowBlur = shadow.blur;
  ctx.shadowOffsetX = shadow.offsetX;
  ctx.shadowOffsetY = shadow.offsetY;
  ctx.drawImage(uiImage, sprite.x, sprite.y, sprite.w, sprite.h, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

export function renderBackButton({
  ctx, uiImage, sprite, pointer, containerX, containerY, containerHeight, targetSize, margin, extraOffsetY = 0, hoverScale = 1,
  shadow = { color: "rgba(0, 0, 0, 0.45)", blur: 10, offsetX: 0, offsetY: 3 },
}) {
  if (!ctx || !uiImage?.naturalWidth || !sprite) return { bounds: null, isHover: false };
  const baseRect = getBackButtonBaseRect({
    sprite, targetSize, containerX, containerY, containerHeight, margin, extraOffsetY
  });
  const isHover = isPointerInsideRect(pointer, baseRect);
  const drawRect = getScaledRect(baseRect, isHover ? hoverScale : 1);
  drawBackButtonSprite(ctx, uiImage, sprite, drawRect, shadow);
  return { bounds: drawRect, isHover };
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
