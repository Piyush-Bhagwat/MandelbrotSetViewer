//worker.js
console.log("worker loaded");
const LIMIT = 20;
const LIMIT2 = LIMIT * LIMIT;

//orignal
// const palette = [
//   [0, 2, 0],
//   [32, 107, 203],
//   [237, 255, 255],
//   [255, 170, 0],
//   [255, 70, 0],
//   [180, 0, 180],
// ];

//pastel
// const palette = [
//   [15,  15,  20],   // near black
//   [180, 160, 220],  // lavender
//   [255, 210, 200],  // peach
//   [180, 230, 210],  // mint
//   [255, 240, 180],  // butter yellow
//   [200, 180, 240],  // soft violet
// ];

//BnW
// const palette = [
//   [0,   0,   0],    // black
//   [40,  40,  40],   // dark gray
//   [120, 120, 120],  // mid gray
//   [200, 200, 200],  // light gray
//   [255, 255, 255],  // white
//   [80,  80,  80],   // back to dark
// ];

//deepOcean
// const palette = [
//   [0,   5,   20],   // abyss
//   [0,   40,  80],   // deep blue
//   [0,   120, 160],  // teal
//   [0,   200, 180],  // cyan
//   [255, 240, 100],  // bioluminescent yellow
//   [0,   80,  120],  // back to deep
// ];

//lava
// const palette = [
//   [5,   0,   0],    // near black
//   [120, 10,  0],    // dark red
//   [220, 50,  0],    // lava orange
//   [255, 160, 0],    // molten yellow
//   [255, 255, 180],  // hot white
//   [80,  5,   0],    // cooling red
// ];

//ynthwave
// const palette = [
//   [10,  0,   20],   // deep purple-black
//   [120, 0,   180],  // purple
//   [220, 0,   150],  // hot pink
//   [0,   200, 255],  // cyan
//   [255, 240, 0],    // neon yellow
//   [60,  0,   120],  // back to dark purple
// ];

//forestt
const palette = [
  [5,   15,  5],    // near black green
  [20,  60,  20],   // dark forest
  [60,  120, 40],   // moss
  [120, 180, 60],   // leaf green
  [220, 210, 120],  // sunlight
  [30,  80,  30],   // back to forest
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
        const aa = a * a  - b * b;
        const bb = 2 * a * b; //orig
        //----burningShip
        // const aa = a*a - b*b;
        // const bb = 2 * Math.abs(a) * Math.abs(b);
        //----tricorn
        // const aa = a * a - b * b;
        // const bb = -2 * a * b;
        //----power3
        // const aa = a * a * a - 3 * a * b * b;
        // const bb = 3 * a * a * b - b * b * b;

        //----prependicular brot
        // const aa = a * a - b * b;
        // const bb = - 2 * Math.abs(a) * b;  // <-- abs on a only, negative
        a = aa + oa;
        b = bb + ob;


        //---- linear term
        // const aa = a * a - b * b;
        // const bb = 2 * a * b;
        // a = aa + a + oa;   // <-- + a
        // b = bb + b + ob;   // <-- + b
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