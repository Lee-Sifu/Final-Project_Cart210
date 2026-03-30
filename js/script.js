let plants = [];
let trees = [];
 
function setup() {
  createCanvas(800, 800);
}
 
function draw() {
  background("#1e541f");
 
  // Draw hint text if garden is empty
  if (plants.length === 0 && trees.length === 0) {
    fill(255, 220);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(18);
    text("Click to plant", width / 2, height / 2);
    text("Every 8 plants grows a tree!", width / 2, height / 2 + 30);
  }
 
  for (let i = plants.length - 1; i >= 0; i--) {
    plants[i].plantGrow();
    plants[i].plantFade();
    plants[i].plantDisplay();
    if (plants[i].isDead()) plants.splice(i, 1);
  }
 
  for (let i = trees.length - 1; i >= 0; i--) {
    trees[i].treeGrow();
    trees[i].treeFade();
    trees[i].treeDisplay();
    if (trees[i].isDead()) trees.splice(i, 1);
  }
}
 
function mousePressed() {
  let newPlant = new Plant(mouseX, mouseY);
  plants.push(newPlant);
  if (plants.length % 8 === 0) {
    let newTree = new Tree(mouseX, mouseY);
    trees.push(newTree);
  }
}
 
class Plant {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 1;
    this.maxSize = random(20, 80);
    this.col = color(random(100, 255), random(150, 255), random(100, 255));
    this.alpha = 255;
    this.fullyGrown = false;
    this.fadeRate = random(0.3, 0.8); // each plant fades at its own pace
  }
 
  plantGrow() {
    if (this.size < this.maxSize) {
      this.size += 0.5;
      this.size = constrain(this.size, 0, this.maxSize);
    } else {
      this.fullyGrown = true;
    }
  }
 
  // Only start fading once the plant has fully grown
  plantFade() {
    if (this.fullyGrown) {
      this.alpha -= this.fadeRate;
      this.alpha = max(this.alpha, 0);
    }
  }
 
  isDead() {
    return this.alpha <= 0;
  }
 
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
 
class Tree {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 1;
    this.maxSize = random(50, 150);
    this.col = color(random(50, 150), random(100, 200), random(50, 150));
    this.alpha = 255;
    this.fullyGrown = false;
    this.fadeRate = random(0.1, 0.4); // trees fade more slowly than plants
  }
 
  treeGrow() {
    if (this.size < this.maxSize) {
      this.size += 0.5;
      this.size = constrain(this.size, 0, this.maxSize);
    } else {
      this.fullyGrown = true;
    }
  }
 
  treeFade() {
    if (this.fullyGrown) {
      this.alpha -= this.fadeRate;
      this.alpha = max(this.alpha, 0);
    }
  }
 
  isDead() {
    return this.alpha <= 0;
  }
 
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