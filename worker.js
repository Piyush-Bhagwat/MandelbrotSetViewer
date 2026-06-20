//worker.js
console.log("worker loaded");
const LIMIT = 20;
const LIMIT2 = LIMIT * LIMIT;

const palettes = {
  original:   [[0,2,0],[32,107,203],[237,255,255],[255,170,0],[255,70,0],[180,0,180]],
  pastel:     [[15,15,20],[180,160,220],[255,210,200],[180,230,210],[255,240,180],[200,180,240]],
  bnw:        [[0,0,0],[40,40,40],[120,120,120],[200,200,200],[255,255,255],[80,80,80]],
  ocean:      [[0,5,20],[0,40,80],[0,120,160],[0,200,180],[255,240,100],[0,80,120]],
  lava:       [[5,0,0],[120,10,0],[220,50,0],[255,160,0],[255,255,180],[80,5,0]],
  synthwave:  [[10,0,20],[120,0,180],[220,0,150],[0,200,255],[255,240,0],[60,0,120]],
  forest:     [[5,15,5],[20,60,20],[60,120,40],[120,180,60],[220,210,120],[30,80,30]],
};

function iterate(formula, a, b, oa, ob) {
  let aa, bb;
  switch(formula) {
    case 'burning':
      aa = a*a - b*b;
      bb = 2 * Math.abs(a) * Math.abs(b);
      break;
    case 'tricorn':
      aa = a*a - b*b;
      bb = -2 * a * b;
      break;
    case 'power3':
      aa = a*a*a - 3*a*b*b;
      bb = 3*a*a*b - b*b*b;
      break;
    case 'perpendicular':
      aa = a*a - b*b;
      bb = -2 * Math.abs(a) * b;
      break;
    case 'omlet':
       aa = a*a - b*b;
      bb = 1*a*b;
      break;
    case 'linear':
      aa = a*a - b*b;
      bb = 2*a*b;
      return [aa + a + oa, bb + b + ob];  // different update
    default: // mandelbrot
      aa = a*a - b*b;
      bb = 2*a*b;
  }
  return [aa + oa, bb + ob];
}

function lerpRGB(c1, c2, t) {
  return [
    c1[0] + (c2[0] - c1[0]) * t,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t,
  ];
}

function getColor(n, maxIter, palette) {  // palette passed in now
  let t   = (n / maxIter) % 1;
  let idx  = Math.floor(t * (palette.length - 1));
  let frac = t * (palette.length - 1) - idx;
  return lerpRGB(palette[idx], palette[idx + 1] || palette[idx], frac);
}

self.onmessage = function (e) {
  const { centerX, centerY, zoom, iteration, width, height, cellS, offX, offY, formula, colorScheme } = e.data;
const palette = palettes[colorScheme] || palettes.original;
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
        [a, b] = iterate(formula, a, b, oa, ob);
        if (a * a + b * b > LIMIT2) { escaped = true; break; }
        n++;
      }

      let shade = 1;
      if (escaped) {
        const logMag = Math.log(a * a + b * b) * 0.5;
        shade = Math.min(Math.max(0.7 + logMag * 0.14, 0.7), 1.4);
      }

      const bright = n >= maxIter ? 0 : n * 255 / maxIter;
      const col = getColor(bright, 255, palette);
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
          pixels[idx] = col[0];
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