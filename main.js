const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 40;
const FROG_SIZE = 30;
const ROWS = 10; // Total number of rows excluding start and end zones

// Define types of obstacles
const OBSTACLE_TYPES = {
  CAR: "car",
  RIVER: "river",
  TRAIN: "train",
  SAFE: "safe",
};

class GistLeaderboard {
  constructor(gistId, githubToken) {
    this.gistId = gistId;
    this.githubToken = githubToken;
  }

  async fetchLeaderboard() {
    try {
      const response = await fetch(
        `https://api.github.com/gists/${this.gistId}`,
        {
          headers: {
            Authorization: `token ${this.githubToken}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch leaderboard");

      const data = await response.json();
      const content = data.files["leaderboard.json"].content;
      return JSON.parse(content);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  }

  async updateLeaderboard(newEntries) {
    try {
      const response = await fetch(
        `https://api.github.com/gists/${this.gistId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `token ${this.githubToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            files: {
              "leaderboard.json": {
                content: JSON.stringify(newEntries),
              },
            },
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to update leaderboard");

      return true;
    } catch (error) {
      console.error("Error updating leaderboard:", error);
      return false;
    }
  }
}

class Frog {
  constructor() {
    this.reset();
    this.isOnLog = false;
  }

  reset() {
    this.x = canvas.width / 2 - FROG_SIZE / 2;
    this.y = canvas.height - GRID_SIZE;
    this.isOnLog = false;
  }

  draw() {
    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y, FROG_SIZE, FROG_SIZE);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x + 7, this.y + 7, 3, 0, Math.PI * 2);
    ctx.arc(this.x + 23, this.y + 7, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  move(direction) {
    switch (direction) {
      case "up":
        if (this.y > 0) this.y -= GRID_SIZE;
        break;
      case "down":
        if (this.y < canvas.height - GRID_SIZE) this.y += GRID_SIZE;
        break;
      case "left":
        if (this.x > 0) this.x -= GRID_SIZE;
        break;
      case "right":
        if (this.x < canvas.width - GRID_SIZE) this.x += GRID_SIZE;
        break;
    }
    // Ensure frog stays within canvas bounds
    if (this.x < 0) this.x = 0;
    if (this.x > canvas.width - FROG_SIZE) this.x = canvas.width - FROG_SIZE;
    this.isOnLog = false; // Reset log status when moving
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
    this.reset();
  }

  getWidth() {
    switch (this.type) {
      case OBSTACLE_TYPES.CAR:
        return 60;
      case OBSTACLE_TYPES.RIVER:
        return 100; // Log width
      default:
        return 60;
    }
  }

  reset() {
    if (this.direction > 0) {
      this.x = -this.width;
    } else {
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
        break;
      case OBSTACLE_TYPES.TRAIN:
        this.drawTrain();
        break;
    }
  }

  drawCar() {
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "yellow";
    if (this.direction > 0) {
      ctx.fillRect(this.x + this.width - 10, this.y + 5, 5, 5);
      ctx.fillRect(this.x + this.width - 10, this.y + this.height - 10, 5, 5);
    } else {
      ctx.fillRect(this.x + 5, this.y + 5, 5, 5);
      ctx.fillRect(this.x + 5, this.y + this.height - 10, 5, 5);
    }
  }

  drawLog() {
    ctx.fillStyle = "#8B4513"; // Brown color for log
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  drawTrain() {
    // Locomotive

    const locomotiveWidth = 60;

    // Carriages
    ctx.fillStyle = "#4A4A4A";
    const carriageCount = Math.floor((this.width - locomotiveWidth) / 50);
    for (let i = 0; i < carriageCount; i++) {
      ctx.fillRect(this.x + i * 50, this.y, 45, this.height);
    }

    //locomotive
    ctx.fillStyle = "#333333";
    ctx.fillRect(
      this.x + carriageCount * 50,
      this.y,
      locomotiveWidth,
      this.height,
    );

    // Chimney
    ctx.fillStyle = "#666666";
    ctx.fillRect(
      this.x + carriageCount * 50 + locomotiveWidth - 20,
      this.y - 10,
      10,
      10,
    );

    // Windows
    ctx.fillStyle = "#FFFF00";
    for (let i = 0; i < carriageCount + 1; i++) {
      const xPos = this.x + i * 50;
      ctx.fillRect(xPos + 15, this.y + 5, 20, 8);
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
    this.obstacles =
      type === OBSTACLE_TYPES.TRAIN ? [] : this.generateObstacles();
  }

  generateObstacles() {
    if (this.type === OBSTACLE_TYPES.SAFE) return [];

    const obstacles = [];
    const numberOfObstacles = Math.floor(Math.random() * 3) + 2; // 2-4 obstacles per row
    const speed = Math.random() + 1; // Speed between 1-3
    const direction = Math.random() < 0.5 ? 1 : -1;

    for (let i = 0; i < numberOfObstacles; i++) {
      obstacles.push(new Obstacle(this.y, speed, direction, this.type));

      if (this.type === OBSTACLE_TYPES.RIVER) {
        // Offset the second log by a small gap
        const secondLog = new Obstacle(this.y, speed, direction, this.type);
        secondLog.x =
          obstacles[obstacles.length - 1].x +
          secondLog.width +
          Math.random() * 100;
        obstacles.push(secondLog);
      }
    }

    return obstacles;
  }

  update() {
    this.obstacles.forEach((obstacle) => obstacle.update());
  }

  draw() {
    if (this.type === OBSTACLE_TYPES.RIVER) {
      ctx.fillStyle = "#4444FF";
      ctx.fillRect(0, this.y, canvas.width, GRID_SIZE);
    } else if (this.type === OBSTACLE_TYPES.SAFE) {
      ctx.fillStyle = "#32a852";
      ctx.fillRect(0, this.y, canvas.width, GRID_SIZE);
    }
    this.obstacles.forEach((obstacle) => obstacle.draw());
  }
}

class TrainRow extends Row {
  constructor(y) {
    super(y, OBSTACLE_TYPES.TRAIN);
    this.trainCooldown = 5000; // 10 seconds in milliseconds
    this.warningTime = 2000; // 2 seconds warning
    this.lastTrainTime = Date.now() - Math.random() * this.trainCooldown; // Random initial delay
    this.isWarning = false;
    this.train = new Obstacle(y, 12, 1, OBSTACLE_TYPES.TRAIN); // Higher speed for train
    this.train.width = canvas.width + 40; // Make train longer than canvas
    this.train.x = -this.train.width; // Start off-screen
    this.isTrainActive = false;
  }

  update() {
    const currentTime = Date.now();
    const timeSinceLastTrain = currentTime - this.lastTrainTime;

    // Update warning status
    this.isWarning =
      timeSinceLastTrain >= this.trainCooldown - this.warningTime &&
      timeSinceLastTrain < this.trainCooldown;

    // Check if it's time to send a new train
    if (timeSinceLastTrain >= this.trainCooldown && !this.isTrainActive) {
      this.isTrainActive = true;
      this.train.x = -this.train.width;
    }

    // Update train position
    if (this.isTrainActive) {
      this.train.x += this.train.speed;

      // Check if train has left the screen
      if (this.train.x > canvas.width) {
        this.isTrainActive = false;
        this.lastTrainTime = currentTime;
      }
    }
  }

  draw() {
    // Draw warning or regular background
    ctx.fillStyle = this.isWarning ? "#FFA500" : "#666666"; // Orange for warning, gray otherwise
    ctx.fillRect(0, this.y, canvas.width, GRID_SIZE);

    // Draw train tracks
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, this.y + GRID_SIZE / 2 - 2, canvas.width, 4);

    // Draw train if it's active
    if (this.isTrainActive) {
      this.train.draw();
    }

    // Debug info - uncomment to see train status
    /*
    ctx.fillStyle = "white";
    ctx.font = "10px Arial";
    ctx.fillText(`Train Active: ${this.isTrainActive}`, 10, this.y + 10);
    ctx.fillText(`Warning: ${this.isWarning}`, 10, this.y + 20);
    ctx.fillText(`Train X: ${Math.floor(this.train.x)}`, 100, this.y + 10);
    */
  }
}

class Game {
  constructor() {
    this.frog = new Frog();
    this.rows = this.generateRows();
    this.gameOver = false;
    this.score = 0;
  }
  generateRows() {
    const rows = [];
    for (let i = 0; i < ROWS; i++) {
      const y = i * GRID_SIZE;
      if (i == ROWS - 1 || i == ROWS - 2) {
        const type = OBSTACLE_TYPES.SAFE;
        rows.push(new Row(y, type));
      } else {
        const type = this.getRandomRowType();
        if (type === OBSTACLE_TYPES.TRAIN) {
          rows.push(new TrainRow(y));
        } else {
          rows.push(new Row(y, type));
        }
      }
    }
    return rows;
  }

  getRandomRowType() {
    const types = [
      OBSTACLE_TYPES.CAR,
      OBSTACLE_TYPES.RIVER,
      OBSTACLE_TYPES.TRAIN,
      OBSTACLE_TYPES.SAFE,
    ];
    const weights = [40, 30, 20, 15]; // Adjusted weights to make trains less common

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < types.length; i++) {
      if (random < weights[i]) {
        return types[i];
      }
      random -= weights[i];
    }
    return types[0];
  }

  checkCollision() {
    const currentRow = Math.floor(this.frog.y / GRID_SIZE);
    if (currentRow < 0 || currentRow >= this.rows.length) return false;

    const row = this.rows[currentRow];

    if (row instanceof TrainRow) {
      // Check collision with train
      if (
        row.train.x > -row.train.width &&
        this.isOverlapping(this.frog, row.train)
      ) {
        return true;
      }
    } else if (row.type === OBSTACLE_TYPES.RIVER) {
      let isOnAnyLog = false;
      for (const log of row.obstacles) {
        if (this.isOverlapping(this.frog, log)) {
          isOnAnyLog = true;
          this.frog.isOnLog = true;
          this.frog.moveWithLog(log.speed * log.direction);
          break;
        }
      }
      return !isOnAnyLog; // If in river but not on log, it's a collision
    } else if (row.type === OBSTACLE_TYPES.CAR) {
      // Check collision with cars
      for (const obstacle of row.obstacles) {
        if (this.isOverlapping(this.frog, obstacle)) {
          return true;
        }
      }
    }
    return false;
  }

  isOverlapping(frog, obstacle) {
    return (
      frog.x < obstacle.x + obstacle.width &&
      frog.x + FROG_SIZE > obstacle.x &&
      frog.y < obstacle.y + obstacle.height &&
      frog.y + FROG_SIZE > obstacle.y
    );
  }

  update() {
    if (!this.gameOver) {
      this.rows.forEach((row) => row.update());

      if (this.checkCollision()) {
        this.gameOver = true;
      }

      if (this.frog.y === 0) {
        this.score++;
        this.frog.reset();
        this.rows = this.generateRows();
      }
    }
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.rows.forEach((row) => row.draw());
    this.frog.draw();

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${this.score}`, 10, 25);
    /*
    if (this.gameOver) {
      console.log("its over");
      ctx.fillStyle = "red";
      ctx.font = "40px Arial";
      ctx.fillText("Game Over!", canvas.width / 2 - 100, canvas.height / 2);
      ctx.font = "20px Arial";
      ctx.fillText(
        "Press Space to restart",
        canvas.width / 2 - 90,
        canvas.height / 2 + 40,
      );
    }*/
  }

  reset() {
    this.frog.reset();
    this.rows = this.generateRows();
    this.gameOver = false;
    this.score = 0;
  }
}
