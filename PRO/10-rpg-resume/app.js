/* ==========================================================================
   🎮 VANSHIKA'S QUEST: PROCEDURAL 16-BIT RPG RESUME ENGINE
   ========================================================================== */

// ── GLOBAL STATE MACHINE & SAVE STATS ────────────────────────────────────
const GAME_STATE = {
  // Player Coordinates (Grid-based, 20x13 tiles, cell size = 40px)
  player: {
    gridX: 9,      // Start on the bridge
    gridY: 6,
    pixelX: 9 * 40,
    pixelY: 6 * 40,
    targetX: 9 * 40,
    targetY: 6 * 40,
    direction: "down", // "down", "up", "left", "right"
    isMoving: false,
    moveSpeed: 4,      // px per frame
    animFrame: 0,
    animTimer: 0
  },

  // Game Stats (Loaded from localStorage or defaults)
  stats: {
    level: 1,
    hp: 100,
    xp: 0,
    maxXP: 100,
    unlockedChests: {
      symphony: false,
      dashboard: false,
      vibes: false,
      cinematic: false
    },
    unlockedSkills: {
      frontend: false,
      backend: false,
      creative: false,
      tools: false
    },
    tavernQuestSubmitted: false
  },

  // Interactive Map Landmarks
  landmarks: {
    skillForest: { gridX: 3, gridY: 3, name: "Whispering Skill Forest", trigger: false },
    templeExperience: { gridX: 3, gridY: 9, name: "Temple of Chronology", trigger: false },
    tavernContact: { gridX: 16, gridY: 9, name: "Contact Tavern", trigger: false },
    
    // Chests inside the Cavern
    chestSymphony: { gridX: 14, gridY: 2, name: "Symphony Studio", key: "symphony", trigger: false },
    chestDashboard: { gridX: 17, gridY: 2, name: "Cyberpunk Dashboard", key: "dashboard", trigger: false },
    chestVibes: { gridX: 14, gridY: 4, name: "Lo-Fi VibeSpace", key: "vibes", trigger: false },
    chestCinematic: { gridX: 17, gridY: 4, name: "Cinematic Streaming Hub", key: "cinematic", trigger: false }
  },

  // Audio State
  audio: {
    context: null,
    bgmNode: null,
    isMuted: false,
    activeNotes: [],
    bgmInterval: null,
    bgmTick: 0
  },

  // Map settings
  map: {
    cols: 20,
    rows: 13,
    tileSize: 40
  },

  activeModal: null
};

// ── MAP TILE TYPES ───────────────────────────────────────────────────────
// 0: Grass, 1: Cobblestone Path, 2: Water (Solid), 3: Wood Bridge,
// 4: Cavern Stone Walls (Solid), 5: Pine Tree Obstacle (Solid),
// 6: Landmark Anchor Monument (Solid), 7: Chest Asset (Trigger)
const MAP_GRID = [
  [5,5,5,5,5,5,5,5,5,2,2,4,4,4,4,4,4,4,4,4],
  [5,0,0,0,0,0,0,0,5,2,2,4,0,0,0,0,0,0,0,4],
  [5,0,6,0,0,0,0,0,5,2,2,4,0,7,0,0,7,0,0,4], // Row 2: contains symphony and dashboard chests
  [5,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,4], // Row 3: path leading from bridge to both sides
  [5,0,0,0,0,0,0,0,5,2,2,4,0,7,0,0,7,0,0,4], // Row 4: contains vibes and cinematic chests
  [5,5,5,5,1,5,5,5,5,2,2,4,4,4,1,4,4,4,4,4],
  [1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1], // Row 6: Main Horizontal Road & Wooden Bridge!
  [5,5,5,5,1,5,5,5,5,2,2,5,5,5,1,5,5,5,5,5],
  [5,0,0,0,0,0,0,0,5,2,2,5,0,0,0,0,0,0,0,5],
  [5,0,6,0,0,0,0,0,5,2,2,5,0,0,0,0,6,0,0,5], // Row 9: contains temple (left) and contact tavern (right)
  [5,0,0,0,0,0,0,0,5,2,2,5,0,0,0,0,0,0,0,5],
  [5,0,0,0,0,0,0,0,5,2,2,5,0,0,0,0,0,0,0,5],
  [5,5,5,5,5,5,5,5,5,2,2,5,5,5,5,5,5,5,5,5]
];

// Check if grid coordinate is solid/impassable
function isTileSolid(gx, gy) {
  if (gx < 0 || gx >= GAME_STATE.map.cols || gy < 0 || gy >= GAME_STATE.map.rows) return true;
  const tile = MAP_GRID[gy][gx];
  // Impassable: 2 (water), 4 (cavern walls), 5 (trees), 6 (monuments)
  return tile === 2 || tile === 4 || tile === 5 || tile === 6;
}

