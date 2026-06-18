//worker.js
console.log("worker loaded");
const LIMIT = 20;
const LIMIT2 = LIMIT * LIMIT;

const palette = [
  [0, 2, 0],
  [32, 107, 203],
  [237, 255, 255],
  [255, 170, 0],
  [255, 70, 0],
  [180, 0, 180],
];

function lerpRGB(c1, c2, t) {
  return [
    c1[0] + (c2[0] - c1[0]) * t,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t,
  ];
}

function getColor(n, maxIter) {
  let t = (n / maxIter) % 1;
  let idx = Math.floor(t * (palette.length - 1));
  let frac = t * (palette.length - 1) - idx;
  return lerpRGB(palette[idx], palette[idx + 1] || palette[idx], frac);
}

self.onmessage = function (e) {
  const { centerX, centerY, zoom, iteration, width, height, cellS, offX, offY } = e.data;

  const xMin = centerX - 2 / zoom;
  const xMax = centerX + 2 / zoom;
  const yMin = centerY - (2 * height / width) / zoom;
  const yMax = centerY + (2 * height / width) / zoom;
  const xRange = xMax - xMin;
  const yRange = yMax - yMin;
  const maxIter = Math.floor(iteration);

  const pixels = new Uint8ClampedArray(width * height * 4);

  for (let x = offX; x < width; x += cellS) {
    for (let y = offY; y < height; y += cellS) {

      let a = xMin + ((x + cellS / 2) / width) * xRange;
      let b = yMin + ((y + cellS / 2) / height) * yRange;
      const oa = a, ob = b;
      let n = 0;
      let escaped = false;

      while (n < maxIter) {
        const aa = a * a - b * b;
        const bb = 2 * a * b;
        a = aa + oa;
        b = bb + ob;
        if (a * a + b * b > LIMIT2) { escaped = true; break; }
        n++;
      }

      let shade = 1;
      if (escaped) {
        const logMag = Math.log(a * a + b * b) * 0.5;
        shade = Math.min(Math.max(0.7 + logMag * 0.14, 0.7), 1.4);
      }

      const bright = n >= maxIter ? 0 : n * 255 / maxIter;
      const col = getColor(bright, 255);
      col[0] *= shade;
      col[1] *= shade;
      col[2] *= shade;

      // fill cellS x cellS block
      for (let cx = 0; cx < cellS; cx++) {
        const px = x + cx;
        if (px >= width) break;
        for (let cy = 0; cy < cellS; cy++) {
          const py = y + cy;
          if (py >= height) break;
          const idx = (px + py * width) * 4;
          pixels[idx]     = col[0];
          pixels[idx + 1] = col[1];
          pixels[idx + 2] = col[2];
          pixels[idx + 3] = 255;
        }
      }
    }
  }

  // transfer the buffer back (zero-copy)
  self.postMessage({ pixels, cellS }, [pixels.buffer]);
};