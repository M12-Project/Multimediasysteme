const museum = document.getElementById("museum");
const roomInfo = document.getElementById("roomInfo");
const speakBtn = document.getElementById("speakBtn");
let currentSpeechText = "";

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

const WALL_SIZE = 28;
const ROOM_SIZE = 10;

/* -------------------------
   RÄUME
-------------------------- */
const rooms = {
  raum1: {
    name: "Einleitung",
    info: "Museen stehen im digitalen Wandel und konkurrieren zunehmend mit digitalen Freizeitangeboten wie Streaming oder Games.<br><br>Interaktive Technologien bieten neue Möglichkeiten, Aufmerksamkeit zu erzeugen und Besucher aktiv einzubinden.<br><br>Diese Arbeit untersucht, welche digitalen Technologien besonders geeignet sind, das Besucherinteresse zu steigern und die Verweildauer im Museum zu verlängern.<br><br><strong>Fragestellung:</strong> Welche interaktiven Technologien sind im Museumskontext am effektivsten, um das Interesse und die Verweildauer von Besuchern zu steigern?",
    cells: [
      [1,1],[2,1],[3,1],[4,1],
      [1,2],[2,2],[3,2],[4,2],
      [1,3],[2,3],[3,3],[4,3]
    ]
  },

  raum2: {
    name: "Theoretische Grundlagen",
    info: " Interaktive Technologien im Museum beziehen Besucher aktiv in das Ausstellungsgeschehen ein. Dazu zählen unter anderem Audio-Guides, Touchscreens sowie immersive Technologien wie Virtual und Augmented Reality. Zentrale Kriterien zur Bewertung des Benutzererlebnisses sind das Besucherinteresse sowie die Verweildauer, die als Indikatoren für Aufmerksamkeit, Engagement und inhaltliche Auseinandersetzung gelten.",
    cells: [
      [8,1],[9,1],[10,1],
      [8,2],[9,2],[10,2],
      [8,3],[9,3],[10,3]
    ]
  },

  raum3: {
    name: "Vergleich interaktiver Technologien",
    info: "Aktuelle Studien zeigen deutliche Unterschiede zwischen VR/AR-Technologien und Audio-Guides. Immersive VR- und AR-Anwendungen erzeugen starke emotionale Beteiligung und hohe Aufmerksamkeit, was zu intensivem situativem Interesse und längerer Verweildauer führt. Audio-Guides unterstützen vor allem eine strukturierte, narrative und selbstgesteuerte Informationsaufnahme und fördern eine bewusste Auseinandersetzung mit den Inhalten.",
    cells: [
      [1,7],[2,7],[3,7],[4,7],
      [1,8],[2,8],[3,8],[4,8],
      [1,9],[2,9],[3,9],[4,9]
    ]
  },

  raum4: {
    name: "Fazit",
    info: "Die Ergebnisse zeigen, dass sowohl VR/AR-Technologien als auch Audio-Guides das Besucherinteresse und die Verweildauer positiv beeinflussen, jedoch auf unterschiedliche Weise. VR und AR eignen sich besonders für immersive, emotionale Erlebnisse, während Audio-Guides durch Zugänglichkeit, Orientierung und inhaltliche Tiefe überzeugen. Die Wirksamkeit interaktiver Technologien hängt stark vom Ausstellungskonzept ab, weshalb eine gezielte Kombination beider Ansätze sinnvoll ist.",
    cells: [
      [6,7],[7,7],[8,7],[9,7],[10,7],
      [6,8],[7,8],[8,8],[9,8],[10,8],
      [6,9],[7,9],[8,9],[9,9],[10,9]
    ]
  }
};

const roomLookup = {};

for (const key in rooms) {
  for (const [x, y] of rooms[key].cells) {
    roomLookup[`${x},${y}`] = rooms[key];
  }
}


/* -------------------------
   HILFSFUNKTIONEN
-------------------------- */
function getRoomByCell(x, y) {
  return roomLookup[`${x},${y}`] || null;
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
      updateRoomByPlayerPosition(); // 🔊 NEU
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
      if (val !== 0) return;

      const r = getRoomByCell(x, y);

      if (r) {
        roomInfo.innerHTML = `
          <strong>Raum:</strong> ${r.name}<br>
          <strong>Info:</strong> ${r.info}
        `;

        currentSpeechText = `${r.name}. ${r.info}`;
        speakBtn.style.display = "block";
      } else {
        roomInfo.innerHTML = `
          <strong>Raum:</strong> Flur<br>
          <strong>Info:</strong> –
        `;

        currentSpeechText = "";
        speakBtn.style.display = "none";
      }

      const path = findPath(player.x, player.y, x, y);
      if (path) followPath(path);
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

speakBtn.addEventListener("click", () => {
  if (!currentSpeechText) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(currentSpeechText);
  utterance.lang = "de-DE";
  utterance.rate = 1;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
});

function updateRoomByPlayerPosition() {
  const r = getRoomByCell(player.x, player.y);

  if (r) {
    roomInfo.innerHTML = `
      <strong>Raum:</strong> ${r.name}<br>
      <strong>Info:</strong> ${r.info}
    `;
    currentSpeechText = `${r.name}. ${r.info}`;
    speakBtn.style.display = "block";
  } else {
    roomInfo.innerHTML = `
      <strong>Raum:</strong> Flur<br>
      <strong>Info:</strong> –
    `;
    currentSpeechText = "";
    speakBtn.style.display = "none";
  }
}

renderMap();