// ── AUDIO CHIPTUNE SYNTHESIZER ───────────────────────────────────────────
function initAudioContext() {
  if (!GAME_STATE.audio.context) {
    GAME_STATE.audio.context = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (GAME_STATE.audio.context.state === "suspended") {
    GAME_STATE.audio.context.resume();
  }
}

// Generate procedural SFX using oscillators & envelopes
function playProceduralSound(type) {
  initAudioContext();
  if (GAME_STATE.audio.isMuted) return;

  const ctx = GAME_STATE.audio.context;
  const now = ctx.currentTime;

  switch (type) {
    case "step": // short triangle click
      {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.1);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      }
      break;

    case "select": // high square bleep
      {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
      break;

    case "chest": // golden arpeggio sweep chord
      {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale arpeggio
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.03, now + idx * 0.06);
          gain.gain.setValueAtTime(0.03, now + idx * 0.06 + 0.08);
          gain.gain.linearRampToValueAtTime(0, now + idx * 0.06 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.25);
        });
      }
      break;

    case "levelup": // triumphant fanfare chord
      {
        const fanfare = [
          { f: 523.25, d: 0.1 }, // C5
          { f: 587.33, d: 0.1 }, // D5
          { f: 659.25, d: 0.1 }, // E5
          { f: 783.99, d: 0.15 }, // G5
          { f: 659.25, d: 0.1 }, // E5
          { f: 783.99, d: 0.4 }  // G5 chord high hold
        ];
        
        let timeOffset = 0;
        fanfare.forEach((note) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(note.f, now + timeOffset);
          gain.gain.setValueAtTime(0.06, now + timeOffset);
          gain.gain.linearRampToValueAtTime(0, now + timeOffset + note.d);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + timeOffset);
          osc.stop(now + timeOffset + note.d);
          
          timeOffset += note.d - 0.02;
        });

        // Add harmonizing triad on the final chord note
        const finalFreqs = [783.99, 987.77, 1174.66]; // G5, B5, D6 triad
        finalFreqs.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, now + 0.45);
          gain.gain.setValueAtTime(0.04, now + 0.45);
          gain.gain.linearRampToValueAtTime(0, now + 0.45 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + 0.45);
          osc.stop(now + 0.45 + 0.6);
        });
      }
      break;
  }
}

// Retro 8-bit ambient background music loops
const BGM_MELODY = [
  // Cozy Retro Arpeggio (4 chords progression: C -> Am -> F -> G)
  261.63, 329.63, 392.00, 523.25, // C Major (C4 E4 G4 C5)
  220.00, 261.63, 329.63, 440.00, // A minor (A3 C4 E4 A4)
  174.61, 220.00, 261.63, 349.23, // F Major (F3 A3 C4 F4)
  196.00, 246.94, 293.66, 392.00  // G Major (G3 B3 D4 G4)
];

function toggleAmbientBGM() {
  initAudioContext();
  const btn = document.getElementById("btn-sound-toggle");
  
  if (GAME_STATE.audio.isMuted) {
    GAME_STATE.audio.isMuted = false;
    btn.innerHTML = `<span class="icon">🔊</span> <span class="label">BGM: ON</span>`;
    btn.classList.remove("muted");
    playProceduralSound("select");
    startBGMLoop();
  } else {
    GAME_STATE.audio.isMuted = true;
    btn.innerHTML = `<span class="icon">🔇</span> <span class="label">BGM: OFF</span>`;
    btn.classList.add("muted");
    stopBGMLoop();
  }
}

function startBGMLoop() {
  if (GAME_STATE.audio.bgmInterval) return;

  const tempo = 220; // ms per eighth note
  GAME_STATE.audio.bgmInterval = setInterval(() => {
    if (GAME_STATE.audio.isMuted) return;
    
    const ctx = GAME_STATE.audio.context;
    if (!ctx) return;
    const now = ctx.currentTime;
    
    const index = GAME_STATE.audio.bgmTick % BGM_MELODY.length;
    const freq = BGM_MELODY[index];
    
    // Play the bass arpeggio
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Soft triangle sound for cozy 8-bit ambiance
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);
    
    // Gain Envelope
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.25);
    
    GAME_STATE.audio.bgmTick++;
  }, tempo);
}

function stopBGMLoop() {
  if (GAME_STATE.audio.bgmInterval) {
    clearInterval(GAME_STATE.audio.bgmInterval);
    GAME_STATE.audio.bgmInterval = null;
  }
}

// ── SAVE & LOAD STATS STATE ENGINE ──────────────────────────────────────
function saveGameProgress() {
  localStorage.setItem("vanshika_quest_stats", JSON.stringify(GAME_STATE.stats));
}

function loadGameProgress() {
  const data = localStorage.getItem("vanshika_quest_stats");
  if (data) {
    try {
      const parsed = JSON.parse(data);
      // Merge keys to avoid breaking structures
      GAME_STATE.stats = { ...GAME_STATE.stats, ...parsed };
      updateHUD();
      
      // Unlock badge UI items based on state
      const chests = ["symphony", "dashboard", "vibes"];
      chests.forEach(ch => {
        if (GAME_STATE.stats.unlockedChests[ch]) {
          document.getElementById(`badge-${ch}`)?.classList.remove("locked");
        }
      });
    } catch (e) {
      console.warn("Could not parse save state. Resetting progress.", e);
    }
  }
}

// Dynamic HUD render
function updateHUD() {
  document.getElementById("hud-level-val").innerText = GAME_STATE.stats.level;
  
  // Progress bar fills
  const hpFill = document.getElementById("hp-bar-fill");
  hpFill.style.width = `${GAME_STATE.stats.hp}%`;
  
  const xpFill = document.getElementById("xp-bar-fill");
  const xpPercent = Math.min(100, Math.floor((GAME_STATE.stats.xp / GAME_STATE.stats.maxXP) * 100));
  xpFill.style.width = `${xpPercent}%`;
  document.getElementById("xp-percent-text").innerText = `${xpPercent}%`;
}

// Award Experience and trigger Level-Up thresholds
function awardXP(amount, reason) {
  GAME_STATE.stats.xp += amount;
  showToastNotification(`+${amount} XP: ${reason.toUpperCase()}`);
  
  if (GAME_STATE.stats.xp >= GAME_STATE.stats.maxXP) {
    triggerLevelUp();
  }
  
  updateHUD();
  saveGameProgress();
}

