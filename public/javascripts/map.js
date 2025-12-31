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
   RÄUME
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
   HILFSFUNKTIONEN
-------------------------- */
function getRoomByCell(x, y) {
  for (const key in rooms) {
    for (const c of rooms[key].cells) {
      if (c[0] === x && c[1] === y) return rooms[key];
    }
  }
  return null;
}

function getCellPixelCenter(x, y) {
  const cols = museum.style.gridTemplateColumns.split(" ");
  const rows = museum.style.gridTemplateRows.split(" ");

  let px = 0, py = 0;
  for (let i = 0; i < x; i++) px += parseInt(cols[i]);
  for (let i = 0; i < y; i++) py += parseInt(rows[i]);

  return {
    x: px + parseInt(cols[x]) / 2,
    y: py + parseInt(rows[y]) / 2
  };
}

/* -------------------------
   GRID
-------------------------- */
function generateGridTemplate() {
  const colSizes = map[0].map((_, x) =>
    map.some(row => row[x] === 1) ? WALL_SIZE + "px" : ROOM_SIZE + "px"
  );
  const rowSizes = map.map(row =>
    row.includes(1) ? WALL_SIZE + "px" : ROOM_SIZE + "px"
  );

  museum.style.gridTemplateColumns = colSizes.join(" ");
  museum.style.gridTemplateRows = rowSizes.join(" ");
}

generateGridTemplate();

/* -------------------------
   PATHFINDING (BFS)
-------------------------- */
function findPath(sx, sy, tx, ty) {
  const q = [[sx, sy]];
  const v = new Set([`${sx},${sy}`]);
  const p = {};
  const d = [[1,0],[-1,0],[0,1],[0,-1]];

  while (q.length) {
    const [x, y] = q.shift();
    if (x === tx && y === ty) {
      const path = [];
      let cur = `${x},${y}`;
      while (cur) {
        const [cx, cy] = cur.split(",").map(Number);
        path.unshift({ x: cx, y: cy });
        cur = p[cur];
      }
      return path;
    }
    for (const [dx, dy] of d) {
      const nx = x + dx, ny = y + dy;
      if (
        map[ny]?.[nx] === 0 &&
        !v.has(`${nx},${ny}`)
      ) {
        v.add(`${nx},${ny}`);
        p[`${nx},${ny}`] = `${x},${y}`;
        q.push([nx, ny]);
      }
    }
  }
  return null;
}

/* -------------------------
   SPIELER
-------------------------- */
function movePlayerSmooth(tx, ty) {
  const el = document.querySelector(".player");
  const s = getCellPixelCenter(player.x, player.y);
  const e = getCellPixelCenter(tx, ty);

  let t = 0;
  const i = setInterval(() => {
    t += 0.08;
    if (t >= 1) {
      t = 1;
      clearInterval(i);
      player = { x: tx, y: ty };
    }
    el.style.left = s.x + (e.x - s.x) * t - 7 + "px";
    el.style.top  = s.y + (e.y - s.y) * t - 7 + "px";
  }, 30);
}

function followPath(path) {
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
   MAP RENDER
-------------------------- */
function renderMap() {
  museum.innerHTML = "";

  // Zellen
  map.forEach((row, y) => row.forEach((val, x) => {
    const cell = document.createElement("div");
    cell.className = "cell";

    if (val === 1) {
      const w = document.createElement("div");
      w.className = "wall";
      cell.appendChild(w);
    }

    cell.onclick = () => {
      if (val === 0) {
        const r = getRoomByCell(x, y);
        roomInfo.innerHTML = r
          ? `Raum: ${r.name}<br>Info: ${r.info}`
          : "Raum: Flur<br>Info: –";

        const path = findPath(player.x, player.y, x, y);
        if (path) followPath(path);
      }
    };

    museum.appendChild(cell);
  }));

  // Spieler
  const p = document.createElement("div");
  p.className = "player";
  museum.appendChild(p);
  const pos = getCellPixelCenter(player.x, player.y);
  p.style.left = pos.x - 7 + "px";
  p.style.top  = pos.y - 7 + "px";

  // 🔹 Raum-Beschriftungen (korrekt IN der Map)
  for (const key in rooms) {
    const room = rooms[key];
    let sx = 0, sy = 0;

    room.cells.forEach(c => {
      const p = getCellPixelCenter(c[0], c[1]);
      sx += p.x;
      sy += p.y;
    });

    const label = document.createElement("div");
    label.className = "room-label";
    label.textContent = room.name;
    label.style.left = sx / room.cells.length + "px";
    label.style.top  = sy / room.cells.length + "px";

    museum.appendChild(label);
  }
}

renderMap();
