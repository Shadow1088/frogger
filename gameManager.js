let player_temp = "";
import config from "./config.js";

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

    this.gistLeaderboard = new GistLeaderboard(
      config.GIST_ID,
      config.GITHUB_TOKEN,
    );

    this.loadLeaderboard();

    // Leaderboard scrolling variables
    this.leaderboardScroll = 0;
    this.leaderboardMaxScroll = 0;
    this.leaderboardEntriesPerPage = 8; // Entries per screen
  }

  async loadLeaderboard() {
    const gistLeaderboard = await this.gistLeaderboard.fetchLeaderboard();
    this.leaderboard = gistLeaderboard || [];
    this.updateLeaderboardScroll();
  }

  saveLeaderboard() {
    this.gistLeaderboard.updateLeaderboard(this.leaderboard);
  }

  updateLeaderboard(score, time) {
    // Only create one entry for the final score
    const entry = new LeaderboardEntry(this.playerName, score, time);
    this.addLeaderboardEntry(entry);
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

    this.updateLeaderboardScroll(); // Update scrolling after adding an entry
  }

  updateLeaderboardScroll() {
    this.leaderboardMaxScroll = Math.max(
      0,
      Math.ceil(this.leaderboard.length / this.leaderboardEntriesPerPage) - 1,
    );
    this.leaderboardScroll = Math.min(
      this.leaderboardScroll,
      this.leaderboardMaxScroll,
    );
  }

  update() {
    if (this.currentState === GAME_STATES.MENU) {
      this.menuGame.rows.forEach((row) => row.update());
    }

    if (this.currentState === GAME_STATES.PLAYING) {
      const previousScore = this.game.score;
      this.game.update();

      // Check if score has increased
      if (this.game.score > previousScore) {
        const currentTime = Date.now();
        const scoreTime = ((currentTime - this.startTime) / 1000).toFixed(1);
        this.updateLeaderboard(previousScore + 1, scoreTime);
      }

      // Handle game over
      if (this.game.gameOver) {
        this.endTime = Date.now();
        const totalTime = ((this.endTime - this.startTime) / 1000).toFixed(1);
        // We don't need to update leaderboard here as it's already updated for each score
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
      ctx.fillText(player_temp, canvas.width / 2 - 90, 245);
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
    ctx.fillText("Leaderboard", canvas.width / 2 - 70, 55);
    ctx.font = "12px Arial";
    ctx.fillText("*leaderboard is cleared after every bug fix", 20, 20);

    ctx.font = "20px Arial";

    // Calculate start and end index for the current page
    const startIndex = this.leaderboardScroll * this.leaderboardEntriesPerPage;
    const endIndex =
      startIndex + this.leaderboardEntriesPerPage > this.leaderboard.length
        ? this.leaderboard.length
        : startIndex + this.leaderboardEntriesPerPage;

    for (let i = startIndex; i < endIndex; i++) {
      const entry = this.leaderboard[i];
      const y = 100 + (i - startIndex) * 30; // Adjust y for the current page
      ctx.fillText(
        `${entry.score}. ${entry.playerName} - ${parseFloat(entry.time).toFixed(
          1,
        )}s`,
        50,
        y,
      );
    }

    ctx.fillText(
      "Press SPACE to return to menu",
      canvas.width / 2 - 120,
      canvas.height - 50,
    );
  }
}

// Modify the initGame function
function initGame() {
  const gameManager = new GameManager();

  function gameLoop() {
    gameManager.update();
    gameManager.draw();
    requestAnimationFrame(gameLoop);
  }

  document.addEventListener("keydown", async (event) => {
    switch (gameManager.currentState) {
      case GAME_STATES.MENU:
        if (!gameManager.playerName) {
          if (event.key.length === 1) {
            player_temp += event.key;

            console.log("key press");
            event.preventDefault();
          } else if (event.key === "Backspace") {
            player_temp = player_temp.slice(0, -1);
          } else if (event.key === "Enter") {
            gameManager.playerName = player_temp;
          }
        } else {
          if (event.key === "Enter") {
            gameManager.startGame();
          } else if (event.key.toLowerCase() === "l") {
            gameManager.currentState = GAME_STATES.LEADERBOARD;
            await gameManager.loadLeaderboard(); // Refresh leaderboard when viewing
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
        if (event.code === "Space") {
          gameManager.resetGame();
        } else if (event.code === "Enter") {
          gameManager.returnToMenu();
        }
        break;

      case GAME_STATES.LEADERBOARD:
        if (event.code === "Space") {
          gameManager.returnToMenu();
        } else if (
          event.code === "ArrowUp" &&
          gameManager.leaderboardScroll > 0
        ) {
          gameManager.leaderboardScroll--;
        } else if (
          event.code === "ArrowDown" &&
          gameManager.leaderboardScroll < gameManager.leaderboardMaxScroll
        ) {
          gameManager.leaderboardScroll++;
        }
        break;
    }
  });

  gameLoop();
}

initGame().catch(console.error);
