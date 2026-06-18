//sketch.js
// ─── State ───────────────────────────────────────────────────────────────────
let ZOOM = 1;
let CENTER_X = -0.5;
let CENTER_Y = 0;
let currentFormula = 'mandelbrot';
let currentColor   = 'original';
let renderTime = 0;
let vx = 0;
let vy = 0;
let orbitPoints = [];
let showOrbit = false;
let prevMouseX = 0;
let prevMouseY = 0;
let inertialMove = false;
let divZoom, divIter, divRender, divPos;
let ITERATION = 200;

const LIMIT = 20;
const CELL_SIZE = [32, 16, 8, 4, 2, 1];
const PASS_OFFSETS = [
  [0, 0],
  [16, 0],
  [0, 16],
  [16, 16],
  [8, 8],
  [4, 4]
];
let CELL_IDX = 0;
let PROGRESSIVE = false;

let pressX, pressY, startCX, startCY;
const scale = () => 4 / (width * ZOOM);

let div1, div2;
let target = { centerX: CENTER_X, centerY: CENTER_Y, zoom: ZOOM, iteration: ITERATION };
let animate = false;
let animProgress = 0;
let animFrom = null;

// ─── Worker ──────────────────────────────────────────────────────────────────
let worker;
let workerBusy = false;
let pendingRequest = null;  // holds the latest params if worker is busy

// ─── Setup ───────────────────────────────────────────────────────────────────
function setup() {
  createCanvas(windowWidth - 10, windowHeight - 10);
  pixelDensity(1);
  divZoom = document.getElementById("div-zoom");
  divIter = document.getElementById("div-iter");
  divRender = document.getElementById("div-render");
  divPos = document.getElementById("div-pos");
  worker = new Worker('worker.js');
  worker.onerror = (e) => console.error("Worker error:", e);
  worker.onmessage = onWorkerMessage;

  startProgressive();
  drawBrot();
}

function windowResized() {
  resizeCanvas(windowWidth - 10, windowHeight - 10);
  startProgressive();
  drawBrot();
}

function onWorkerMessage(e) {
  const { pixels: workerPixels, cellS } = e.data;

  workerBusy = false;

  // write pixels into p5 buffer
  loadPixels();
  pixels.set(workerPixels);
  updatePixels();

  renderTime = performance.now() - renderTime;

  if (cellS === CELL_SIZE[CELL_SIZE.length - 2]) {
    divZoom.textContent = ZOOM.toExponential(3);
    divIter.textContent = Math.floor(getIterations());
    divRender.textContent = renderTime.toFixed(1) + ' ms';
  }
  divPos.textContent = `${CENTER_X.toFixed(8)}, ${CENTER_Y.toFixed(8)}`;

  drawOrbit();

  // if a newer request came in while worker was busy, fire it now
  if (pendingRequest) {
    const req = pendingRequest;
    pendingRequest = null;
    dispatchWorker(req);
    return;
  }

  // advance progressive pass
  if (PROGRESSIVE) {
    if (CELL_IDX < CELL_SIZE.length - 1) {
      CELL_IDX++;
      drawBrot();
    } else {
      PROGRESSIVE = false;
      noLoop();
    }
  }
}

function dispatchWorker(params) {
  if (workerBusy) {
    pendingRequest = params;
    return;
  }
  workerBusy = true;
  renderTime = performance.now();
  worker.postMessage(params);
}

// ─── Renderer ────────────────────────────────────────────────────────────────
function drawBrot() {
  const cellS = CELL_SIZE[CELL_IDX] || 1;
  const [offX, offY] = PASS_OFFSETS[CELL_IDX] || [0, 0];

  dispatchWorker({
    centerX: CENTER_X,
    centerY: CENTER_Y,
    zoom: ZOOM,
    iteration: getIterations(),
    width,
    height,
    cellS,
    offX,
    offY,
    formula: currentFormula,   // e.g. "mandelbrot"
    colorScheme: currentColor
  });
}

function drawOrbit() {
  if (!showOrbit) return;

  const w = width;
  const h = height;
  const invScale = 1 / scale();

  stroke(35, 30, 180);
  strokeWeight(2);
  noFill();
  beginShape();
  for (const p of orbitPoints) {
    const sx = w / 2 + (p[0] - CENTER_X) * invScale;
    const sy = h / 2 + (p[1] - CENTER_Y) * invScale;
    vertex(sx, sy);
  }
  endShape();

  fill(255, 0, 0);
  for (const p of orbitPoints) {
    const sx = w / 2 + (p[0] - CENTER_X) * invScale;
    const sy = h / 2 + (p[1] - CENTER_Y) * invScale;
    circle(sx, sy, 4);
  }
}

function getIterations() {
  ITERATION = 200 + Math.log10(ZOOM) * 100;
  return ITERATION;
}

// ─── Draw loop ───────────────────────────────────────────────────────────────
function draw() {
  if (inertialMove) {
    const s = scale();
    CENTER_X -= vx * s;
    CENTER_Y -= vy * s;
    vx *= 0.5;
    vy *= 0.5;
    CELL_IDX = 3;
    drawBrot();
    if (Math.abs(vx) < 0.5 && Math.abs(vy) < 0.5) {
      inertialMove = false;
      startProgressive();
    }
  }

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

  if (PROGRESSIVE && !workerBusy) {
    drawBrot();
    if (CELL_IDX < CELL_SIZE.length - 1) {
      CELL_IDX++;
    } else {
      PROGRESSIVE = false;
      noLoop();
    }
    return;
  }

  if (!animate && !inertialMove) noLoop();
}

