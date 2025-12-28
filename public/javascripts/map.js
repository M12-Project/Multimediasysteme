const museum = document.getElementById("museum");
const roomInfo = document.getElementById("roomInfo");

/*
  1 = Mauer (schwarz)
  0 = Raum / Flur (weiß)
*/
const map = [
  // 0 1 2 3 4 5 6 7 8 9 10 11
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,1,0,1,0,0,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,1,0,1,0,0,0,1],
  [1,1,1,1,1,1,0,1,1,0,1,1],

  // Flur (horizontal)
  [0,0,0,0,0,0,0,0,0,0,0,1],

  [1,1,1,0,1,1,1,1,1,0,1,1],
  [1,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
];

// Startposition im Flur
let player = { x: 5, y: 5 };

function renderMap() {
  museum.innerHTML = "";

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {

      const cell = document.createElement("div");
      cell.classList.add("cell");

      if (map[y][x] === 1) {
        cell.classList.add("wall");
      }

      if (player.x === x && player.y === y) {
        const dot = document.createElement("div");
        dot.classList.add("player");
        cell.appendChild(dot);
      }

      museum.appendChild(cell);
    }
  }
}

renderMap();
