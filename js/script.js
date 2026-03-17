let plants = [];
let trees = [];

function setup() {
    createCanvas(800, 800);
}

function draw() {
    background("#1e541f");
    for (let i = 0; i < plants.length; i++) {
        plants[i].plantGrow();
        plants[i].plantDisplay();  
    }
    for (let i = 0; i < trees.length; i++) {
        trees[i].treeGrow();
        trees[i].treeDisplay();
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
    this.color = color(random(100,255), random(150,255), random(100,255));
  }

    plantGrow() {
        if (this.size < this.maxSize) {
            this.size += 0.02;
            this.size = constrain(this.size, 0, this.maxSize);
        }
    }

    plantDisplay() {
    stroke(this.color);
    strokeWeight(2);

    // stem
    line(this.x, this.y, this.x, this.y - this.size);

    // flower
    noStroke();
    fill(this.color);
    circle(this.x, this.y - this.size, this.size/2);
  }
}

class Tree {
  constructor(x, y) {
    this.x = x; 
    this.y = y;
    this.size = 1;
    this.maxSize = random(50, 150);
    this.color = color(random(50,150), random(100,200), random(50,150));
  }
  treeGrow() {
    if (this.size < this.maxSize) {
        this.size += 0.02;
        this.size = constrain(this.size, 0, this.maxSize);
    }
}
    treeDisplay() {
    stroke(this.color);
    strokeWeight(4);
    // trunk
    line(this.x, this.y, this.x, this.y - this.size);
    // leaves
    noStroke();
    fill(this.color);
    circle(this.x, this.y - this.size, this.size);
  } 
}