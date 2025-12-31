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

const WALL_SIZE = 30;
const ROOM_SIZE = 10;

/* -------------------------
   RÄUME DEFINIEREN
-------------------------- */
const rooms = {
  raum1: {
    name: "Eingangshalle",
    info: "Willkommen im Museum. Von hier aus erreichen Sie alle Ausstellungen.",
    cells: [
      [1,1],[2,1],[3,1],[4,1],
      [1,2],[2,2],[3,2],[4,2],
      [1,3],[2,3],[3,3],[4,3]
    ]
  },
  raum2: {
    name: "Ausstellung A",
    info: "Moderne Kunst und interaktive Exponate.",
    cells: [
      [8,1],[9,1],[10,1],
      [8,2],[9,2],[10,2],
      [8,3],[9,3],[10,3]
    ]
  },
  raum3: {
    name: "Werkstatt",
    info: "Hier entstehen neue Ausstellungsstücke.",
    cells: [
      [1,7],[2,7],[3,7],
      [1,8],[2,8],[3,8],
      [1,9],[2,9],[3,9]
    ]
  },
  raum4: {
    name: "Archiv",
    info: "Zugang nur für Mitarbeitende.",
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
    for (const cell of rooms[key].cells) {
      if (cell[0] === x && cell[1] === y) {
        return rooms[key];
      }
    }
  }
  return null;
}

/* -------------------------
   GRID ERZEUGEN
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
   ZELL MITTELPUNKT
-------------------------- */
function getCellPixelCenter(x, y) {
  const colSizes = museum.style.gridTemplateColumns.split(" ");
  const rowSizes = museum.style.gridTemplateRows.split(" ");

  let px = 0;
  for (let i = 0; i < x; i++) px += parseInt(colSizes[i]);

  let py = 0;
  for (let i = 0; i < y; i++) py += parseInt(rowSizes[i]);

  const cellWidth = parseInt(colSizes[x]);
  const cellHeight = parseInt(rowSizes[y]);

  return {
    x: px + cellWidth / 2 - 7,
    y: py + cellHeight / 2 - 7
  };
}

/* -------------------------
   PATHFINDING (BFS)
-------------------------- */
function findPath(startX, startY, targetX, targetY) {
  const queue = [[startX, startY]];
  const visited = new Set([`${startX},${startY}`]);
  const parent = {};

  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  while (queue.length) {
    const [x, y] = queue.shift();

    if (x === targetX && y === targetY) {
      const path = [];
      let cur = `${x},${y}`;
      while (cur) {
        const [cx, cy] = cur.split(",").map(Number);
        path.unshift({ x: cx, y: cy });
        cur = parent[cur];
      }
      return path;
    }

    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;

      if (
        ny >= 0 && ny < map.length &&
        nx >= 0 && nx < map[0].length &&
        map[ny][nx] === 0 &&
        !visited.has(`${nx},${ny}`)
      ) {
        visited.add(`${nx},${ny}`);
        parent[`${nx},${ny}`] = `${x},${y}`;
        queue.push([nx, ny]);
      }
    }
  }
  return null;
}

/* -------------------------
   SPIELER BEWEGEN
-------------------------- */
function movePlayerSmooth(targetX, targetY) {
  const playerEl = document.querySelector(".player");
  if (!playerEl) return;

  const start = getCellPixelCenter(player.x, player.y);
  const end = getCellPixelCenter(targetX, targetY);

  let progress = 0;
  const duration = 350;
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

function followPath(path) {
  if (!path || path.length < 2) return;
  let i = 1;

  function step() {
    if (i >= path.length) return;
    movePlayerSmooth(path[i].x, path[i].y);
    i++;
    setTimeout(step, 380);
  }
  step();
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

      cell.addEventListener("click", () => {
        if (map[y][x] === 0) {
          const room = getRoomByCell(x, y);

          roomInfo.innerHTML = room
            ? `Raum: ${room.name}<br>Info: ${room.info}`
            : "Raum: Flur<br>Info: –";

          const path = findPath(player.x, player.y, x, y);
          if (path) followPath(path);
        }
      });

      museum.appendChild(cell);
    }
  }

  const playerEl = document.createElement("div");
  playerEl.classList.add("player");
  museum.appendChild(playerEl);

  const startPos = getCellPixelCenter(player.x, player.y);
  playerEl.style.left = startPos.x + "px";
  playerEl.style.top = startPos.y + "px";
}

renderMap();