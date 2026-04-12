let plants = [];
let trees = [];
let decayLevel = 150;       // 0 = healthy, 255 = fully decayed
const BASE_DECAY = 1;  // decay added per frame before resistance
let plantCount = 0;       // lifetime total — used for tree trigger

function setup() {
  createCanvas(800, 800);
}

function draw() {
  // Each living plant resists 0.02 decay/frame; each tree resists 0.06
  let resistance = plants.length * 0.1 + trees.length * 0.3;
  decayLevel += BASE_DECAY - resistance;
  decayLevel = constrain(decayLevel, 0, 255);

  // Background shifts from healthy green → dead grey-brown
  let bgR = lerp(30,  80, decayLevel / 255);
  let bgG = lerp(84,  45, decayLevel / 255);
  let bgB = lerp(31,  20, decayLevel / 255);
  background(bgR, bgG, bgB);

  // Dark decay veil overlaid on top of background
  if (decayLevel > 0) {
    noStroke();
    fill(40, 25, 10, decayLevel * 0.1);
    rect(0, 0, width, height);
  }

  // Plants — fade faster as world decays
  for (let i = plants.length - 1; i >= 0; i--) {
    let p = plants[i];
    p.fadeRate = p.baseFadeRate * map(decayLevel, 0, 255, 1, 4);
    p.plantGrow();
    p.plantFade();
    p.plantDisplay();
    if (p.isDead()) plants.splice(i, 1);
  }

  // Trees — more resilient, but also affected
  for (let i = trees.length - 1; i >= 0; i--) {
    let t = trees[i];
    t.fadeRate = t.baseFadeRate * map(decayLevel, 0, 255, 1, 3);
    t.treeGrow();
    t.treeFade();
    t.treeDisplay();
    if (t.isDead()) trees.splice(i, 1);
  }

  drawUI();

  // World fully decayed
  if (decayLevel >= 255) {
    fill(0, 180);
    rect(0, 0, width, height);
    fill(200, 180, 150);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("The world has decayed.", width / 2, height / 2 - 20);
    textSize(16);
    fill(180, 160, 130);
    text("Keep planting to push back the decay.", width / 2, height / 2 + 20);
  }
}

function drawUI() {
  // Hint when garden is empty
  if (plants.length === 0 && trees.length === 0 && decayLevel < 255) {
    fill(255, 210);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(18);
    text("Click to plant", width / 2, height / 2);
    text("Every 8 plants grows a tree!", width / 2, height / 2 + 30);
  }

  // Decay meter (top-right)
  let mW = 180, mH = 14;
  let mX = width - mW - 20, mY = 22;

  noStroke();
  fill(0, 120);
  rect(mX, mY, mW, mH, 7);

  let barCol = color(
    lerp(60,  210, decayLevel / 255),
    lerp(170,  50, decayLevel / 255),
    lerp(60,   30, decayLevel / 255)
  );
  fill(barCol);
  rect(mX, mY, mW * (decayLevel / 255), mH, 7);

  fill(255, 210);
  noStroke();
  textAlign(RIGHT);
  textSize(11);
  text("WORLD DECAY", mX + mW, mY - 4);

  // Plant / tree count (top-left)
  textAlign(LEFT);
  fill(255, 200);
  textSize(12);
  text(`Plants: ${plants.length}   Trees: ${trees.length}`, 16, 30);
}

function mousePressed() {
  plantCount++;
  plants.push(new Plant(mouseX, mouseY));
  if (plantCount % 8 === 0) {
    trees.push(new Tree(mouseX, mouseY));
  }
}

// ---------------------------------------------------------------------------

class Plant {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 1;
    this.maxSize = random(20, 80);
    this.col = color(random(100, 255), random(150, 255), random(100, 200));
    this.alpha = 255;
    this.fullyGrown = false;
    this.baseFadeRate = random(0.3, 0.8); // intrinsic pace; scaled by decay in draw()
    this.fadeRate = this.baseFadeRate;
  }

  plantGrow() {
    if (this.size < this.maxSize) {
      this.size = constrain(this.size + 0.5, 0, this.maxSize);
    } else {
      this.fullyGrown = true;
    }
  }

  plantFade() {
    if (this.fullyGrown) {
      this.alpha = max(this.alpha - this.fadeRate, 0);
    }
  }

  isDead() { return this.alpha <= 0; }

  plantDisplay() {
    let c = color(red(this.col), green(this.col), blue(this.col), this.alpha);
    stroke(c);
    strokeWeight(2);
    line(this.x, this.y, this.x, this.y - this.size);
    noStroke();
    fill(c);
    circle(this.x, this.y - this.size, this.size / 2);
  }
}

// ---------------------------------------------------------------------------

class Tree {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 1;
    this.maxSize = random(50, 150);
    this.col = color(random(50, 150), random(100, 200), random(50, 150));
    this.alpha = 255;
    this.fullyGrown = false;
    this.baseFadeRate = random(0.1, 0.4); // trees are naturally more resilient
    this.fadeRate = this.baseFadeRate;
  }

  treeGrow() {
    if (this.size < this.maxSize) {
      this.size = constrain(this.size + 0.5, 0, this.maxSize);
    } else {
      this.fullyGrown = true;
    }
  }

  treeFade() {
    if (this.fullyGrown) {
      this.alpha = max(this.alpha - this.fadeRate, 0);
    }
  }

  isDead() { return this.alpha <= 0; }

  treeDisplay() {
    let c = color(red(this.col), green(this.col), blue(this.col), this.alpha);
    stroke(c);
    strokeWeight(4);
    line(this.x, this.y, this.x, this.y - this.size);
    noStroke();
    fill(c);
    circle(this.x, this.y - this.size, this.size);
  }
}