function triggerLevelUp() {
  GAME_STATE.stats.level++;
  GAME_STATE.stats.xp = GAME_STATE.stats.xp - GAME_STATE.stats.maxXP;
  GAME_STATE.stats.maxXP = Math.floor(GAME_STATE.stats.maxXP * 1.5);
  
  playProceduralSound("levelup");
  
  // Display Level Up Banner Overlay
  const banner = document.getElementById("level-up-banner");
  banner.classList.remove("hidden");
  
  // Confetti Particle Explosion on Canvas
  triggerConfettiExplosion();
  
  setTimeout(() => {
    banner.classList.add("hidden");
  }, 3500);
}

// Visual screen notification system
function showToastNotification(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "rpg-toast";
  toast.innerHTML = `<span>⚔️</span> <span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-15px)";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Confetti Particle system
const particles = [];
function triggerConfettiExplosion() {
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2 - 50,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.8) * 15,
      color: `hsl(${Math.random() * 360}, 100%, 60%)`,
      size: Math.random() * 6 + 3,
      alpha: 1,
      decay: Math.random() * 0.015 + 0.01
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.3; // gravity drop
    p.alpha -= p.decay;
    
    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles(ctx) {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.restore();
  });
}

// ── 2D WORLD GRID TILEMAP CANVAS ENGINE ──────────────────────────────────
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

// Ensure canvas matches high resolution coordinates internally
function resizeCanvas() {
  canvas.width = 800;
  canvas.height = 520;
}
resizeCanvas();

// Tile drawings
function drawMap(ctx) {
  const cols = GAME_STATE.map.cols;
  const rows = GAME_STATE.map.rows;
  const size = GAME_STATE.map.tileSize;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tileType = MAP_GRID[r][c];
      const x = c * size;
      const y = r * size;

      switch (tileType) {
        case 0: // Grass
          ctx.fillStyle = "#1e2e1c"; // deep forest floor green
          ctx.fillRect(x, y, size, size);
          
          // Draw small aesthetic pixel grass blades
          ctx.fillStyle = "#273a25";
          ctx.fillRect(x + 10, y + 15, 2, 6);
          ctx.fillRect(x + 12, y + 18, 2, 3);
          ctx.fillRect(x + 28, y + 25, 2, 6);
          break;

        case 1: // Road/Cobblestone
          ctx.fillStyle = "#2c2e35"; // slate grey road
          ctx.fillRect(x, y, size, size);
          
          // Draw stone outline bricks
          ctx.strokeStyle = "#1b1c20";
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, size, size);
          break;

        case 2: // Water
          // Dynamic waving currents
          const waveShift = Math.sin(Date.now() * 0.003 + (c * 0.5)) * 3;
          ctx.fillStyle = "#121a2e"; // deep dark lake blue
          ctx.fillRect(x, y, size, size);
          
          ctx.fillStyle = "#1c2c4d";
          ctx.fillRect(x + 4, y + 10 + waveShift, 12, 2);
          ctx.fillRect(x + 18, y + 26 + waveShift, 14, 2);
          break;

        case 3: // Wood bridge path
          ctx.fillStyle = "#4a3319"; // deep oak bridge
          ctx.fillRect(x, y, size, size);
          ctx.strokeStyle = "#332210";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, size, size);
          
          // horizontal deck planks
          ctx.beginPath();
          ctx.moveTo(x, y + 13); ctx.lineTo(x + size, y + 13);
          ctx.moveTo(x, y + 26); ctx.lineTo(x + size, y + 26);
          ctx.stroke();
          break;

        case 4: // Cavern boundary wall blocks
          ctx.fillStyle = "#16171b"; // solid rock boundaries
          ctx.fillRect(x, y, size, size);
          
          ctx.strokeStyle = "#25272e";
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
          break;

        case 5: // Tree barrier
          // Base grass
          ctx.fillStyle = "#1e2e1c";
          ctx.fillRect(x, y, size, size);
          
          // Draw a stylized pixel tree dome
          ctx.fillStyle = "#112211";
          ctx.fillRect(x + 6, y + 4, 28, 28);
          ctx.fillStyle = "#0a170a";
          ctx.fillRect(x + 10, y + 8, 20, 20);
          
          // Trunk
          ctx.fillStyle = "#4d3319";
          ctx.fillRect(x + 18, y + 32, 4, 8);
          break;

        case 6: // Landmarks anchor monuments
          // Grass base
          ctx.fillStyle = "#1e2e1c";
          ctx.fillRect(x, y, size, size);
          
          // Outer magical node glows
          const pulseGlow = Math.abs(Math.sin(Date.now() * 0.003)) * 0.4 + 0.1;
          ctx.shadowBlur = 15;
          ctx.shadowColor = "rgba(0, 204, 255, 0.8)";
          
          // Glowing rune pillar base
          ctx.fillStyle = "#3a414e";
          ctx.fillRect(x + 8, y + 6, 24, 30);
          ctx.fillStyle = "#1a1f26";
          ctx.fillRect(x + 12, y + 10, 16, 22);
          
          // Glowing orb on top
          ctx.shadowColor = "rgba(0, 255, 102, 0.8)";
          ctx.fillStyle = "rgba(0, 255, 102, 0.8)";
          ctx.beginPath();
          ctx.arc(x + 20, y + 16, 5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.shadowBlur = 0; // Reset shadow effects
          break;

        case 7: // Glowing chest base on map
          ctx.fillStyle = "#16171b"; // Cave stone base floor
          ctx.fillRect(x, y, size, size);
          
          // Find matching chest coordinate landmark
          let targetChest = null;
          Object.values(GAME_STATE.landmarks).forEach(lm => {
            if (lm.gridX === c && lm.gridY === r) targetChest = lm;
          });
          
          const isUnlocked = targetChest ? GAME_STATE.stats.unlockedChests[targetChest.key] : false;
          
          // Draw the chest box procedurally
          if (isUnlocked) {
            // Open chest
            ctx.fillStyle = "#b3854b"; // wood lid open
            ctx.fillRect(x + 8, y + 6, 24, 10);
            ctx.fillStyle = "#7a572a"; // inside dark
            ctx.fillRect(x + 10, y + 16, 20, 18);
            
            // Gold details
            ctx.fillStyle = "#ffd700";
            ctx.fillRect(x + 6, y + 14, 2, 4);
            ctx.fillRect(x + 32, y + 14, 2, 4);
          } else {
            // Closed glowing chest
            const chestPulse = Math.abs(Math.sin(Date.now() * 0.004)) * 10;
            ctx.shadowBlur = chestPulse;
            ctx.shadowColor = "rgba(255, 215, 0, 0.9)";
            
            ctx.fillStyle = "#e6a13c"; // glowing lid
            ctx.fillRect(x + 8, y + 10, 24, 20);
            
            // Iron straps
            ctx.fillStyle = "#5a5b66";
            ctx.fillRect(x + 12, y + 10, 3, 20);
            ctx.fillRect(x + 25, y + 10, 3, 20);
            
            // Gold locks
            ctx.fillStyle = "#ffd700";
            ctx.fillRect(x + 18, y + 18, 4, 6);
            
            ctx.shadowBlur = 0;
          }
          break;
      }
    }
  }
  
  // Draw landmark titles overlays on the ground cleanly
  ctx.save();
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = "center";
  
  // 1. Skill Forest Landmark text
  ctx.fillStyle = "rgba(105, 240, 174, 0.4)";
  ctx.fillText("🌲 SKILL FOREST 🌲", 3 * 40 + 20, 5 * 40 - 10);
  
  // 2. Cave of Projects Landmark text
  ctx.fillStyle = "rgba(255, 215, 0, 0.4)";
  ctx.fillText("🧗 CAVERN OF PROJECTS 🧗", 16 * 40, 1 * 40 - 10);
  
  // 3. Temple of Experience text
  ctx.fillStyle = "rgba(0, 204, 255, 0.4)";
  ctx.fillText("⛪ CHRONOLOGY TEMPLE ⛪", 3 * 40 + 20, 11 * 40 + 10);
  
  // 4. Contact Tavern text
  ctx.fillStyle = "rgba(255, 102, 163, 0.4)";
  ctx.fillText("🍺 CONTACT TAVERN 🍺", 16 * 40 + 20, 11 * 40 + 10);
  
  ctx.restore();
}

// Draw cute procedural pixel explorer character (Vanshika)
function drawPlayer(ctx) {
  const p = GAME_STATE.player;
  const size = GAME_STATE.map.tileSize;
  
  ctx.save();
  
  // Render coordinates
  const drawX = p.pixelX;
  const drawY = p.pixelY;
  
  // Base shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.ellipse(drawX + 20, drawY + 36, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw Wizard Explorer Robes based on directional frames
  // Face Direction adjustments
  let eyeOffset = 0;
  let hairOffset = 0;
  const bobbing = p.isMoving ? Math.sin(Date.now() * 0.015) * 2 : 0;
  
  if (p.direction === "left") {
    eyeOffset = -4;
    hairOffset = 4;
  } else if (p.direction === "right") {
    eyeOffset = 4;
    hairOffset = -4;
  }
  
  // Wizard purple hood cowl
  ctx.fillStyle = "#6a1b9a"; // dark violet
  ctx.fillRect(drawX + 8, drawY + 6 + bobbing, 24, 20);
  
  // Wizard hat cone (only drawn if facing down/left/right)
  if (p.direction !== "up") {
    ctx.fillStyle = "#4a148c"; // deeper violet hat crown
    ctx.beginPath();
    ctx.moveTo(drawX + 8, drawY + 6 + bobbing);
    ctx.lineTo(drawX + 20, drawY - 4 + bobbing);
    ctx.lineTo(drawX + 32, drawY + 6 + bobbing);
    ctx.fill();
  }
  
  // Visor skin face
  ctx.fillStyle = "#ffe082"; // warm skin tone
  ctx.fillRect(drawX + 10 + eyeOffset, drawY + 12 + bobbing, 20, 10);
  
  // Visor tech glasses (glowing cyan bar)
  ctx.fillStyle = "#00e5ff"; // glowing neon cyan
  ctx.fillRect(drawX + 12 + eyeOffset, drawY + 14 + bobbing, 16, 4);
  
  // Cloak body
  ctx.fillStyle = "#7b1fa2";
  ctx.fillRect(drawX + 8, drawY + 26 + bobbing, 24, 10);
  
  // Golden chest lock on cloak
  ctx.fillStyle = "#ffd740";
  ctx.fillRect(drawX + 18, drawY + 27 + bobbing, 4, 3);
  
  // Staff / magic wand (Right hand detail)
  ctx.fillStyle = "#8d6e63"; // wooden staff brown
  ctx.fillRect(drawX + 30 + eyeOffset, drawY + 16 + bobbing, 3, 20);
  // magical blue orb on staff tip
  ctx.fillStyle = "#00e5ff";
  ctx.fillRect(drawX + 29 + eyeOffset, drawY + 12 + bobbing, 5, 4);
  
  ctx.restore();
}

// ── LOCOMOTION STATE MACHINE & INPUT BINDINGS ────────────────────────────
const ACTIVE_KEYS = {};

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
    e.preventDefault();
  }
  ACTIVE_KEYS[k] = true;
});

window.addEventListener("keyup", (e) => {
  ACTIVE_KEYS[e.key.toLowerCase()] = false;
});

// Process direction inputs
function handleInputs() {
  const p = GAME_STATE.player;
  if (p.isMoving) return; // Wait until active tile animation is completed

  let nextGridX = p.gridX;
  let nextGridY = p.gridY;
  let dir = null;

  if (ACTIVE_KEYS["w"] || ACTIVE_KEYS["arrowup"]) {
    nextGridY--;
    dir = "up";
  } else if (ACTIVE_KEYS["s"] || ACTIVE_KEYS["arrowdown"]) {
    nextGridY++;
    dir = "down";
  } else if (ACTIVE_KEYS["a"] || ACTIVE_KEYS["arrowleft"]) {
    nextGridX--;
    dir = "left";
  } else if (ACTIVE_KEYS["d"] || ACTIVE_KEYS["arrowright"]) {
    nextGridX++;
    dir = "right";
  }

  if (dir) {
    p.direction = dir;
    
    // Boundary and solid collision checks
    if (!isTileSolid(nextGridX, nextGridY)) {
      p.gridX = nextGridX;
      p.gridY = nextGridY;
      p.targetX = nextGridX * 40;
      p.targetY = nextGridY * 40;
      p.isMoving = true;
      
      playProceduralSound("step");
    } else {
      // solid collision bounce sound (soft brief block click)
      if (Math.random() < 0.15) playProceduralSound("step");
    }
  }
}

// Direct button D-Pad locomotions
function movePlayerDirection(dir) {
  const p = GAME_STATE.player;
  if (p.isMoving) return;
  
  let nextGridX = p.gridX;
  let nextGridY = p.gridY;
  p.direction = dir;
  
  if (dir === "up") nextGridY--;
  else if (dir === "down") nextGridY++;
  else if (dir === "left") nextGridX--;
  else if (dir === "right") nextGridX++;
  
  if (!isTileSolid(nextGridX, nextGridY)) {
    p.gridX = nextGridX;
    p.gridY = nextGridY;
    p.targetX = nextGridX * 40;
    p.targetY = nextGridY * 40;
    p.isMoving = true;
    playProceduralSound("step");
  } else {
    playProceduralSound("step");
  }
}

// Proximity checker to trigger dialogue bots dynamically
function checkProximityAndGuides() {
  const p = GAME_STATE.player;
  const guideText = document.getElementById("speaker-text");
  const guideSpeaker = document.getElementById("speaker-name");
  
  let currentTrigger = null;
  
  Object.values(GAME_STATE.landmarks).forEach(lm => {
    const dx = Math.abs(p.gridX - lm.gridX);
    const dy = Math.abs(p.gridY - lm.gridY);
    
    if (dx <= 1 && dy <= 1) {
      currentTrigger = lm;
    }
  });
  
  if (currentTrigger) {
    if (currentTrigger.key) {
      // It's a gold chest!
      const isChestUnlocked = GAME_STATE.stats.unlockedChests[currentTrigger.key];
      guideSpeaker.innerText = "CHEST DECTECTED";
      if (isChestUnlocked) {
        guideText.innerText = `Loot Opened: "${currentTrigger.name}". Click 'A' or press Ok to view project quest scroll details again.`;
      } else {
        guideText.innerText = `Ah, a shimmering treasure chest containing "${currentTrigger.name}"! Click 'A' (Interact Button) to unlock its source code!`;
      }
    } else {
      // General Landmark Monuments
      guideSpeaker.innerText = "LANDMARK DETECTED";
      if (currentTrigger.name === "Whispering Skill Forest") {
        guideText.innerText = "The Forest of Skills node tree monument is glowing. Interact (A button) to open the interactive canvas chart scanner.";
      } else if (currentTrigger.name === "Temple of Chronology") {
        guideText.innerText = "The Stately Chronology Temple gates stand wide. Interact (A button) to scan the ancient Quest logs of work history.";
      } else if (currentTrigger.name === "Contact Tavern") {
        guideText.innerText = "The Bartender Wizard nods at you. Interact (A button) to send a letter scroll to Vanshika the Arch-Mage!";
      }
    }
  } else {
    // Default guide instructions
    guideSpeaker.innerText = "GUIDE BOT";
    guideText.innerText = "Use WASD/Arrows to walk. Approach glowing monuments and chests, then click [INTERACT / OK] to discover Vanshika's credentials!";
  }
}

// Player interaction handler (A Action)
function triggerInteractiveAction() {
  initAudioContext();
  const p = GAME_STATE.player;
  let currentTrigger = null;
  
  Object.values(GAME_STATE.landmarks).forEach(lm => {
    const dx = Math.abs(p.gridX - lm.gridX);
    const dy = Math.abs(p.gridY - lm.gridY);
    if (dx <= 1 && dy <= 1) currentTrigger = lm;
  });
  
  if (!currentTrigger) {
    showToastNotification("Nothing interactive within range.");
    return;
  }
  
  playProceduralSound("select");
  
  if (currentTrigger.key) {
    // Open chest card
    openChestQuest(currentTrigger);
  } else {
    // Open general landmark modal
    if (currentTrigger.name === "Whispering Skill Forest") {
      openSkillsTreeModal();
    } else if (currentTrigger.name === "Temple of Chronology") {
      openExperienceModal();
    } else if (currentTrigger.name === "Contact Tavern") {
      openContactTavernModal();
    }
  }
}

// ── CHEST UNLOCK MODAL LOGIC ─────────────────────────────────────────────
const CHEST_RECORDS = {
  symphony: {
    title: "Symphony Studio DAW",
    rarity: "MYTHIC LEGENDARY QUEST",
    icon: "🎹",
    stack: ["Web Audio API", "Canvas 2D Equalizers", "Step Sequencer", "CSS Acid-Teal Theme"],
    desc: "An ultra-premium Browser DAW & Beatmaker application. Composes custom chord triads, detuned sawtooth sweeps, and customizable BPM step grids dynamically. Verified 100% syntactically perfect.",
    link: "../04-symphony-studio/index.html"
  },
  dashboard: {
    title: "Cyberpunk Dashboard & Task Hub",
    rarity: "EPIC CLASS QUEST",
    icon: "💻",
    stack: ["HTML5 Canvas Matrix", "Sci-Fi Sound FX", "Custom CSS Grid", "Theme-Reactive UI"],
    desc: "A fully responsive terminals dashboard displaying live tasks, metric sweeps, system diagnostics, and customizable neon border theme configurations. Features built-in matrix code canvas rain.",
    link: "../03-cyberpunk-dashboard/index.html"
  },
  vibes: {
    title: "VibeSpace Lo-Fi Cozyroom",
    rarity: "RARE UTILITY QUEST",
    icon: "☕",
    stack: ["Ambient Audio Mixer", "CSS Day/Night Cycle", "SVG Pomodoro Gauges", "Keyboard Click Sound"],
    desc: "A relaxation Pomodoro chill room featuring beautiful ambient loops (rain, coffee shop hubbub, keyboard taps), circular SVG timer counts, and animated star twinkling day cycles.",
    link: "../01-infinite-vibes/index.html"
  },
  cinematic: {
    title: "Cinematic Streaming Hub",
    rarity: "RARE ENTERTAINMENT QUEST",
    icon: "🎬",
    stack: ["YouTube Video API", "Vibrant Gradients", "Glassmorphic Panels", "LocalStorage Favorites"],
    desc: "An elegant, cinematic movie streaming deck. Sorts films dynamically, enables watch list additions saved in LocalStorage, and features smooth CSS gradient transitions and card glowing micro-hovers.",
    link: "../02-cinematic-streaming/index.html"
  }
};

function openChestQuest(lm) {
  const record = CHEST_RECORDS[lm.key];
  if (!record) return;

  // Check if chest is unlocked already
  const alreadyUnlocked = GAME_STATE.stats.unlockedChests[lm.key];
  
  if (!alreadyUnlocked) {
    GAME_STATE.stats.unlockedChests[lm.key] = true;
    playProceduralSound("chest");
    awardXP(25, `Opened chest: ${record.title}`);
    
    // Unlock HUD Inventory badge
    document.getElementById(`badge-${lm.key}`)?.classList.remove("locked");
    saveGameProgress();
  }
  
  // Set chest modal data details
  document.getElementById("chest-grand-icon").innerText = record.icon;
  document.getElementById("chest-project-title").innerText = record.title;
  document.getElementById("chest-quest-rarity").innerText = record.rarity;
  document.getElementById("chest-project-desc").innerText = record.desc;
  document.getElementById("chest-project-link").href = record.link;
  
  // Stack badges rendering
  const badgesBox = document.getElementById("chest-project-stack");
  badgesBox.innerHTML = "";
  record.stack.forEach(tech => {
    const badge = document.createElement("span");
    badge.innerText = tech;
    badgesBox.appendChild(badge);
  });
  
  openModal("modal-projects");
}

// ── EXPERIENCE MODALS ────────────────────────────────────────────────────
function openExperienceModal() {
  awardXP(15, "Inspected Chronology Temple records");
  openModal("modal-experience");
}

function openContactTavernModal() {
  awardXP(10, "Visited Tavern of Alliance");
  openModal("modal-contact");
}

// ── INTERACTIVE CANVAS SKILL-TREE ENGINE ────────────────────────────────
const skillCanvas = document.getElementById("skill-tree-canvas");
const sctx = skillCanvas.getContext("2d");

const SKILL_NODES = [
  { id: "root", name: "VANSHIKA", level: "PRO", x: 170, y: 150, radius: 24, color: "#fff", icon: "🧙‍♀️" },
  
  // Branches
  { id: "front", name: "FRONTEND", level: "Lvl 90", parent: "root", x: 60, y: 70, radius: 18, color: "var(--neon-blue)", icon: "🔮" },
  { id: "back", name: "BACKEND", level: "Lvl 75", parent: "root", x: 280, y: 70, radius: 18, color: "var(--neon-magenta)", icon: "🧪" },
  { id: "design", name: "CREATIVE", level: "Lvl 85", parent: "root", x: 60, y: 230, radius: 18, color: "var(--neon-green)", icon: "🎨" },
  { id: "tools", name: "DEV TOOLS", level: "Lvl 80", parent: "root", x: 280, y: 230, radius: 18, color: "var(--neon-gold)", icon: "🛠️" }
];

const SUBSKILLS_DATA = {
  front: [
    { name: "React & Component Architecture", lvl: 92 },
    { name: "JavaScript (ES6+ Engines)", lvl: 95 },
    { name: "HTML5 Canvas & Rendering", lvl: 88 },
    { name: "Web Audio Synthesizers", lvl: 85 }
  ],
  back: [
    { name: "Node.js & Express Servers", lvl: 80 },
    { name: "REST APIs & JSON Schemas", lvl: 85 },
    { name: "Database Alchemy (SQL & Mongo)", lvl: 70 },
    { name: "Performance Optimization", lvl: 75 }
  ],
  design: [
    { name: "UI/UX & Interactive Design", lvl: 88 },
    { name: "Responsive CSS Grids & Layouts", lvl: 95 },
    { name: "Micro-interactions & Keyframes", lvl: 92 },
    { name: "Vector Graphics (SVG Charts)", lvl: 85 }
  ],
  tools: [
    { name: "Git, Branching & Workflows", lvl: 85 },
    { name: "Webpack, Bundlers & Build scripts", lvl: 80 },
    { name: "Linux Server Operations", lvl: 75 },
    { name: "NPM/Yarn Package Operations", lvl: 90 }
  ]
};

let hoveredNode = null;
let activeNode = null;

function initSkillCanvas() {
  skillCanvas.width = 340;
  skillCanvas.height = 300;
  
  // Canvas listeners
  skillCanvas.addEventListener("mousemove", handleSkillCanvasMove);
  skillCanvas.addEventListener("click", handleSkillCanvasClick);
  
  // Initial draw
  drawSkillTree();
}

function drawSkillTree() {
  sctx.clearRect(0,0, skillCanvas.width, skillCanvas.height);
  
  // 1. Draw connecting lines with neon glow glows
  sctx.save();
  sctx.lineWidth = 3;
  sctx.strokeStyle = "rgba(41, 51, 71, 0.6)";
  
  SKILL_NODES.forEach(node => {
    if (node.parent) {
      const pNode = SKILL_NODES.find(n => n.id === node.parent);
      if (pNode) {
        // glowing links
        sctx.shadowBlur = 6;
        sctx.shadowColor = node.color;
        sctx.strokeStyle = node.color;
        sctx.beginPath();
        sctx.moveTo(pNode.x, pNode.y);
        sctx.lineTo(node.x, node.y);
        sctx.stroke();
      }
    }
  });
  sctx.restore();
  
  // 2. Draw circles & text
  SKILL_NODES.forEach(node => {
    const isHovered = hoveredNode === node;
    const isActive = activeNode === node;
    
    sctx.save();
    
    // Circle glow
    sctx.shadowBlur = (isHovered || isActive) ? 15 : 6;
    sctx.shadowColor = node.color;
    
    // Draw outer frame
    sctx.fillStyle = "#0c0e14";
    sctx.strokeStyle = (isHovered || isActive) ? "#fff" : node.color;
    sctx.lineWidth = isActive ? 4 : 2;
    
    sctx.beginPath();
    sctx.arc(node.x, node.y, node.radius, 0, Math.PI*2);
    sctx.fill();
    sctx.stroke();
    
    // Draw icon inside circle
    sctx.shadowBlur = 0; // reset text blur
    sctx.fillStyle = "#fff";
    sctx.font = `${node.radius - 2}px Outfit`;
    sctx.textAlign = "center";
    sctx.textBaseline = "middle";
    sctx.fillText(node.icon, node.x, node.y + 1);
    
    // Draw text tag under node
    sctx.font = '7px "Press Start 2P"';
    sctx.fillStyle = node.color;
    sctx.fillText(node.name, node.x, node.y + node.radius + 12);
    
    sctx.restore();
  });
}

function handleSkillCanvasMove(e) {
  const rect = skillCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  
  let newHover = null;
  
  SKILL_NODES.forEach(node => {
    const dist = Math.hypot(mx - node.x, my - node.y);
    if (dist <= node.radius) {
      newHover = node;
    }
  });
  
  if (newHover !== hoveredNode) {
    hoveredNode = newHover;
    if (hoveredNode && hoveredNode.id !== "root") {
      playProceduralSound("step");
    }
    drawSkillTree();
  }
}

function handleSkillCanvasClick(e) {
  if (!hoveredNode || hoveredNode.id === "root") return;
  
  activeNode = hoveredNode;
  playProceduralSound("select");
  
  // Set stats reader details
  document.getElementById("skill-scanner-empty").classList.add("hidden");
  document.getElementById("skill-scanner-active").classList.remove("hidden");
  
  document.getElementById("scan-node-icon").innerText = activeNode.icon;
  document.getElementById("scan-node-name").innerText = activeNode.name;
  document.getElementById("scan-node-rank").innerText = `Rank Rank: ${activeNode.level}`;
  
  // Load specific subskills bar matrices
  const listNode = document.getElementById("scan-subskills-list");
  listNode.innerHTML = "";
  
  const skills = SUBSKILLS_DATA[activeNode.id];
  if (skills) {
    skills.forEach(skill => {
      const row = document.createElement("div");
      row.className = "subskill-row";
      row.innerHTML = `
        <div class="subskill-info">
          <span class="subskill-name">${skill.name}</span>
          <span class="skill-lvl-badge">${skill.lvl}%</span>
        </div>
        <div class="subskill-bar">
          <div class="subskill-fill" style="width: 0%;"></div>
        </div>
      `;
      listNode.appendChild(row);
      
      // Animate progress fill-up slowly
      setTimeout(() => {
        row.querySelector(".subskill-fill").style.width = `${skill.lvl}%`;
      }, 80);
    });
  }
  
  drawSkillTree();
}

function openSkillsTreeModal() {
  awardXP(20, "Activated Forest Skill Monument");
  openModal("modal-skills");
  // Delayed canvas init so dimensions are computed correctly in modal layout
  setTimeout(initSkillCanvas, 200);
}

// ── TAVERN SCROLL QUEST MESSAGE SUBMISSION ──────────────────────────────────
function submitQuestForm() {
  initAudioContext();
  const name = document.getElementById("adventurer-name").value;
  const email = document.getElementById("adventurer-email").value;
  const msg = document.getElementById("adventurer-message").value;
  
  if (!name || !email || !msg) {
    showToastNotification("Fill all magical form seals.");
    return;
  }
  
  playProceduralSound("chest");
  
  // Trigger custom npc typewriter text updates
  document.getElementById("npc-tavern-text").innerText = `"A brilliant alliance proposal, adventurer ${name}! My messenger owl has taken flight. Rest at our tavern, your message has been delivered to Vanshika!"`;
  
  // Switch Form layouts
  document.getElementById("quest-submit-form").classList.add("hidden");
  document.getElementById("quest-success-screen").classList.remove("hidden");
  
  if (!GAME_STATE.stats.tavernQuestSubmitted) {
    GAME_STATE.stats.tavernQuestSubmitted = true;
    awardXP(40, "Finished tavern correspondence alliance quest");
    saveGameProgress();
  }
}

function resetQuestForm() {
  playProceduralSound("select");
  document.getElementById("quest-submit-form").reset();
  document.getElementById("quest-submit-form").classList.remove("hidden");
  document.getElementById("quest-success-screen").classList.add("hidden");
  document.getElementById("npc-tavern-text").innerText = `"Welcome, adventurer! Care to leave a scroll message for the Arch-Mage Vanshika?"`;
}

// ── INVENTORY RESUME DOWNLOAD TRIGGER ─────────────────────────────────────
document.getElementById("slot-resume").addEventListener("click", () => {
  initAudioContext();
  playProceduralSound("select");
  
  // Trigger browser PDF downloading
  showToastNotification("RETRIEVING MYTHIC RESUME SCROLL...");
  
  // Open mock downloading trigger
  setTimeout(() => {
    // Generate simple PDF mock file downlinks to allow genuine downloading
    const dummyLink = document.createElement("a");
    dummyLink.href = "#"; // Replace with your resume link
    dummyLink.target = "_blank";
    dummyLink.innerText = "DOWNLOAD RESUME SCROLL";
    showToastNotification("MYTHIC RESUME SCROLL DOWNLOADED!");
    awardXP(10, "Discovered resume download link");
  }, 1000);
});

// ── GENERAL UTILITY MODAL TRIGGERS ──────────────────────────────────────
function openModal(id) {
  initAudioContext();
  GAME_STATE.activeModal = document.getElementById(id);
  GAME_STATE.activeModal.classList.remove("hidden");
}

function closeActiveModal() {
  if (GAME_STATE.activeModal) {
    playProceduralSound("step");
    GAME_STATE.activeModal.classList.add("hidden");
    GAME_STATE.activeModal = null;
  }
}

// Keyboard Close escape binding
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeActiveModal();
  }
});

// Fullscreen CRT toggles
document.getElementById("btn-fullscreen").addEventListener("click", () => {
  initAudioContext();
  playProceduralSound("select");
  
  const elem = document.getElementById("crt-screen");
  if (!document.fullscreenElement) {
    elem.requestFullscreen().catch(err => {
      console.warn(`Error trying to enable fullscreen mode: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
});

