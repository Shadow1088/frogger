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
    this.isOnLog = false;
  }

  // moves our sprite to the initial position - [middle;down]
  reset() {
    this.x = canvas.width / 2 - FROG_SIZE / 2;
    this.y = canvas.height - GRID_SQ_SIZE;
    this.isOnLog = false;
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
    this.isOnLog = false;
  }
  moveWithLog(speed) {
    this.x += speed;
    // Ensure frog stays within canvas bounds
    if (this.x < 0) this.x = 0;
    if (this.x > canvas.width - FROG_SIZE) this.x = canvas.width - FROG_SIZE;
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
      // if going from left to right, reset on left
      this.x -= canvas.width;
    } else {
      // or it goes from right to left so reset on right
      this.x = canvas.width;
    }
  }

  draw() {
    switch (this.type) {
      case OBSTACLE_TYPES.CAR:
        this.drawCar();
        break;
      case OBSTACLE_TYPES.RIVER:
        this.drawLog();
      case OBSTACLE_TYPES.TRAIN:
        this.drawTrain();
        break;
    }
  }

  drawCar() {
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "yellow";
    if (this.direction > 1) {
      ctx.fillRect(this.x + this.width - 10, this.y - 5, 5, 5);
      ctx.fillRect(this.x + this.width - 10, this.y + this.height - 5, 5, 5);
    } else {
      ctx.fillRect(this.x + 5, this.y + 5, 5, 5);
      ctx.fillRect(this.x + 5, this.y + this.height - 10, 5, 5);
    }
  }

  drawLog() {
    ctx.fillStyle = "brown";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  drawTrain() {
    const locomotiveWidth = 60;

    // vagons
    ctx.fillStyle = "#4A4A4A";
    const vagonsCount = Math.floor((this.width - locomotiveWidth) / 50);
    for (let i = 0; i < vagonsCount; i++) {
      ctx.fillRect(this.x + i * 50), this.y, 45, this.height;
    }

    // locomotive
    ctx.fillStyle = "#333333";
    ctx.fillRect(
      this.x + vagonsCount * 50,
      this.y,
      locomotiveWidth,
      this.height,
    );

    // komiin
    ctx.fillStyle = "#666666";
    ctx.fillRect(
      this.x + vagonsCount * 50 + locomotiveWidth - 20,
      this.y - 10,
      10,
      10,
    );

    // okna
    ctx.fillStyle = "#FFFF00";
    for (let i = 0; i < vagonsCount + 1; i++) {
      ctx.fillRect(this.x + i * 50 + 15, this.y, 20, 8);
    }
  }

  update() {
    this.x += this.speed * this.direction;
    if (
      (this.direction > 0 && this.x > canvas.width) ||
      (this.direction < 0 && this.x < -this.width)
    ) {
      this.reset();
    }
  }
}

class Row {
  constructor(y, type) {
    this.y = y;
    this.type = type;
    if (type === OBSTACLE_TYPES.TRAIN || type === OBSTACLE_TYPES.SAFE) {
      this.obstacles = [];
    } else {
      this.obstacles = this.generateObstacles();
    }
  }
  generateObstacles() {
    const obstacles = [];
    const speed = Math.random() + 1;
    const direction = Math.random() < 0.5 ? 1 : -1;

    obstacles.push(new Obstacle(this.y, speed, direction, this.type));

    // draw second log if obstacle == river
    if (this.type === OBSTACLE_TYPES.RIVER) {
      const secondLog = new Obstacle(this.y, speed, direction, this.type);
      secondLog.x =
        obstacles[obstacles.length - 1].x +
        secondLog.width +
        Math.random() * 100;
      obstacles.push(secondLog);
    }
  }
}
