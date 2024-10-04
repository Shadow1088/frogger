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
  constructor() {
    this.reset();
  }
}
