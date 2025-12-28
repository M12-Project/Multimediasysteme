const museum = document.getElementById("museum");
const roomInfo = document.getElementById("roomInfo");

/*
  1 = Mauer (schwarz)
  0 = Raum / Flur (weiß)
*/
const map = [
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,1,0,1,0,0,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,1,0,1,0,0,0,1],
  [1,1,1,1,1,1,0,1,1,0,1,1],

  [0,0,0,0,0,0,0,0,0,0,0,1],

  [1,1,1,0,1,1,1,1,1,0,1,1],
  [1,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
];

// Startposition
let player = { x: 5, y: 5 };

const WALL_SIZE = 30;   // Wandbreite
const ROOM_SIZE = 10;  // Raumgröße (hier kannst du die Map größer machen!)

/* -------------------------
   RÄUME DEFINIEREN
-------------------------- */
const rooms = {
  raum1: {
    name: "Eingangshalle",
    cells: [
      [1,1],[2,1],[3,1],[4,1],
      [1,2],[2,2],[3,2],[4,2],
      [1,3],[2,3],[3,3],[4,3]
    ]
  },

  raum2: {
    name: "Ausstellung A",
    cells: [
      [8,1],[9,1],[10,1],
      [8,2],[9,2],[10,2],
      [8,3],[9,3],[10,3]
    ]
  },

  raum3: {
    name: "Werkstatt",
    cells: [
      [1,7],[2,7],[3,7],
      [1,8],[2,8],[3,8],
      [1,9],[2,9],[3,9]
    ]
  },

  raum4: {
    name: "Archiv",
    cells: [
      [7,7],[8,7],[9,7],
      [7,8],[8,8],[9,8],
      [7,9],[8,9],[9,9]
    ]
  }
};

/* -------------------------
   RAUM ERKENNEN
-------------------------- */
function getRoomByCell(x, y) {
  for (const key in rooms) {
    const room = rooms[key];
    for (const cell of room.cells) {
      if (cell[0] === x && cell[1] === y) {
        return room;
      }
    }
  }
  return null;
}

/* -------------------------
   GRID DYNAMISCH ERZEUGEN
-------------------------- */
function generateGridTemplate() {
  const cols = map[0].length;
  const rows = map.length;

  const colSizes = [];
  const rowSizes = [];

  for (let x = 0; x < cols; x++) {
    let hasWall = false;
    for (let y = 0; y < rows; y++) {
      if (map[y][x] === 1) hasWall = true;
    }
    colSizes.push(hasWall ? WALL_SIZE + "px" : ROOM_SIZE + "px");
  }

  for (let y = 0; y < rows; y++) {
    let hasWall = false;
    for (let x = 0; x < cols; x++) {
      if (map[y][x] === 1) hasWall = true;
    }
    rowSizes.push(hasWall ? WALL_SIZE + "px" : ROOM_SIZE + "px");
  }

  museum.style.gridTemplateColumns = colSizes.join(" ");
  museum.style.gridTemplateRows = rowSizes.join(" ");
}

generateGridTemplate();

/* -------------------------
   PIXELPOSITION BERECHNEN
-------------------------- */
function getCellPixelPosition(x, y) {
  const colSizes = museum.style.gridTemplateColumns.split(" ");
  const rowSizes = museum.style.gridTemplateRows.split(" ");

  let px = 0;
  for (let i = 0; i < x; i++) px += parseInt(colSizes[i]);

  let py = 0;
  for (let i = 0; i < y; i++) py += parseInt(rowSizes[i]);

  return { x: px, y: py };
}

/* -------------------------
   SPIELER SMOOTH BEWEGEN
-------------------------- */
function movePlayerSmooth(targetX, targetY) {
  const playerEl = document.querySelector(".player");
  if (!playerEl) return;

  const start = getCellPixelPosition(player.x, player.y);
  const end = getCellPixelPosition(targetX, targetY);

  let progress = 0;
  const duration = 400;
  const fps = 60;

  const dx = end.x - start.x;
  const dy = end.y - start.y;

  const interval = setInterval(() => {
    progress += 1 / (duration / (1000 / fps));

    if (progress >= 1) {
      progress = 1;
      clearInterval(interval);
      player.x = targetX;
      player.y = targetY;
    }

    playerEl.style.left = start.x + dx * progress + "px";
    playerEl.style.top = start.y + dy * progress + "px";

  }, 1000 / fps);
}

/* -------------------------
   SPIELER POSITIONIEREN
-------------------------- */
function positionPlayer() {
  const playerEl = document.querySelector(".player");
  const pos = getCellPixelPosition(player.x, player.y);
  playerEl.style.left = pos.x + "px";
  playerEl.style.top = pos.y + "px";
}

/* -------------------------
   MAP RENDERN
-------------------------- */
function renderMap() {
  museum.innerHTML = "";

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {

      const cell = document.createElement("div");
      cell.classList.add("cell");

      if (map[y][x] === 1) {
        const wall = document.createElement("div");
        wall.classList.add("wall");
        cell.appendChild(wall);
      }

      // Klick auf Zelle
      cell.addEventListener("click", () => {
        if (map[y][x] === 0) {
          const room = getRoomByCell(x, y);

          if (room) {
            roomInfo.innerText = "Raum: " + room.name;
          } else {
            roomInfo.innerText = "Flur";
          }

          movePlayerSmooth(x, y);
        }
      });

      museum.appendChild(cell);
    }
  }

  // Spieler hinzufügen
  const playerEl = document.createElement("div");
  playerEl.classList.add("player");
  museum.appendChild(playerEl);

  positionPlayer();
}

renderMap();
