// ─── State ───────────────────────────────────────────────────────────────────
let ZOOM = 1;
let CENTER_X = -0.5;
let CENTER_Y = 0;

let ITERATION = 200;

const LIMIT = 20;
const CELL_SIZE = [15, 10, 5, 3, 2, 1];
let CELL_IDX = 0;
let PROGRESSIVE = false;

let pressX, pressY, startCX, startCY;
const scale = () => 4 / (width * ZOOM);

let div1, div2;
let target = { centerX: CENTER_X, centerY: CENTER_Y, zoom: ZOOM, iteration: ITERATION };
let animate = false;
let animProgress = 0;
let animFrom = null;

// ─── Setup ───────────────────────────────────────────────────────────────────
function setup() {
  createCanvas(windowWidth - 10, windowHeight - 10);
  pixelDensity(1);
  div1 = document.getElementById("div1");
  div2 = document.getElementById("div2");
  startProgressive();
  drawBrot();
}

function windowResized() {
  resizeCanvas(windowWidth - 10, windowHeight - 10);
  startProgressive();
  drawBrot();
}

// ─── Easing ──────────────────────────────────────────────────────────────────
function smoothstep(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Draw loop ───────────────────────────────────────────────────────────────
function draw() {
  if (animate) {
    animProgress = min(1, animProgress + 0.01);
    const e = smoothstep(animProgress / 2.6);

    CENTER_X = lerp(CENTER_X, target.centerX, 0.3);
    CENTER_Y = lerp(CENTER_Y, target.centerY, 0.3);

    const lcur = Math.log(Math.max(ZOOM, 1e-12));
    const lto = Math.log(Math.max(target.zoom, 1e-12));
    ZOOM = Math.exp(lerp(lcur, lto, e));

    ITERATION = lerp(ITERATION, target.iteration, e);

    startProgressive();

    if (
      abs(CENTER_X - target.centerX) < 1e-8 &&
      abs(CENTER_Y - target.centerY) < 1e-8 &&
      abs(Math.log(ZOOM) - lto) < 1e-3
    ) {
      CENTER_X = target.centerX;
      CENTER_Y = target.centerY;
      ZOOM = target.zoom;
      ITERATION = target.iteration;
      animate = false;
      startProgressive();
    }
  }

  if (PROGRESSIVE) {
    drawBrot();
    if (CELL_IDX < CELL_SIZE.length - 1) {
      CELL_IDX++;
      return;
    } else {
      PROGRESSIVE = false;
      noLoop();
      return;
    }
  }

  noLoop();
}

// ─── Controls ────────────────────────────────────────────────────────────────
function keyPressed() {
  if (key == "w") {
    ITERATION += 10;
    startProgressive();
    drawBrot();
  }
  if (key == "s") {
    if (ITERATION <= 30) return;
    ITERATION -= 10;
    startProgressive();
    drawBrot();
  }
  if (key == "p") takeSnap();
  if (key == "r") resetLocation();
}

function mouseWheel(event) {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    const factor = event.delta > 0 ? 0.9 : 1.2;

    // world coords under cursor BEFORE zoom
    const s = scale();
    const wx = CENTER_X + (mouseX - width * 0.5) * s;
    const wy = CENTER_Y + (mouseY - height * 0.5) * s;

    ZOOM *= factor;
    ZOOM = max(ZOOM, 1);
    ZOOM = min(ZOOM, 120657239077606);

    // shift center so the point under cursor stays fixed
    const sNew = scale();
    CENTER_X = wx - (mouseX - width * 0.5) * sNew;
    CENTER_Y = wy - (mouseY - height * 0.5) * sNew;

    startProgressive();
    drawBrot();
  }
}

function mousePressed() {
  if (mouseButton === CENTER) {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
      pressX = mouseX;
      pressY = mouseY;
      startCX = CENTER_X;
      startCY = CENTER_Y;
      startProgressive();
    }
  }
}