// ─── Easing ──────────────────────────────────────────────────────────────────
function smoothstep(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Controls ────────────────────────────────────────────────────────────────
function keyPressed() {
  if (key == "w") { ITERATION += 10; startProgressive(); drawBrot(); }
  if (key == "s") { if (ITERATION <= 30) return; ITERATION -= 10; startProgressive(); drawBrot(); }
  if (key == "p") takeSnap();
  if (key == "r") resetLocation();
}

function mouseWheel(event) {
  if (event.target.closest('#panel')) return; 
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    const factor = event.delta > 0 ? 0.9 : 1.2;
    const s = scale();
    const wx = CENTER_X + (mouseX - width * 0.5) * s;
    const wy = CENTER_Y + (mouseY - height * 0.5) * s;
    ZOOM *= factor;
    ZOOM = max(ZOOM, 1);
    ZOOM = min(ZOOM, 120657239077606);
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
      pressX = mouseX; pressY = mouseY;
      startCX = CENTER_X; startCY = CENTER_Y;
      prevMouseX = mouseX; prevMouseY = mouseY;
      vx = 0; vy = 0;
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
      vx = mouseX - prevMouseX;
      vy = mouseY - prevMouseY;
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      startProgressive();
      drawBrot();
    }
  }
}

function mouseReleased() {
  if (mouseButton === CENTER) {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height)
      inertialMove = true;
    loop();
  }
}

function mouseClicked() {
  if (!keyIsDown(SHIFT)) return;

  orbitPoints = [];
  const s = scale();
  const cx = CENTER_X + (mouseX - width / 2) * s;
  const cy = CENTER_Y + (mouseY - height / 2) * s;
  let a = 0, b = 0;
  orbitPoints.push([a, b]);

  for (let i = 0; i < 500; i++) {
    const aa = a * a - b * b + cx;
    const bb = 2 * a * b + cy;
    a = aa; b = bb;
    orbitPoints.push([a, b]);
    if (a * a + b * b > LIMIT * LIMIT) break;
  }

  showOrbit = true;
  startProgressive();
}

function doubleClicked() {
  const s = scale();
  const wx = CENTER_X + (mouseX - width / 2) * s;
  const wy = CENTER_Y + (mouseY - height / 2) * s;
  ZOOM *= 2;
  const sNew = scale();
  CENTER_X = wx - (mouseX - width / 2) * sNew;
  CENTER_Y = wy - (mouseY - height / 2) * sNew;
  startProgressive();
}

let lastTouchDist = null;
let touchStartCX, touchStartCY, touchStartX, touchStartY;

function touchStarted(event) {
  console.log(event.target);
  if (event.target.closest('#panel')) return; 

  if (touches.length === 1) {
    touchStartX  = touches[0].x;
    touchStartY  = touches[0].y;
    touchStartCX = CENTER_X;  // anchor, never update during drag
    touchStartCY = CENTER_Y;
    vx = 0; vy = 0;
  }
  if (touches.length === 2) {
    lastTouchDist = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
  }
  return;
}

function touchMoved(event) {
   if (event.target.closest('#panel')) return; 

   if (touches.length === 1) {
    const s = scale();
    // offset from anchor, not delta
    CENTER_X = touchStartCX - (touches[0].x - touchStartX) * s;
    CENTER_Y = touchStartCY - (touches[0].y - touchStartY) * s;
    startProgressive();
    drawBrot();
  }
  if (touches.length === 2) {
    const d = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
    if (lastTouchDist) {
      const factor = d / lastTouchDist;
      const mx = (touches[0].x + touches[1].x) / 2;
      const my = (touches[0].y + touches[1].y) / 2;
      const s  = scale();
      const wx = CENTER_X + (mx - width  * 0.5) * s;
      const wy = CENTER_Y + (my - height * 0.5) * s;
      ZOOM *= factor;
      ZOOM = constrain(ZOOM, 1, 120657239077606);
      const sNew = scale();
      CENTER_X = wx - (mx - width  * 0.5) * sNew;
      CENTER_Y = wy - (my - height * 0.5) * sNew;
      startProgressive();
      drawBrot();
    }
    lastTouchDist = d;
  }
  return;
}

function touchEnded() {
  lastTouchDist = null;
  if (touches.length === 0) {
    inertialMove = true;
    loop();
  }
  return;
}

// ─── Navigation ──────────────────────────────────────────────────────────────
function resetLocation() {
  CENTER_X = -0.5; CENTER_Y = 0; ZOOM = 1; ITERATION = 200;
  startProgressive();
  drawBrot();
}

function setLocation() {
  resetLocation();
  animFrom = getLocation();
  animProgress = 0;
  const gallery = document.getElementById("gallery");
  target = locations[gallery.value];
  animate = true;
  loop();
}

function takeSnap() { saveCanvas("mandelbrot.jpg"); }

function getLocation() {
  return { zoom: ZOOM, centerX: CENTER_X, centerY: CENTER_Y, iteration: ITERATION };
}

// ─── Progressive ─────────────────────────────────────────────────────────────
function startProgressive() {
  CELL_IDX = animate ? 2 : 0;
  PROGRESSIVE = true;
  loop();
}