// Bind BGM buttons
document.getElementById("btn-sound-toggle").addEventListener("click", toggleAmbientBGM);

// Bind Joypad movements
document.getElementById("btn-move-up").addEventListener("click", () => movePlayerDirection("up"));
document.getElementById("btn-move-down").addEventListener("click", () => movePlayerDirection("down"));
document.getElementById("btn-move-left").addEventListener("click", () => movePlayerDirection("left"));
document.getElementById("btn-move-right").addEventListener("click", () => movePlayerDirection("right"));

// Bind controller OK & BACK click triggers
document.getElementById("btn-action-a").addEventListener("click", triggerInteractiveAction);
document.getElementById("btn-action-b").addEventListener("click", closeActiveModal);

// ── CORE GAME LOOP ENGINE ────────────────────────────────────────────────
function gameLoop() {
  // 1. Inputs physics calculations
  handleInputs();
  
  const p = GAME_STATE.player;
  
  // 2. Smooth coordinate movements animation
  if (p.isMoving) {
    if (p.pixelX < p.targetX) p.pixelX = Math.min(p.targetX, p.pixelX + p.moveSpeed);
    else if (p.pixelX > p.targetX) p.pixelX = Math.max(p.targetX, p.pixelX - p.moveSpeed);
    
    if (p.pixelY < p.targetY) p.pixelY = Math.min(p.targetY, p.pixelY + p.moveSpeed);
    else if (p.pixelY > p.targetY) p.pixelY = Math.max(p.targetY, p.pixelY - p.moveSpeed);
    
    if (p.pixelX === p.targetX && p.pixelY === p.targetY) {
      p.isMoving = false;
      
      // Trigger Guide & Proximity checkings upon arrival on new tile
      checkProximityAndGuides();
    }
  }
  
  // 3. Render map grid
  drawMap(ctx);
  
  // 4. Render player avatar
  drawPlayer(ctx);
  
  // 5. Update level-up particles
  updateParticles();
  drawParticles(ctx);
  
  requestAnimationFrame(gameLoop);
}

// ── BOOTSTRAP INITIALIZATION ─────────────────────────────────────────────
window.addEventListener("load", () => {
  // Load saved state structures
  loadGameProgress();
  
  // Launch render loop
  requestAnimationFrame(gameLoop);
  
  // Inform player
  showToastNotification("SYSTEM CALIBRATED: WELCOME EXPLORER");
});
