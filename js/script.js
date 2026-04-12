// ─── GRID CONFIG ─────────────────────────────────────────────────────────────
const COLS = 40, ROWS = 40;
const CELL = 20; // 800 / 40

let decayGrid = [];
let nextGrid  = [];

// ─── ENTITIES ────────────────────────────────────────────────────────────────
let plants = [];
let trees  = [];
let pulses = [];   // visual ripples
let spores = [];   // dark decay particles
let plantCount = 0;

// ─── SETUP ───────────────────────────────────────────────────────────────────

function setup() {
  createCanvas(800, 800);

  for (let c = 0; c < COLS; c++) {
    decayGrid[c] = [];
    nextGrid[c]  = [];
    for (let r = 0; r < ROWS; r++) {
      decayGrid[c][r] = random(130, 200); // start partially decayed
      nextGrid[c][r]  = 0;
    }
  }
}

// ─── DRAW ────────────────────────────────────────────────────────────────────

function draw() {
  updateDecay();

  // Global decay = average of all cells (drives UI, shake, game-over)
  let totalDecay = 0;
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r < ROWS; r++)
      totalDecay += decayGrid[c][r];
  let globalDecay = totalDecay / (COLS * ROWS);

  // Screen shake when critical
  let shake = globalDecay > 180 ? map(globalDecay, 180, 255, 0, 5) : 0;
  translate(random(-shake, shake), random(-shake, shake));

  // Draw spatial grid
  drawGrid();

  // Breathing veil on top
  let breatheSpeed = map(globalDecay, 0, 255, 0.03, 0.12);
  let veilAlpha    = globalDecay * 0.12 + sin(frameCount * breatheSpeed) * 10;
  noStroke();
  fill(35, 18, 8, veilAlpha);
  rect(0, 0, width, height);

  // Spores emerge from highly-decayed cells
  if (globalDecay > 140 && frameCount % int(map(globalDecay, 140, 255, 12, 2)) === 0) {
    for (let attempt = 0; attempt < 6; attempt++) {
      let c = floor(random(COLS)), r = floor(random(ROWS));
      if (decayGrid[c][r] > 190) {
        spores.push(new Spore(c * CELL + CELL / 2, r * CELL + CELL / 2));
        break;
      }
    }
  }

  for (let i = spores.length - 1; i >= 0; i--) {
    spores[i].update();
    spores[i].draw();
    if (spores[i].isDead()) spores.splice(i, 1);
  }

  // Planting pulses
  for (let i = pulses.length - 1; i >= 0; i--) {
    let p = pulses[i];
    p.r += 4; p.alpha -= 9;
    noFill();
    stroke(80, 220, 100, p.alpha);
    strokeWeight(2);
    circle(p.x, p.y, p.r * 2);
    if (p.alpha <= 0) pulses.splice(i, 1);
  }

  // Plants — fade rate driven by LOCAL cell decay
  for (let i = plants.length - 1; i >= 0; i--) {
    let p = plants[i];
    let c = floor(p.x / CELL), r = floor(p.y / CELL);
    let localDecay = cellDecay(c, r);
    p.fadeRate = p.baseFadeRate * map(localDecay, 0, 255, 1, 4);
    p.plantGrow();
    p.plantFade();
    p.plantDisplay();
    if (p.isDead()) {
      spores.push(new Spore(p.x, p.y, true));
      plants.splice(i, 1);
    }
  }

  // Trees — local decay affects them too; they seed and push back spatially
  for (let i = trees.length - 1; i >= 0; i--) {
    let t = trees[i];
    let c = floor(t.x / CELL), r = floor(t.y / CELL);
    let localDecay = cellDecay(c, r);
    t.fadeRate = t.baseFadeRate * map(localDecay, 0, 255, 1, 2.2);
    t.treeGrow();
    t.treeFade();
    t.treeSeed();
    t.treeDisplay();
    if (t.isDead()) trees.splice(i, 1);
  }

  drawUI(globalDecay);

  // Game over overlay
  if (globalDecay >= 252) {
    fill(0, 215);
    noStroke();
    rect(0, 0, width, height);
    fill(190, 165, 130);
    textAlign(CENTER, CENTER);
    textSize(34);
    text("The world has decayed.", width / 2, height / 2 - 24);
    textSize(15);
    fill(155, 135, 110);
    text("Keep planting — every click fights back.", width / 2, height / 2 + 22);
  }
}

// ─── DECAY GRID ──────────────────────────────────────────────────────────────

