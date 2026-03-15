let plants = [];

function setup() {
    createCanvas(400, 400);
}

function draw() {
    background("#1e541f");
    for (let i = 0; i < plants.length; i++) {
        plants[i].grow();
        plants[i].display();
    }
}

function mousePressed() {
    let newPlant = new Plant(mouseX, mouseY);
    plants.push(newPlant);
}

class Plant {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 1;
    this.maxSize = random(20, 80);
    this.color = color(random(100,255), random(150,255), random(100,255));
  }

    grow() {
        if (this.size < this.maxSize) {
            this.size += 0.5;
        }
    }

    display() {
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