function mouseDragged() {
  if (mouseButton === CENTER) {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
      const s = scale();
      CENTER_X = startCX - (mouseX - pressX) * s;
      CENTER_Y = startCY - (mouseY - pressY) * s;
      startProgressive();
      drawBrot();
    }
  }
}

function mouseReleased() {
  if (mouseButton === CENTER) {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height)
      startProgressive();
  }
}

// ─── Navigation ──────────────────────────────────────────────────────────────
function updateLocation() {
  CENTER_X = map(mouseX, 0, width, -1.3, 0.7);
  CENTER_Y = map(mouseY, 0, height, -1.3, 1.3);
  drawBrot();
}

function resetLocation() {
  CENTER_X = -0.5;
  CENTER_Y = 0;
  ZOOM = 1;
  ITERATION = 200;
  startProgressive();
  drawBrot();
}

function setLocation() {
  resetLocation();
  animFrom = getLocation();
  animProgress = 0;
  const gallery = document.getElementById("gallery");
  const loc = locations[gallery.value];
  target = loc;
  animate = true;
  loop();
}

function takeSnap() { saveCanvas("mandelbrot.jpg"); }

function getLocation() {
  return { zoom: ZOOM, centerX: CENTER_X, centerY: CENTER_Y, iteration: ITERATION };
}

// ─── Renderer ────────────────────────────────────────────────────────────────
function drawBrot() {
  const xMin = CENTER_X - 2 / ZOOM;
  const xMax = CENTER_X + 2 / ZOOM;
  const yMin = CENTER_Y - (2 * height / width) / ZOOM;
  const yMax = CENTER_Y + (2 * height / width) / ZOOM;
  const LIMIT2 = LIMIT * LIMIT;

  loadPixels();

  const xRange = xMax - xMin;
  const yRange = yMax - yMin;
  const cellS = CELL_SIZE[CELL_IDX] || 1;
  const maxIter =   floor(getAdaptiveIterations());;

  for (let x = 0; x < width; x += cellS) {
    for (let y = 0; y < height; y += cellS) {
      let a = xMin + ((x + cellS / 2) / width) * xRange;
      let b = yMin + ((y + cellS / 2) / height) * yRange;
      const oa = a, ob = b;
      let n = 0;

      while (n < maxIter) {
        const aa = a * a - b * b;
        const bb = 2 * a * b;
        a = aa + oa;
        b = bb + ob;
        if (a * a + b * b > LIMIT2) break;
        n++;
      }

      const mag = Math.sqrt(a * a + b * b);
      const smooth = n + 1 - Math.log2(Math.log2(mag));

      const bright = n >= maxIter ? 0 : map(n, 0, maxIter, 0, 255);
      // const bright = smooth;
      drawPixel(x, y, bright, maxIter, cellS);
    }
  }

  updatePixels();

  fill(255);
  stroke(1);
  textSize(12);
  div1.innerHTML = `Zoom: ${floor(ZOOM)}; Details: ${Math.round(ITERATION)}`;
  div2.innerHTML = `X: ${CENTER_X}; Y: ${CENTER_Y}`;
}

function getAdaptiveIterations() {
    ITERATION =  max(
        ITERATION,
        200 + Math.log10(ZOOM) * 60
    );
    return ITERATION
}

// ─── Color ───────────────────────────────────────────────────────────────────
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

function drawPixel(i, j, n, maxIter, cellS) {
  const col = getColor(n, maxIter);
  for (let x = 0; x < cellS; x++) {
    for (let y = 0; y < cellS; y++) {
      const idx = (i + x + (j + y) * width) * 4;
      pixels[idx] = col[0];
      pixels[idx + 1] = col[1];
      pixels[idx + 2] = col[2];
      pixels[idx + 3] = 255;
    }
  }
}

// ─── Progressive rendering ───────────────────────────────────────────────────
function startProgressive() {
  CELL_IDX = animate ? 2 : 0;
  PROGRESSIVE = true;
  loop();
}