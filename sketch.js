
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

//States
let ANIMATE = false;

let a;
let b;

let div1, div2;

function setup() {
  createCanvas(600, 600);
  pixelDensity(1);
  // colorMode(HSB, 1);
  div1 = document.getElementById("div1");
  div2 = document.getElementById("div2");

  startProgressive();
  drawBrot();
}

function draw() {
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

//Controls

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
  if (key == "p") {
    takeSnap();
  }

  if (key == "r") {
    CENTER_X = -0.5;
    CENTER_Y = 0;
    ZOOM = 1;
    ITERATION = 200;
    startProgressive();
    drawBrot();
  }
}

function mouseWheel(event) {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    ZOOM *= event.delta > 0 ? 0.9 : 1.2; // zoom in/out
    ZOOM = max(ZOOM, 1);
    ZOOM = min(ZOOM, 120657239077606);
    startProgressive();
    drawBrot();
  }
}

function mousePressed() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    pressX = mouseX;
    pressY = mouseY;
    startCX = CENTER_X;
    startCY = CENTER_Y;
    startProgressive();
  }
}

function mouseDragged() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    const s = scale();
    CENTER_X = startCX - (mouseX - pressX) * s;
    CENTER_Y = startCY - (mouseY - pressY) * s;
    startProgressive();
    drawBrot();
  }
}

function mouseReleased() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) startProgressive();
}

//Animating
function updateLocation() {
  CENTER_X = map(mouseX, 0, width, -1.3, 0.7);
  CENTER_Y = map(mouseY, 0, height, -1.3, 1.3);
  drawBrot();
}

function drawBrot() {
  const s = scale();
  let xMin = CENTER_X - 2 / ZOOM;
  let xMax = CENTER_X + 2 / ZOOM;
  let yMin = CENTER_Y - 2 / ZOOM;
  let yMax = CENTER_Y + 2 / ZOOM;
  const LIMIT2 = LIMIT * LIMIT;

  loadPixels();

  const xRange = xMax - xMin,
    yRange = yMax - yMin;
  const cellS = CELL_SIZE[CELL_IDX] || 1;
  const maxIter = floor(ITERATION);

  for (let x = 0; x < width; x += cellS) {
    for (let y = 0; y < height; y += cellS) {
      let a = xMin + ((x + cellS / 2) / width) * xRange;
      let b = yMin + ((y + cellS / 2) / height) * yRange;

      let oa = a;
      let ob = b;

      let n = 0;
      while (n < maxIter) {
        let aa = a * a - b * b;
        let bb = 2 * a * b;

        //BUTTERFLY
        // let aa = a*a - b*b;
        // let bb = 2 * a / b;



        a = aa + oa;
        b = bb + ob;

        //JULIS
        // a = aa - 0.835;
        // b = bb - 0.2321

        if (a * a + b * b > LIMIT2) break;

        n++;
      }

      let bright = map(n, 0, maxIter, 0, 255);

      if (n >= ITERATION) bright = 0;

      drawPixel(x, y, bright, maxIter, cellS);
    }
  }
  updatePixels();

  fill(255);
  stroke(1);

  textSize(12);
  div1.innerHTML = `Zoom: ${floor(ZOOM)}; Details: ${ITERATION}`;
  div2.innerHTML = `X: ${CENTER_X}; Y: ${CENTER_Y}`;
}

// extras
// define a palette of key colors
const palette = [
  [0, 2, 0], // almost black (background)
  [32, 107, 203], // blue
  [237, 255, 255], // white
  [255, 170, 0], // orange
  [255, 70, 0], // deep orange-red
  [180, 0, 180], // violet
];

// linear interpolation helper
function lerpRGB(c1, c2, t) {
  return [
    c1[0] + (c2[0] - c1[0]) * t,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t,
  ];
}

// map iteration count to palette
function getColor(n, maxIter) {
  let t = n / maxIter;
  t = t % 1; // repeat cyclically

  let idx = Math.floor(t * (palette.length - 1));
  let frac = t * (palette.length - 1) - idx;

  return lerpRGB(palette[idx], palette[idx + 1], frac);
}

// usage inside drawPixel:
function drawPixel(i, j, n, maxIter, cellS) {
  const col = getColor(n, maxIter);

  for (let x = 0; x < cellS; x++) {
    for (let y = 0; y < cellS; y++) {
      const idx = (i + x + (j + y) * width) * 4;
      pixels[idx + 0] = col[0];
      pixels[idx + 1] = col[1];
      pixels[idx + 2] = col[2];
      pixels[idx + 3] = 255;
    }
  }
}

function startProgressive() {
  CELL_IDX = 0; // start coarse
  PROGRESSIVE = true;
  loop(); // allow draw() to run frames
}


function setLocation(){
  const gallery = document.getElementById("gallery");
  const loc = locations[gallery.value];
  console.log("going to ",loc.name);

  ITERATION = loc.iteration;
  ZOOM = loc.zoom;
  CENTER_X = loc.centerX;
  CENTER_Y = loc.centerY;
  startProgressive();
  drawBrot();
}

function takeSnap(){
  saveCanvas("mandelbrot.jpg");
}

function getLocation(){
  return {zoom: ZOOM, centerX: CENTER_X, centerY: CENTER_Y, iteration: ITERATION};
}
