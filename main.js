const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game constants
const GRID_SIZE = 40;
const ROWS = 10;
const OBSTACLE_SPEED = 2; // Consistent speed for all obstacles

// Required images - create these and ensure they match these dimensions
// Images needed:
// 1. frog.png - 30x30px green frog sprite
// 2. car.png - 60x30px car sprite
// 3. log.png - 100x30px wooden log sprite
// 4. train-engine.png - 60x30px train engine
// 5. train-car.png - 50x30px train car
// All images should have transparent backgrounds

const IMAGES = {
  frog: "./images/frog.png", // Load this image for the frog
  car: "./images/car.png", // Load this for cars
  log: "./images/log.png", // Load this for river logs
  trainEngine: "./images/train-engine.png", // Load this for train engine
  trainCar: "./images/train-car.png", // Load this for train cars
};

// Simplified obstacle types
const TYPES = {
  CAR: "car",
  LOG: "log",
  TRAIN: "train",
  SAFE: "safe",
};

class Sprite {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  intersects(other) {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }
}

class Frog extends Sprite {
  constructor() {
    super(canvas.width / 2 - 15, canvas.height - GRID_SIZE, 30, 30);
    this.img = new Image();
    this.img.src = IMAGES.frog;
  }

  move(direction) {
    const moves = {
      ArrowUp: () => (this.y -= this.y > 0 ? GRID_SIZE : 0),
      ArrowDown: () =>
        (this.y += this.y < canvas.height - GRID_SIZE ? GRID_SIZE : 0),
      ArrowLeft: () => (this.x -= this.x > 0 ? GRID_SIZE : 0),
      ArrowRight: () =>
        (this.x += this.x < canvas.width - GRID_SIZE ? GRID_SIZE : 0),
    };
    if (moves[direction]) moves[direction]();
  }

  draw() {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  reset() {
    this.x = canvas.width / 2 - 15;
    this.y = canvas.height - GRID_SIZE;
  }
}

class Obstacle extends Sprite {
  constructor(y, type, direction = 1) {
    const sizes = {
      [TYPES.CAR]: 60,
      [TYPES.LOG]: 100,
      [TYPES.TRAIN]: 200,
    };
    super(-sizes[type], y, sizes[type], 30);
    this.type = type;
    this.speed = OBSTACLE_SPEED * direction;
    this.img = new Image();
    this.img.src =
      type === TYPES.CAR
        ? IMAGES.car
        : type === TYPES.LOG
          ? IMAGES.log
          : IMAGES.trainEngine;
  }

  update() {
    this.x += this.speed;
    if (this.speed > 0 && this.x > canvas.width) {
      this.x = -this.width;
    } else if (this.speed < 0 && this.x < -this.width) {
      this.x = canvas.width;
    }
  }

  draw() {
    if (this.type === TYPES.TRAIN) {
      // Draw engine
      ctx.drawImage(this.img, this.x, this.y, 60, this.height);

      // Draw cars
      const carImg = new Image();
      carImg.src = IMAGES.trainCar;
      for (let i = 1; i < 4; i++) {
        ctx.drawImage(
          carImg,
          this.x + 60 + (i - 1) * 50,
          this.y,
          50,
          this.height,
        );
      }
    } else {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
  }
}

class Row {
  constructor(y, type) {
    this.y = y;
    this.type = type;
    this.obstacles = type === TYPES.SAFE ? [] : this.createObstacles();
  }

  createObstacles() {
    if (this.type === TYPES.SAFE) return [];

    // Only create one or two obstacles per row
    const count = Math.random() < 0.5 ? 1 : 2;
    const direction = Math.random() < 0.5 ? 1 : -1;

    return Array.from(
      { length: count },
      () => new Obstacle(this.y, this.type, direction),
    );
  }

  update() {
    this.obstacles.forEach((o) => o.update());
  }

  draw() {
    if (this.type === TYPES.LOG) {
      ctx.fillStyle = "#4444FF";
      ctx.fillRect(0, this.y, canvas.width, GRID_SIZE);
    } else if (this.type === TYPES.TRAIN) {
      // Draw railway tracks
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(0, this.y + GRID_SIZE / 2 - 2, canvas.width, 4);
    }
    this.obstacles.forEach((o) => o.draw());
  }
}

class Game {
  constructor() {
    this.frog = new Frog();
    this.rows = this.createRows();
    this.gameOver = false;
    this.score = 0;
  }

  createRows() {
    const rows = [];
    const types = [TYPES.CAR, TYPES.LOG, TYPES.TRAIN];
    for (let i = 0; i < ROWS - 1; i++) {
      const type =
        Math.random() < 0.2
          ? TYPES.SAFE
          : types[Math.floor(Math.random() * types.length)];
      rows.push(new Row(i * GRID_SIZE, type));
    }
    // Last row (spawn point) is always safe
    rows.push(new Row((ROWS - 1) * GRID_SIZE, TYPES.SAFE));
    return rows;
  }

  update() {
    if (this.gameOver) return;

    this.rows.forEach((row) => row.update());

    const currentRow = this.rows[Math.floor(this.frog.y / GRID_SIZE)];
    if (currentRow) {
      if (currentRow.type === TYPES.LOG) {
        const onLog = currentRow.obstacles.some((log) =>
          this.frog.intersects(log),
        );
        if (!onLog) this.gameOver = true;
        else {
          const log = currentRow.obstacles.find((log) =>
            this.frog.intersects(log),
          );
          this.frog.x += log.speed;
        }
      } else if (currentRow.type !== TYPES.SAFE) {
        if (currentRow.obstacles.some((obs) => this.frog.intersects(obs))) {
          this.gameOver = true;
        }
      }
    }

    if (this.frog.y === 0) {
      this.score++;
      this.frog.reset();
    }
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.rows.forEach((row) => row.draw());
    this.frog.draw();

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${this.score}`, 10, 25);

    if (this.gameOver) {
      ctx.fillStyle = "red";
      ctx.font = "40px Arial";
      ctx.fillText("Game Over!", canvas.width / 2 - 100, canvas.height / 2);
      ctx.font = "20px Arial";
      ctx.fillText(
        "Press Space to restart",
        canvas.width / 2 - 90,
        canvas.height / 2 + 40,
      );
    }
  }

  reset() {
    this.frog.reset();
    this.rows = this.createRows();
    this.gameOver = false;
    this.score = 0;
  }
}

const game = new Game();

document.addEventListener("keydown", (e) => {
  if (game.gameOver && e.code === "Space") game.reset();
  else game.frog.move(e.code);
});

function gameLoop() {
  game.update();
  game.draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
