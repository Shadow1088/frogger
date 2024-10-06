// Add these constants at the beginning of your code
const GAME_STATES = {
  MENU: "menu",
  PLAYING: "playing",
  GAME_OVER: "gameOver",
  LEADERBOARD: "leaderboard",
};

class LeaderboardEntry {
  constructor(playerName, score, time) {
    this.playerName = playerName;
    this.score = score;
    this.time = time;
  }
}

class GameManager {
  constructor() {
    this.currentState = GAME_STATES.MENU;
    this.playerName = "";
    this.leaderboard = [];
    this.game = new Game();
    this.menuGame = new Game();
    this.startTime = 0;
    this.endTime = 0;
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    const storedLeaderboard = localStorage.getItem("froggerLeaderboard");
    if (storedLeaderboard) {
      this.leaderboard = JSON.parse(storedLeaderboard);
    }
  }

  saveLeaderboard() {
    localStorage.setItem(
      "froggerLeaderboard",
      JSON.stringify(this.leaderboard),
    );
  }

  updateLeaderboard(score, time) {
    for (let i = 1; i <= score; i++) {
      const entry = new LeaderboardEntry(this.playerName, i, time);
      this.addLeaderboardEntry(entry);
    }
    this.saveLeaderboard();
  }

  addLeaderboardEntry(newEntry) {
    // Find existing entry for this score
    const existingIndex = this.leaderboard.findIndex(
      (entry) => entry.score === newEntry.score,
    );

    if (existingIndex === -1) {
      // No existing entry for this score, add new one
      this.leaderboard.push(newEntry);
    } else if (newEntry.time < this.leaderboard[existingIndex].time) {
      // New entry has better time, replace old one
      this.leaderboard[existingIndex] = newEntry;
    }

    // Sort leaderboard by score (descending) and time (ascending)
    this.leaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.time - b.time;
    });
  }

  startGame() {
    if (!this.playerName) return;
    this.currentState = GAME_STATES.PLAYING;
    this.game.reset();
    this.startTime = Date.now();
  }

  update() {
    if (this.currentState === GAME_STATES.MENU) {
      this.menuGame.rows.forEach((row) => row.update());
    }

    if (this.currentState === GAME_STATES.PLAYING) {
      this.game.update();
      if (this.game.gameOver) {
        this.endTime = Date.now();
        const totalTime = ((this.endTime - this.startTime) / 1000).toFixed(1);
        this.updateLeaderboard(this.game.score, totalTime);
        this.currentState = GAME_STATES.GAME_OVER;
      }
    }
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (this.currentState) {
      case GAME_STATES.MENU:
        this.drawMenuBackground();
        this.drawMenu();
        break;
      case GAME_STATES.PLAYING:
        this.game.draw();
        this.drawGameUI();
        if (this.game.gameOver) {
          this.drawGameOver();
        }
        break;
      case GAME_STATES.LEADERBOARD:
        this.drawMenuBackground();
        this.drawLeaderboard();
        break;
      case GAME_STATES.GAME_OVER:
        this.drawGameOver(); // Draw the Game Over overlay
        break;
    }
  }

  drawMenuBackground() {
    // Draw the animated background
    this.menuGame.rows.forEach((row) => row.draw());

    // Draw semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawMenu() {
    ctx.fillStyle = "green";
    ctx.font = "40px Arial";
    ctx.fillText("FROGGER", canvas.width / 2 - 80, 100);

    ctx.font = "20px Arial";
    if (!this.playerName) {
      ctx.fillText("Enter your name:", canvas.width / 2 - 70, 200);
      ctx.strokeStyle = "green";
      ctx.strokeRect(canvas.width / 2 - 100, 220, 200, 40);
    } else {
      ctx.fillText(`Welcome, ${this.playerName}!`, canvas.width / 2 - 70, 200);
      ctx.fillText("Press ENTER to Play", canvas.width / 2 - 70, 250);
      ctx.fillText("Press L for Leaderboard", canvas.width / 2 - 80, 290);
    }
  }

  drawGameUI() {
    const currentTime = this.game.gameOver
      ? ((this.endTime - this.startTime) / 1000).toFixed(1)
      : ((Date.now() - this.startTime) / 1000).toFixed(1);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Time: ${currentTime}s`, canvas.width - 120, 25);
  }

  drawGameOver() {
    const totalTime = ((this.endTime - this.startTime) / 1000).toFixed(1);

    this.game.draw();

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over!", canvas.width / 2 - 100, canvas.height / 2 - 40);

    ctx.font = "20px Arial";
    ctx.fillText(
      `Final Score: ${this.game.score}`,
      canvas.width / 2 - 60,
      canvas.height / 2,
    );
    ctx.fillText(
      `Time: ${totalTime}s`,
      canvas.width / 2 - 40,
      canvas.height / 2 + 30,
    );
    ctx.fillText(
      "Press SPACE to restart",
      canvas.width / 2 - 90,
      canvas.height / 2 + 70,
    );
    ctx.fillText(
      "Press ENTER for Menu",
      canvas.width / 2 - 90,
      canvas.height / 2 + 100,
    );
  }

  startGame() {
    if (!this.playerName) return;
    this.currentState = GAME_STATES.PLAYING;
    this.game.reset();
    this.startTime = Date.now();
    this.endTime = 0;
  }

  resetGame() {
    this.startGame();
  }

  returnToMenu() {
    this.currentState = GAME_STATES.MENU;
    this.menuGame = new Game(); // Reset menu background
  }

  drawLeaderboard() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "green";
    ctx.font = "30px Arial";
    ctx.fillText("Leaderboard", canvas.width / 2 - 70, 50);

    ctx.font = "20px Arial";
    this.leaderboard.forEach((entry, index) => {
      const y = 100 + index * 30;
      ctx.fillText(
        `${entry.score}. ${entry.playerName} - ${parseFloat(entry.time).toFixed(1)}s`,
        50,
        y,
      );
    });

    ctx.fillText(
      "Press SPACE to return to menu",
      canvas.width / 2 - 120,
      canvas.height - 50,
    );
  }
}

// Modify the initGame function
function initGame() {
  const gameManager = new GameManager(); // Create new instance of GameManager

  function gameLoop() {
    gameManager.update();
    gameManager.draw();
    requestAnimationFrame(gameLoop);
  }

  document.addEventListener("keydown", (event) => {
    switch (gameManager.currentState) {
      case GAME_STATES.MENU:
        if (!gameManager.playerName) {
          if (event.key.length === 1) {
            gameManager.playerName += event.key;
          } else if (event.key === "Backspace") {
            gameManager.playerName = gameManager.playerName.slice(0, -1);
          }
        } else {
          if (event.key === "Enter") {
            gameManager.startGame();
          } else if (event.key.toLowerCase() === "l") {
            gameManager.currentState = GAME_STATES.LEADERBOARD;
          }
        }
        break;

      case GAME_STATES.PLAYING:
        switch (event.code) {
          case "ArrowUp":
            gameManager.game.frog.move("up");
            break;
          case "ArrowDown":
            gameManager.game.frog.move("down");
            break;
          case "ArrowLeft":
            gameManager.game.frog.move("left");
            break;
          case "ArrowRight":
            gameManager.game.frog.move("right");
            break;
        }
        break;

      case GAME_STATES.GAME_OVER:
        //gameManager.drawGameOver();
        if (event.code === "Space") {
          gameManager.resetGame();
          console.log("Space");
        } else if (event.code === "Enter") {
          gameManager.returnToMenu();
        }
        break;

      case GAME_STATES.LEADERBOARD:
        if (event.code === "Space") {
          gameManager.returnToMenu();
        }
        break;
    }
  });

  gameLoop();
}

// Call initGame when the window loads
window.onload = initGame;