function updateDecay() {
  // Step 1: self-decay + neighbor spread
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      let val = decayGrid[c][r];
      val += 0.28; // self-decay per frame

      // Weighted pull toward neighbor average (spread)
      let nSum = 0, nCount = 0;
      for (let dc = -1; dc <= 1; dc++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (dc === 0 && dr === 0) continue;
          let nc = c + dc, nr = r + dr;
          if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) {
            nSum += decayGrid[nc][nr];
            nCount++;
          }
        }
      }
      val += ((nSum / nCount) - val) * 0.04; // 4% bleed per frame
      nextGrid[c][r] = constrain(val, 0, 255);
    }
  }

  // Step 2: plant resistance — pushes back in their cell
  for (let p of plants) {
    let c = floor(p.x / CELL), r = floor(p.y / CELL);
    if (inBounds(c, r)) nextGrid[c][r] = max(0, nextGrid[c][r] - 7);
  }

  // Step 3: tree resistance — pushes back in a spatial radius
  for (let t of trees) {
    if (!t.fullyGrown) continue;
    let tc = floor(t.x / CELL), tr = floor(t.y / CELL);
    let radius = 3 + floor(t.size / CELL); // radius grows with tree size
    for (let dc = -radius; dc <= radius; dc++) {
      for (let dr = -radius; dr <= radius; dr++) {
        let c = tc + dc, r = tr + dr;
        if (!inBounds(c, r)) continue;
        let dist = sqrt(dc * dc + dr * dr);
        if (dist <= radius) {
          let push = map(dist, 0, radius, 20, 2); // stronger at centre
          nextGrid[c][r] = max(0, nextGrid[c][r] - push);
        }
      }
    }
  }

  // Swap buffers
  let tmp = decayGrid;
  decayGrid = nextGrid;
  nextGrid  = tmp;
}

function drawGrid() {
  noStroke();
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      let d = decayGrid[c][r] / 255;
      fill(lerp(28, 75, d), lerp(90, 42, d), lerp(28, 18, d));
      rect(c * CELL, r * CELL, CELL, CELL);
    }
  }
}

// ─── UI ──────────────────────────────────────────────────────────────────────

function drawUI(globalDecay) {
  if (plants.length === 0 && trees.length === 0 && globalDecay < 252) {
    fill(255, 190);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(17);
    text("Click to plant — don't stop.", width / 2, height / 2);
    textSize(13);
    fill(255, 130);
    text("Every 8 plants grows a tree. Trees seed themselves.", width / 2, height / 2 + 30);
  }

  // Critical flash
  if (globalDecay > 210 && frameCount % 30 < 15) {
    fill(220, 60, 40, 150);
    noStroke();
    rect(0, 0, width, height);
    fill(255, 200, 180);
    textAlign(CENTER, CENTER);
    textSize(14);
    text("CRITICAL DECAY", width / 2, height - 30);
  }

  // Decay bar
  let mW = 190, mH = 14;
  let mX = width - mW - 18, mY = 20;
  noStroke();
  fill(0, 130);
  rect(mX, mY, mW, mH, 7);
  fill(lerp(60, 220, globalDecay / 255), lerp(175, 45, globalDecay / 255), lerp(60, 28, globalDecay / 255));
  rect(mX, mY, mW * (globalDecay / 255), mH, 7);
  fill(255, 200);
  noStroke();
  textAlign(RIGHT);
  textSize(10);
  text("WORLD DECAY", mX + mW, mY - 5);

  // Counts
  textAlign(LEFT);
  fill(255, 185);
  textSize(11);
  text(`Plants: ${plants.length}   Trees: ${trees.length}`, 16, 30);
}

// ─── INPUT ───────────────────────────────────────────────────────────────────

