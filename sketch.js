//sketch.js
// ─── State ───────────────────────────────────────────────────────────────────
let ZOOM = 1;
let CENTER_X = -0.5;
let CENTER_Y = 0;
let currentFormula = 'mandelbrot';
let currentColor = 'original';
let renderTime = 0;
let vx = 0;
let vy = 0;
let orbitPoints = [];
let showOrbit = false;
let vzoom = 0; // add at top with other state
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
  createCanvas(windowWidth - 10, windowHeight - 10, P2D);
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
  strokeWeight(1);
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
    circle(sx, sy, 3);
  }
}

function getIterations() {
  return 200 + Math.log10(ZOOM) * 170;

}
let joystickOrigin = null;
const CAMERA_SPEED = 9
// ─── Draw loop ───────────────────────────────────────────────────────────────
function draw() {
  const ZOOM_IN_KEY_DOWN = keyIsDown(UP_ARROW) || keyIsDown(87);
  const ZOOM_OUT_KEY_DOWN = keyIsDown(DOWN_ARROW) || keyIsDown(83);
  const SHIFT_DOWN = keyIsDown(SHIFT);
  let zoomMove = false;

  // ── Joystick origin: lock when key first pressed, clear when released ──
  if ((ZOOM_IN_KEY_DOWN || ZOOM_OUT_KEY_DOWN) && !joystickOrigin) {
    joystickOrigin = { x: mouseX, y: mouseY };
  }
  if (!ZOOM_IN_KEY_DOWN && !ZOOM_OUT_KEY_DOWN) {
    joystickOrigin = null;
  }

  // ── W/S: zoom + steer ──
  if (ZOOM_IN_KEY_DOWN) {
    vzoom = SHIFT_DOWN ? 1.01 :  1.005;
    // vzoom = 1
    zoomMove = true;
  }
  if (ZOOM_OUT_KEY_DOWN) {
    vzoom = SHIFT_DOWN ? 0.95 : 0.995;
    zoomMove = true;
  }
  if (!ZOOM_IN_KEY_DOWN && !ZOOM_OUT_KEY_DOWN && vzoom !== 0) {
    // decay zoom inertia
    vzoom = lerp(vzoom, 1, 0.05); // 1 = no zoom
    inertialMove = true;

    if (Math.abs(vzoom - 1) < 0.0001) { vzoom = 0; }
    else { ZOOM *= vzoom; zoomMove = true; CELL_IDX = 3; drawBrot(); loop(); }
  }

  if (joystickOrigin) {
    const dx = (mouseX - joystickOrigin.x) / (width * 0.5);
    const dy = (mouseY - joystickOrigin.y) / (height * 0.5);
    const panSpeed = 15 * scale();
    CENTER_X += dx * panSpeed;
    CENTER_Y += dy * panSpeed;

    // store as velocity for inertia
    vx = -dx * 15;
    vy = -dy * 15;
  }

  if (zoomMove) {
    if (ZOOM_IN_KEY_DOWN || ZOOM_OUT_KEY_DOWN) {
      ZOOM *= vzoom;
    }
    CELL_IDX = 3; drawBrot(); loop();
  }

  // ── A/D + Arrow Left/Right: strafe ──
  const panStep = 0.7 * scale();
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { vx = CAMERA_SPEED; inertialMove = true; CENTER_X -= panStep; loop(); }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { vx = -CAMERA_SPEED; inertialMove = true; CENTER_X += panStep; loop(); }

  // ── Inertia ──
  if (inertialMove) {
    const s = scale();
    CENTER_X -= vx * s;
    CENTER_Y -= vy * s;
    vx *= 0.9;
    vy *= 0.9;
    CELL_IDX = 3;
    drawBrot();
    if (Math.abs(vx) < 0.5 && Math.abs(vy) < 0.5) {
      inertialMove = false;
      startProgressive();
    }
  }

  // ── Gallery animation ──
  if (animate) {
    animProgress = min(1, animProgress + 0.003);
    const e = target.zoom > ZOOM ? smoothAtEnd(animProgress) : smoohtAtStart(animProgress);

    const fromW = 4 / animFrom.zoom;
    const toW = 4 / target.zoom;
    ZOOM = 4 / lerp(fromW, toW, e);

    CENTER_X = lerp(animFrom.centerX, target.centerX, e);
    CENTER_Y = lerp(animFrom.centerY, target.centerY, e);
    ITERATION = lerp(animFrom.iteration, target.iteration, e);

    startProgressive();

    if (animProgress >= 1) {
      CENTER_X = target.centerX;
      CENTER_Y = target.centerY;
      ZOOM = target.zoom;
      ITERATION = target.iteration;
      animate = false;
      startProgressive();
    }
  }

  if (joystickOrigin) {

    fill(255, 255, 255);
    circle(joystickOrigin.x, joystickOrigin.y, 4)
    circle(mouseX, mouseY, 4)
    stroke(255, 255, 255)
    strokeWeight(1);
    line(joystickOrigin.x, joystickOrigin.y, mouseX, mouseY)
  }

  // ── Progressive refine ──
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

  if (!animate && !inertialMove && !zoomMove) noLoop();
}

// ─── Easing ──────────────────────────────────────────────────────────────────
function smoothAtEnd(t) {
  return 1 - Math.pow(1 - t, 5);
}

function smoohtAtStart(t) {
  return t * t * t * t;
}
// ─── Controls ────────────────────────────────────────────────────────────────
function keyPressed() {
  if (key == "p") takeSnap();
  if (key == "r") resetLocation();
  if (key == "Escape") {
    console.log("Stop Animation")
    animate = false
  }
  loop();
}

function mouseWheel(event) {
  if (!event.target.closest('#defaultCanvas0')) return;

  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    const factor = event.delta > 0 ? 0.9 : 1.2;
    const s = scale();
    const wx = CENTER_X + (mouseX - width * 0.5) * s;
    const wy = CENTER_Y + (mouseY - height * 0.5) * s;
    ZOOM *= factor;
    ZOOM = max(ZOOM, 0.6);
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
  if (!event.target.closest('#defaultCanvas0')) return;

  if (touches.length === 1) {
    touchStartX = touches[0].x;
    touchStartY = touches[0].y;
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
  if (!event.target.closest('#defaultCanvas0')) return;

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
      const s = scale();
      const wx = CENTER_X + (mx - width * 0.5) * s;
      const wy = CENTER_Y + (my - height * 0.5) * s;
      ZOOM *= factor;
      ZOOM = constrain(ZOOM, 1, 120657239077606);
      const sNew = scale();
      CENTER_X = wx - (mx - width * 0.5) * sNew;
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
  // CENTER_X = -0.5; CENTER_Y = 0; ZOOM = 1; ITERATION = 200;

  // startProgressive();
  // drawBrot();

  setActualLocation({ centerX: CENTER_X, centerY: CENTER_Y, zoom: 0.8, iteration: 200 })
}
// target = { centerX: CENTER_X, centerY: CENTER_Y, zoom: ZOOM, iteration: ITERATION }
function setActualLocation(targetCoordiantes) {
  // resetLocation();
  animFrom = getLocation();
  animProgress = 0;
  // target = locations[gallery.value]; //in data.js
  target = targetCoordiantes;
  console.log({ target });
  animate = true;
  loop();
}

function setLocation() {
  CENTER_X = -0.5; CENTER_Y = 0; ZOOM = 1; ITERATION = 200;

  startProgressive();
  drawBrot();

  const gallery = document.getElementById("gallery");
  setActualLocation(locations[gallery.value])
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