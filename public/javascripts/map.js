const museum = document.getElementById("museum");
const roomInfo = document.getElementById("roomInfo");
const roomName = document.getElementById("roomName");
const audioControls = document.getElementById("audioControls");

let currentSpeechText = "";
let speakBtn = null;
let utterance = null;
let isPaused = false;

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

const WALL_SIZE = 27;
const ROOM_SIZE = 27;

/* -------------------------
   RÄUME
-------------------------- */
const rooms = {
  raum1: {
    name: "Fragestellung",
    info: "Museen nutzen zunehmend interaktive digitale Technologien, um Besucher stärker einzubinden. Gleichzeitig konkurrieren sie mit digitalen Freizeitangeboten um Aufmerksamkeit. Vor diesem Hintergrund untersucht diese Arbeit, welche interaktiven Technologien im Museumskontext besonders effektiv sind, um das Interesse der Besucher zu steigern und ihre Verweildauer zu verlängern.",
    cells: [
      [1,1],[2,1],[3,1],[4,1],
      [1,2],[2,2],[3,2],[4,2],
      [1,3],[2,3],[3,3],[4,3]
    ]
  },

  raum2: {
    name: "Vorgehensweise",
    info: "Zur Beantwortung der Fragestellung wurden aktuelle wissenschaftliche Studien zu interaktiven Technologien im Museum ausgewertet. Der Fokus liegt auf immersiven VR- und AR-Technologien sowie auf Audio-Guides. Diese Technologien wurden hinsichtlich ihres Einflusses auf Besucherinteresse und Verweildauer analysiert und miteinander verglichen.",
    cells: [
      [8,1],[9,1],[10,1],
      [8,2],[9,2],[10,2],
      [8,3],[9,3],[10,3]
    ]
  },

  raum3: {
    name: "Ergebnisse",
    info: "Die Auswertung der Studien zeigt, dass beide Technologien das Besucherinteresse und die Verweildauer positiv beeinflussen. VR- und AR-Anwendungen erzeugen besonders starke immersive und emotionale Erlebnisse, die zu hoher Aufmerksamkeit und intensivem situativem Interesse führen. Audio-Guides fördern vor allem eine strukturierte, narrative und selbstgesteuerte Informationsaufnahme und unterstützen eine bewusste Auseinandersetzung mit den Inhalten.",
    cells: [
      [1,7],[2,7],[3,7],[4,7],
      [1,8],[2,8],[3,8],[4,8],
      [1,9],[2,9],[3,9],[4,9]
    ]
  },

  raum4: {
    name: "Beantwortung der Forschungsfrage",
    info: "Die Arbeit zeigt, dass keine interaktive Technologie pauschal überlegen ist. VR- und AR-Technologien sind besonders effektiv, wenn ein hohes Maß an Immersion, emotionaler Beteiligung und Aufmerksamkeit erreicht werden soll. Audio-Guides überzeugen durch Zugänglichkeit, Orientierung und inhaltliche Tiefe. Die Wirksamkeit hängt vom Ausstellungskonzept ab, weshalb eine gezielte Kombination beider Technologien das größte Potenzial zur Steigerung von Besucherinteresse und Verweildauer bietet.",
    cells: [
      [6,7],[7,7],[8,7],[9,7],[10,7],
      [6,8],[7,8],[8,8],[9,8],[10,8],
      [6,9],[7,9],[8,9],[9,9],[10,9]
    ]
  }
};

function stripHTML(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

const roomLookup = {};

for (const key in rooms) {
  for (const [x, y] of rooms[key].cells) {
    roomLookup[`${x},${y}`] = rooms[key];
  }
}


/* -------------------------
   HILFSFUNKTIONEN
-------------------------- */
function getRoomClassByCell(x, y) {
  const r = getRoomByCell(x, y);
  if (!r) return null;

  if (r.name === "Fragestellung") return "room-fragestellung";
  if (r.name === "Vorgehensweise") return "room-vorgehensweise";
  if (r.name === "Ergebnisse") return "room-ergebnisse";
  if (r.name === "Beantwortung der Forschungsfrage") return "room-beantwortung";

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
      updateRoomByPlayerPosition(); 
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

function getRoomByCell(x, y) {
  return roomLookup[`${x},${y}`] || null;
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

    const roomClass = getRoomClassByCell(x, y);
    if (roomClass) {
      cell.classList.add("room", roomClass);
    }


    if (val === 1) {
      const w = document.createElement("div");
      w.className = "wall";
      cell.appendChild(w);
    }

    cell.onclick = () => {
      if (val !== 0) return;

      const r = getRoomByCell(x, y);

      currentSpeechText = `${r.name}. ${stripHTML(r.info)}`;
      audioControls.style.display = "block"; // 🔊 HIER

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

function updateRoomByPlayerPosition() {
  const r = getRoomByCell(player.x, player.y);

  if (r) {
    roomName.textContent = r.name;          // 📍 Aktueller Raum
    roomInfo.innerHTML = r.info;            // ℹ️ Beschreibung

    currentSpeechText = `${r.name}. ${stripHTML(r.info)}`;
    audioControls.style.display = "block";
  } else {
    roomName.textContent = "Flur";
    roomInfo.textContent = "–";
    audioControls.style.display = "none";
    currentSpeechText = "";
  }
}

  document.addEventListener("DOMContentLoaded", () => {
    speakBtn = document.getElementById("speakBtn");

    if (!speakBtn) {
      console.warn("speakBtn nicht gefunden");
      return;
    }

    speakBtn.addEventListener("click", () => {
    if (!currentSpeechText) return;

    // Wenn pausiert → fortsetzen
    if (isPaused && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      isPaused = false;
      return;
    }

    // Alles andere stoppen (sehr wichtig!)
    window.speechSynthesis.cancel();

    utterance = new SpeechSynthesisUtterance(currentSpeechText);
    utterance.lang = "de-DE";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => {
      utterance = null;
      isPaused = false;
    };

    window.speechSynthesis.speak(utterance);
  });


  document.getElementById("pauseBtn").addEventListener("click", () => {
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
    isPaused = true;
  }
});

});

renderMap();