function mousePressed() {
  // Immediate local push where you click
  let c = floor(mouseX / CELL), r = floor(mouseY / CELL);
  if (inBounds(c, r)) decayGrid[c][r] = max(0, decayGrid[c][r] - 35);

  pulses.push({ x: mouseX, y: mouseY, r: 4, alpha: 180 });
  plantCount++;
  plants.push(new Plant(mouseX, mouseY));

  if (plantCount % 8 === 0) {
    trees.push(new Tree(mouseX, mouseY));
    for (let a = 0; a < 3; a++)
      pulses.push({ x: mouseX, y: mouseY, r: 4 + a * 10, alpha: 220 - a * 45 });
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function inBounds(c, r) {
  return c >= 0 && c < COLS && r >= 0 && r < ROWS;
}

function cellDecay(c, r) {
  return inBounds(c, r) ? decayGrid[c][r] : 200;
}

// ─── PLANT ───────────────────────────────────────────────────────────────────

class Plant {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 1;
    this.maxSize      = random(6, 22);
    this.col          = color(random(100, 255), random(180, 255), random(80, 160));
    this.alpha        = 255;
    this.fullyGrown   = false;
    this.baseFadeRate = random(5, 10); // short-lived sparks
    this.fadeRate     = this.baseFadeRate;
  }

  plantGrow() {
    if (this.size < this.maxSize) {
      this.size = constrain(this.size + 2, 0, this.maxSize);
    } else {
      this.fullyGrown = true;
    }
  }

  plantFade() {
    if (this.fullyGrown) this.alpha = max(this.alpha - this.fadeRate, 0);
  }

  isDead() { return this.alpha <= 0; }

  plantDisplay() {
    let c = color(red(this.col), green(this.col), blue(this.col), this.alpha);
    stroke(c);
    strokeWeight(1.5);
    line(this.x, this.y, this.x, this.y - this.size);
    noStroke();
    fill(c);
    circle(this.x, this.y - this.size, this.size / 2);
  }
}

// ─── TREE ────────────────────────────────────────────────────────────────────

class Tree {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 1;
    this.maxSize      = random(40, 90);
    this.col          = color(random(50, 130), random(110, 200), random(50, 110));
    this.alpha        = 255;
    this.fullyGrown   = false;
    this.baseFadeRate = random(0.15, 0.45);
    this.fadeRate     = this.baseFadeRate;

    // Seeding
    this.seedTimer    = 0;
    this.seedInterval = floor(random(80, 150)); // frames between automatic seeds
  }

  treeGrow() {
    if (this.size < this.maxSize) {
      this.size = constrain(this.size + 0.7, 0, this.maxSize);
    } else {
      this.fullyGrown = true;
    }
  }

  treeFade() {
    if (this.fullyGrown) this.alpha = max(this.alpha - this.fadeRate, 0);
  }

  // Automatically sprout plants within the canopy area
  treeSeed() {
    if (!this.fullyGrown) return;
    this.seedTimer++;
    if (this.seedTimer < this.seedInterval) return;
    this.seedTimer = 0;

    let angle = random(TWO_PI);
    let dist  = random(this.size * 0.3, this.size * 1.1);
    let sx    = constrain(this.x + cos(angle) * dist, 5, width  - 5);
    let sy    = constrain(this.y + sin(angle) * dist, 5, height - 5);

    // Only seed where the ground isn't overwhelmed
    let c = floor(sx / CELL), r = floor(sy / CELL);
    if (cellDecay(c, r) < 210) {
      plants.push(new Plant(sx, sy));
      pulses.push({ x: sx, y: sy, r: 2, alpha: 130 }); // tiny seed ripple
    }
  }

  isDead() { return this.alpha <= 0; }

  treeDisplay() {
    let c = color(red(this.col), green(this.col), blue(this.col), this.alpha);

    // Seeding radius — faint halo so player can see the tree's territory
    if (this.fullyGrown) {
      noFill();
      stroke(red(this.col), green(this.col), blue(this.col), 28);
      strokeWeight(1);
      circle(this.x, this.y, this.size * 2.8);
    }

    // Trunk
    stroke(c);
    strokeWeight(4);
    line(this.x, this.y, this.x, this.y - this.size);

    // Outer canopy (transparent)
    noStroke();
    fill(red(this.col), green(this.col), blue(this.col), this.alpha * 0.45);
    circle(this.x, this.y - this.size, this.size * 1.4);

    // Inner canopy (solid)
    fill(c);
    circle(this.x, this.y - this.size, this.size * 0.75);
  }
}

// ─── SPORE ───────────────────────────────────────────────────────────────────

class Spore {
  constructor(x, y, deathBurst = false) {
    this.x     = x + random(-10, 10);
    this.y     = y + random(-10, 10);
    this.vx    = random(-0.4, 0.4);
    this.vy    = random(-0.8, -0.2);
    this.size  = deathBurst ? random(4, 9) : random(2, 5);
    this.alpha = deathBurst ? 200 : random(60, 130);
    this.decay = deathBurst ? 5 : random(1, 2.5);
  }

  update() {
    this.x  += this.vx;
    this.y  += this.vy;
    this.vy *= 0.98;
    this.alpha -= this.decay;
  }

  draw() {
    noStroke();
    fill(20, 12, 5, this.alpha);
    circle(this.x, this.y, this.size);
  }

  isDead() { return this.alpha <= 0; }
}