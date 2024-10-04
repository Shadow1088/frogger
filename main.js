const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GRID_SQ_SIZE = 40; // grids square size (px)
const FROG_SIZE = 30; // frogs size (px)
const ROWS = 10; // total rows

// obstacles
const OBSTACLE_TYPES = {
  CAR: "car",
  RIVER: "river",
  TRAIN: "train",
  SAFE: "safe",
};

class Frog {
  // constructor = object init upon their creation
  constructor() {
    this.reset();
  }

  // moves our sprite to the initial position - [middle;down]
  reset() {
    this.x = canvas.width / 2 - FROG_SIZE / 2;
    this.y = canvas.height - GRID_SQ_SIZE;
  }

  // draws our sprite on its current position
  draw() {
    //green rectangle
    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y, FROG_SIZE, FROG_SIZE);

    //white eyes
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x + 7, this.y + 7, 3, 0, Math.PI * 2);
    ctx.arc(this.x + 23, this.y + 7, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  move(direction) {
    switch (direction) {
      case "up":
        if (this.y > 0) this.y -= GRID_SQ_SIZE;
        break;
      case "down":
        if (this.y < canvas.height) this.y += GRID_SQ_SIZE;
        break;
      case "left":
        if (this.y > 0) this.x -= GRID_SQ_SIZE;
        break;
      case "right":
        if (this.y < canvas.width) this.x += GRID_SIZE;
        break;
    }
  }
}

class Obstacle {
  constructor(y, speed, direction, type) {
    this.y = y;
    this.speed = speed;
    this.direction = direction;
    this.type = type;
    this.width = this.getWidth();
    this.height = 30;
  }
  getWidth() {
    switch (this.type) {
      case OBSTACLE_TYPES.CAR:
        return 60;
      case OBSTACLE_TYPES.RIVER:
        return 100; //log width
      case OBSTACLE_TYPES.TRAIN:
        return 120;
      default:
        return 60;
    }
  }

  reset() {
    if (this.direction > 0) {
      this.x -= canvas.width;
    }
  }
}
