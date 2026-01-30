export function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

export function loadFrames(path, prefix, count, { pad = 3 } = {}) {
  return [...Array(count)].map((_, frameIndex) =>
    loadImage(`${path}${prefix}${String(frameIndex).padStart(pad, "0")}.png`)
  );
}

export function waitForImage(img) {
  return new Promise((resolve) => {
    const finish = (ok) => resolve({ ok, img });
    if (img.complete) {finish(img.naturalWidth > 0 && img.naturalHeight > 0);
      return;
    }
    img.onload = () => finish(true);
    img.onerror = () => {
      console.warn("Image failed to load", img?.src || img);
      finish(false);
    };
  });
}
