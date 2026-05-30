/* ==========================================================================
   💻 CYBERPUNK HUD: CORE SYSTEM ENGINE & WEB AUDIO SYNTHESIZER
   ========================================================================== */

// ── SYSTEM CONFIGURATION & INITIAL STATE ──────────────────────────────────
const CONFIG = {
  theme: "cyan-magenta",
  canvasMode: "neural", // "neural" or "matrix"
  soundActive: false
};

let currentUptimeSeconds = 0;
let systemTasks = [];
let activeTheme = "cyan-magenta";
let currentCanvasMode = "neural";

// Web Audio API Synth States
let audioCtx = null;
let ambientOscillators = [];
let ambientGains = [];
let ambientFilter = null;

// Canvas Particles Setup
const canvas = document.getElementById("cyber-canvas");
const ctx = canvas.getContext("2d");
let mouse = { x: null, y: null, radius: 140 };
let particles = [];
let matrixColumns = [];
const matrixCharSet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@&%*=+-_";

// Mock Security Log Entries
const LOG_MESSAGES = [
  { text: "INBOUND SECURE TUNNEL CONNECTED [ip: 108.43.2.190]", type: "alert" },
  { text: "FIREWALL REGULATED PORT 8080 TRAFFIC SHIELDED", type: "stable" },
  { text: "PORT SCAN ATTEMPT BLOCKED [origin: 198.12.87.5]", type: "warning" },
  { text: "QUANTUM DECRYPT BLOCK COMPLETED SUCCESSFULLY", type: "stable" },
  { text: "CORE HEAP COMPRESSION COMPLETE: 420MB PURGED", type: "alert" },
  { text: "INTELLIGENT SUBNET NODE OVERFLOW DETECTED: AUTO-REBALANCED", type: "warning" }
];

// ── DOM ELEMENTS BINDINGS ────────────────────────────────────────────────
const digitalClock = document.getElementById("digital-clock");
const uptimeCounter = document.getElementById("uptime-counter");
const btnToggleCanvas = document.getElementById("btn-toggle-canvas");
const canvasModeLabel = document.getElementById("canvas-mode-label");
const btnToggleAmbient = document.getElementById("btn-toggle-ambient");
const soundModeLabel = document.getElementById("sound-mode-label");
const themeDots = document.querySelectorAll(".theme-dot");

// Diagnostics Widgets
const tempWidget = document.getElementById("temp-widget");
const valCoreTemp = document.getElementById("val-core-temp");
const fillCoreTemp = document.getElementById("fill-core-temp");
const valPing = document.getElementById("val-ping");
const fillPing = document.getElementById("fill-ping");
const valCpu = document.getElementById("val-cpu");
const fillCpu = document.getElementById("fill-cpu");
const valRam = document.getElementById("val-ram");
const fillRam = document.getElementById("fill-ram");
const tickerScroller = document.getElementById("ticker-scroller");

// Core Terminal Elements
const terminalScroller = document.getElementById("terminal-scroller");
const terminalOutput = document.getElementById("terminal-output");
const terminalForm = document.getElementById("terminal-form");
const terminalInput = document.getElementById("terminal-input");

// Task Vault Elements
const taskListScroller = document.getElementById("task-list-scroller");
const emptyTaskPrompt = document.getElementById("empty-task-prompt");
const taskAddForm = document.getElementById("task-add-form");
const taskTitleInput = document.getElementById("task-title-input");
const taskCategorySelect = document.getElementById("task-category-select");
const taskPrioritySelect = document.getElementById("task-priority-select");
const taskFilters = document.querySelectorAll(".filter-tab");
const taskCompletionRate = document.getElementById("task-completion-rate");

// Live footer logger
const liveFooterLog = document.getElementById("live-footer-log");

// ── INITIALIZATION ───────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  initSystemStats();
  initCanvas();
  loadTasksFromStorage();
  setupEventListeners();
  startDiagnosticsLoop();
  startSecurityTicker();
  
  // Terminal welcome typing sound
  setTimeout(() => {
    showToastNotification("MAINFRAME INITIALIZED ⚡");
  }, 1000);
});

// ── SYSTEM TIME & UPTIME COUNTERS ────────────────────────────────────────
function initSystemStats() {
  // Update Live Digital Clock
  setInterval(() => {
    const d = new Date();
    digitalClock.textContent = d.toTimeString().split(" ")[0];
  }, 1000);

  // Update Live System Uptime
  setInterval(() => {
    currentUptimeSeconds++;
    const hrs = Math.floor(currentUptimeSeconds / 3600).toString().padStart(2, "0");
    const mins = Math.floor((currentUptimeSeconds % 3600) / 60).toString().padStart(2, "0");
    const secs = (currentUptimeSeconds % 60).toString().padStart(2, "0");
    uptimeCounter.textContent = `${hrs}:${mins}:${secs}`;
  }, 1000);
}

// ── WEB AUDIO API SYNTHESIZER ENGINE (Procedural Live Sounds) ────────────
function initAudioContext() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// Synthesize mechanical keyboard key clicks
function playKeySound() {
  if (!CONFIG.soundActive) return;
  initAudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.type = "triangle";
  // Randomise key frequency slightly for authentic keypress feedback
  const freq = 750 + Math.random() * 250;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

// Synthesize enter command sweep sound
function playEnterSound() {
  if (!CONFIG.soundActive) return;
  initAudioContext();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(400, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08);
  
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.09);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

// Synthesize successful command / task addition chime
function playSuccessSound() {
  if (!CONFIG.soundActive) return;
  initAudioContext();
  
  const t = audioCtx.currentTime;
  
  // Note 1: C5
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(523.25, t);
  gain1.gain.setValueAtTime(0.05, t);
  gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  osc1.start(t);
  osc1.stop(t + 0.16);

  // Note 2: E5 (played slightly later)
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(659.25, t + 0.08);
  gain2.gain.setValueAtTime(0.05, t + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.23);
  osc2.start(t + 0.08);
  osc2.stop(t + 0.24);
}

// Synthesize warning / delete buzzy alarm beep
function playDeleteSound() {
  if (!CONFIG.soundActive) return;
  initAudioContext();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(220, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(90, audioCtx.currentTime + 0.18);
  
  gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.22);
}

// Procedural Ambient Synthesizer Soundtrack Loop (Generates deep sci-fi cyber drone entirely in-browser)
function startAmbientDrone() {
  initAudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  
  // Set up filter sweeping
  ambientFilter = audioCtx.createBiquadFilter();
  ambientFilter.type = "lowpass";
  ambientFilter.frequency.setValueAtTime(140, audioCtx.currentTime);
  ambientFilter.connect(audioCtx.destination);
  
  const baseFreqs = [55.00, 110.00, 65.41]; // Deep root chords (A1, A2, C2)
  
  baseFreqs.forEach((freq) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    // Slow sweeping volume modulation (LFO hum simulation)
    gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
    
    osc.connect(gain);
    gain.connect(ambientFilter);
    
    osc.start();
    
    // Store nodes to modulate or destroy later
    ambientOscillators.push(osc);
    ambientGains.push(gain);
  });

  // Slow LFO-like modulation loop for filters
  let direction = 1;
  setInterval(() => {
    if (!CONFIG.soundActive || !audioCtx) return;
    const currentFreq = ambientFilter.frequency.value;
    let nextFreq = currentFreq + (10 * direction);
    
    if (nextFreq > 220) {
      direction = -1;
    } else if (nextFreq < 90) {
      direction = 1;
    }
    
    ambientFilter.frequency.exponentialRampToValueAtTime(nextFreq, audioCtx.currentTime + 0.9);
  }, 1000);
}

function stopAmbientDrone() {
  ambientOscillators.forEach(osc => {
    try { osc.stop(); } catch(e){}
  });
  ambientOscillators = [];
  ambientGains = [];
  ambientFilter = null;
}

function toggleSoundSystem() {
  CONFIG.soundActive = !CONFIG.soundActive;
  
  if (CONFIG.soundActive) {
    btnToggleAmbient.classList.add("hud-badge-btn-active");
    document.getElementById("svg-sound-off").classList.add("hidden");
    document.getElementById("svg-sound-on").classList.remove("hidden");
    soundModeLabel.textContent = "Ambient Synth: ACTIVE";
    
    startAmbientDrone();
    playSuccessSound();
    showToastNotification("AMBIENT SYNTH MODULE INITIATED 🔊");
  } else {
    btnToggleAmbient.classList.remove("hud-badge-btn-active");
    document.getElementById("svg-sound-off").classList.remove("hidden");
    document.getElementById("svg-sound-on").classList.add("hidden");
    soundModeLabel.textContent = "Ambient Synth: MUTED";
    
    stopAmbientDrone();
    showToastNotification("AMBIENT AUDIO TERMINATED 🔇");
  }
}

// ── HTML5 CANVAS PARTICLE SYSTEMS (Dual Render loop) ─────────────────────
function initCanvas() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  
  // Track user cursor position on canvas
  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  
  window.addEventListener("mouseleave", () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Start Animation render loop
  animateCanvas();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // If Matrix mode, reinitialize grid columns
  if (currentCanvasMode === "matrix") {
    initMatrixRain();
  } else {
    initNeuralParticles();
  }
}

// Mode A: Cybernetic Neural Particles Web
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.8;
    this.vy = (Math.random() - 0.5) * 0.8;
    this.baseRadius = Math.random() * 2 + 1;
    this.radius = this.baseRadius;
  }
  
  draw() {
    const neonColor = getComputedStyle(document.body).getPropertyValue("--neon-second").trim();
    ctx.fillStyle = neonColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  update() {
    // Keep in boundary walls
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Magnetic pull behavior to cursor
    if (mouse.x !== null && mouse.y !== null) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius;
        this.x -= dx * force * 0.03;
        this.y -= dy * force * 0.03;
        this.radius = this.baseRadius + force * 2;
      } else {
        this.radius = this.baseRadius;
      }
    }
  }
}

function initNeuralParticles() {
  particles = [];
  const qty = Math.min(65, Math.floor((canvas.width * canvas.height) / 18000));
  for (let i = 0; i < qty; i++) {
    particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
  }
}

function drawNeuralWeb() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Update and draw nodes
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  
  // Draw connecting threads/webs
  const neonColorRGB = getComputedStyle(document.body).getPropertyValue("--neon-accent-rgb").trim();
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < 130) {
        const alpha = (130 - dist) / 130 * 0.25;
        ctx.strokeStyle = `rgba(${neonColorRGB}, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

// Mode B: Interactive Cyber Matrix Rain
function initMatrixRain() {
  const fontSize = 14;
  const columnsQty = Math.floor(canvas.width / fontSize) + 1;
  matrixColumns = [];
  
  for (let i = 0; i < columnsQty; i++) {
    matrixColumns.push({
      x: i * fontSize,
      y: Math.random() * -canvas.height,
      speed: Math.random() * 2 + 1
    });
  }
}

function drawMatrixRain() {
  // Semi-transparent overlay clears trail paths for digital glow effect
  ctx.fillStyle = "rgba(3, 7, 18, 0.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const fontSize = 14;
  ctx.font = `${fontSize}px var(--font-code)`;
  
  const neonColor = getComputedStyle(document.body).getPropertyValue("--neon-accent").trim();
  ctx.fillStyle = neonColor;
  
  matrixColumns.forEach(col => {
    // Generate a random cyber char
    const char = matrixCharSet[Math.floor(Math.random() * matrixCharSet.length)];
    ctx.fillText(char, col.x, col.y);
    
    col.y += fontSize * 0.8 * col.speed;
    
    // Reset columns if falling past viewport
    if (col.y > canvas.height && Math.random() > 0.985) {
      col.y = Math.random() * -120;
    }
  });
}

function animateCanvas() {
  if (currentCanvasMode === "neural") {
    drawNeuralWeb();
  } else {
    drawMatrixRain();
  }
  requestAnimationFrame(animateCanvas);
}

function toggleCanvasMode() {
  currentCanvasMode = currentCanvasMode === "neural" ? "matrix" : "neural";
  canvasModeLabel.textContent = `Canvas: ${currentCanvasMode === "neural" ? "Neural Web" : "Matrix Rain"}`;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (currentCanvasMode === "neural") {
    initNeuralParticles();
  } else {
    initMatrixRain();
  }
  
  playSuccessSound();
  showToastNotification(`CANVAS GRAPHICS SWAP: ${currentCanvasMode.toUpperCase()} STAGED`);
}

// ── DIAGNOSTIC STATUS INTERACTIVE LOOP ───────────────────────────────────
function startDiagnosticsLoop() {
  setInterval(() => {
    // cpu load random shift
    const cpuVal = Math.floor(10 + Math.random() * 25);
    valCpu.textContent = `${cpuVal}%`;
    fillCpu.style.width = `${cpuVal}%`;

    // random core bar sizes
    document.getElementById("cpu-core-1").style.height = `${Math.floor(Math.random() * 90)}%`;
    document.getElementById("cpu-core-2").style.height = `${Math.floor(Math.random() * 90)}%`;
    document.getElementById("cpu-core-3").style.height = `${Math.floor(Math.random() * 90)}%`;
    document.getElementById("cpu-core-4").style.height = `${Math.floor(Math.random() * 90)}%`;

    // RAM fluctuation
    const ramGB = (3.1 + Math.random() * 0.8).toFixed(2);
    valRam.textContent = `${ramGB} GB / 16.0 GB`;
    fillRam.style.width = `${(ramGB / 16.0) * 100}%`;

    // ping speed
    const pingMS = Math.floor(18 + Math.random() * 15);
    valPing.textContent = `${pingMS} ms`;
    fillPing.style.width = `${pingMS}%`;

    // temperature fluctuation with safety alerts
    const temp = (45.2 + Math.random() * 12).toFixed(1);
    valCoreTemp.textContent = `${temp} °C`;
    fillCoreTemp.style.width = `${(temp / 100) * 100}%`;

    if (temp > 55.0) {
      tempWidget.classList.add("warning-active");
      if (Math.random() > 0.7) {
        logWarningToTerminal(`CRITICAL DETECT: CORE TEMP RISEN TO ${temp} °C - OVERCLOCK WARNING`);
      }
    } else {
      tempWidget.classList.remove("warning-active");
    }

  }, 3000);
}

// ── SEGREGATED SECURITY GATEWAY LOGS TICKER ──────────────────────────────
function startSecurityTicker() {
  tickerScroller.innerHTML = "";
  
  // Inject default rows
  LOG_MESSAGES.forEach(msg => appendSecurityRow(msg));
  
  // Generate random mock server threats
  setInterval(() => {
    const randomMsg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
    appendSecurityRow(randomMsg);
  }, 9000);
}

function appendSecurityRow(msg) {
  const row = document.createElement("div");
  row.className = `ticker-row ${msg.type}`;
  
  const time = new Date().toTimeString().split(" ")[0];
  row.textContent = `[${time}] >> ${msg.text}`;
  
  tickerScroller.appendChild(row);
  tickerScroller.scrollTop = tickerScroller.scrollHeight;
}

// ── PERSISTENT COGNITIVE NEURAL MATRIX (Tasks) ──────────────────────────
function loadTasksFromStorage() {
  const saved = localStorage.getItem("cyber_hud_tasks");
  if (saved) {
    systemTasks = JSON.parse(saved);
  } else {
    // Default high-tech tasks for premium aesthetic setup
    systemTasks = [
      { id: 1, title: "Purge subnet Trojan malware signatures", category: "sec", priority: "high", status: "in_progress" },
      { id: 2, title: "Optimize quantum mainframe core allocations", category: "sys", priority: "medium", status: "queued" },
      { id: 3, title: "Re-encrypt secure database backups [DB-04]", category: "db", priority: "high", status: "completed" },
      { id: 4, title: "Ping proxy servers for location spoof mask", category: "net", priority: "low", status: "queued" }
    ];
    saveTasksToStorage();
  }
  renderTaskVault("all");
}

function saveTasksToStorage() {
  localStorage.setItem("cyber_hud_tasks", JSON.stringify(systemTasks));
  updateCompletionRate();
}

function updateCompletionRate() {
  if (systemTasks.length === 0) {
    taskCompletionRate.textContent = "TASKS: 0%";
    return;
  }
  const completed = systemTasks.filter(t => t.status === "completed").length;
  const pct = Math.round((completed / systemTasks.length) * 100);
  taskCompletionRate.textContent = `TASKS: ${pct}%`;
}

function renderTaskVault(filterCategory = "all") {
  taskListScroller.innerHTML = "";
  
  const filtered = systemTasks.filter(t => {
    if (filterCategory === "all") return true;
    return t.category === filterCategory;
  });

  if (filtered.length === 0) {
    emptyTaskPrompt.classList.remove("hidden");
    return;
  }

  emptyTaskPrompt.classList.add("hidden");

  filtered.forEach(task => {
    const card = document.createElement("div");
    card.className = `task-card ${task.status === "completed" ? "completed-card" : ""}`;
    card.setAttribute("data-id", task.id);
    
    card.innerHTML = `
      <div class="task-card-left">
        <div class="task-card-title">${task.title}</div>
        <div class="task-card-badges">
          <span class="task-badge-cat">${task.category}</span>
          <span class="task-badge-priority ${task.priority}">${task.priority.toUpperCase()}</span>
        </div>
      </div>
      <div class="task-card-right">
        <span class="task-status-pill ${task.status}">${task.status.replace("_", " ").toUpperCase()}</span>
        <button class="btn-task-delete" title="Purge Vector">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Click on task card anywhere cycles its progress status!
    card.addEventListener("click", (e) => {
      // Bypasses if clicked delete button
      if (e.target.closest(".btn-task-delete")) return;
      cycleTaskStatus(task.id);
    });

    // Delete click handler
    card.querySelector(".btn-task-delete").addEventListener("click", () => {
      purgeTaskVector(task.id);
    });

    taskListScroller.appendChild(card);
  });
}

function cycleTaskStatus(taskId) {
  const task = systemTasks.find(t => t.id === taskId);
  if (!task) return;
  
  if (task.status === "queued") {
    task.status = "in_progress";
    showToastNotification(`TASK STATE SET TO ACTIVE: ${task.title.substring(0, 15)}...`);
  } else if (task.status === "in_progress") {
    task.status = "completed";
    showToastNotification(`TASK STATE COMPLETED: ${task.title.substring(0, 15)}... ⚡`);
    playSuccessSound();
  } else {
    task.status = "queued";
    showToastNotification(`TASK STATE DE-ACTIVATED: ${task.title.substring(0, 15)}...`);
  }
  
  saveTasksToStorage();
  
  // Find current active filter tab
  const activeTab = document.querySelector(".filter-tab.active").getAttribute("data-filter");
  renderTaskVault(activeTab);
  
  // Log event in console shell
  logSystemToTerminal(`TASK [id: ${taskId}] UPDATED TO STATE: ${task.status.toUpperCase()}`);
}

function purgeTaskVector(taskId) {
  const index = systemTasks.findIndex(t => t.id === taskId);
  if (index === -1) return;
  
  const title = systemTasks[index].title;
  systemTasks.splice(index, 1);
  saveTasksToStorage();
  
  const activeTab = document.querySelector(".filter-tab.active").getAttribute("data-filter");
  renderTaskVault(activeTab);
  
  playDeleteSound();
  showToastNotification(`DESTRUCT COMMAND COMPLETE. PURGED: ${title.substring(0, 12)}...`);
  
  logWarningToTerminal(`TASK SECTOR UNLINKED: [id: ${taskId}] PURGED FROM COGNITIVE NEURAL MATRIX`);
}

function initiateNewTask(title, cat, priority) {
  const newTask = {
    id: Date.now(),
    title: title,
    category: cat,
    priority: priority,
    status: "queued"
  };
  
  systemTasks.push(newTask);
  saveTasksToStorage();
  
  const activeTab = document.querySelector(".filter-tab.active").getAttribute("data-filter");
  renderTaskVault(activeTab);
  
  playSuccessSound();
  showToastNotification("COGNITIVE TASK VECTOR ADDED!");
  logSystemToTerminal(`NEW VECTOR STAGED IN SECTOR [cat: ${cat.toUpperCase()}] >> ${title}`);
}

// ── TACTICAL TYPING COMMAND LINE INTERPRETER ────────────────────────────
function executeTerminalCommand(cmdString) {
  const trimmed = cmdString.trim();
  if (!trimmed) return;
  
  playEnterSound();
  
  // Echo user typing in scroller
  appendTerminalLine(`[guest@cyber-dash]:~$ ${trimmed}`, "input-echo");
  
  // Tokenize arguments
  const args = trimmed.split(" ");
  const baseCmd = args[0].toLowerCase();
  
  switch(baseCmd) {
    case "help":
      printTerminalHelp();
      break;
    
    case "status":
      printSystemStatus();
      break;
      
    case "clear":
      terminalOutput.innerHTML = "";
      break;
      
    case "diagnose":
      triggerMainframeDiagnoseAnimation();
      break;
      
    case "theme":
      if (!args[1]) {
        appendTerminalLine("ERROR: Specify theme argument. Options: magenta, green, amber, yellow", "output-error");
      } else {
        const map = {
          magenta: "cyan-magenta",
          green: "toxic-green",
          amber: "amber-gold",
          yellow: "hazard-yellow"
        };
        const mapped = map[args[1].toLowerCase()];
        if (mapped) {
          changeDashboardTheme(mapped);
          appendTerminalLine(`THEME PALETTE SHIFT TO: ${args[1].toUpperCase()}`, "output-system");
        } else {
          appendTerminalLine(`ERROR: Theme "${args[1]}" not found. Available: magenta, green, amber, yellow`, "output-error");
        }
      }
      break;
      
    case "add":
      const taskTitle = args.slice(1).join(" ");
      if (!taskTitle) {
        appendTerminalLine("ERROR: Command require task details. Usage: add [task text]", "output-error");
      } else {
        initiateNewTask(taskTitle, "sys", "medium");
        appendTerminalLine(`CLI INITIATED MODULE INJECTED >> "${taskTitle}"`, "output-system");
      }
      break;
      
    case "delete":
      const idInput = parseInt(args[1]);
      if (isNaN(idInput)) {
        appendTerminalLine("ERROR: Specify numeric Task Vector ID. Usage: delete [task_id]", "output-error");
      } else {
        const found = systemTasks.find(t => t.id === idInput);
        if (found) {
          purgeTaskVector(idInput);
          appendTerminalLine(`CLI DESTRUCT SEQUENCE VERIFIED: PURGED ID [${idInput}]`, "output-system");
        } else {
          appendTerminalLine(`ERROR: Task Vector ID [${idInput}] not found in database.`, "output-error");
        }
      }
      break;

    case "canvas":
      if (args[1] === "matrix" || args[1] === "neural") {
        if (currentCanvasMode !== args[1]) {
          toggleCanvasMode();
        }
        appendTerminalLine(`CANVAS VECTOR REDIRECTED TO: ${args[1].toUpperCase()}`, "output-system");
      } else {
        appendTerminalLine("ERROR: Canvas options: neural, matrix. Usage: canvas [neural/matrix]", "output-error");
      }
      break;
      
    default:
      appendTerminalLine(`ERROR: Command "${baseCmd}" unrecognized by Gateway protocols. Type "help" for mainframe codes.`, "output-error");
  }
  
  // Auto scroll
  terminalScroller.scrollTop = terminalScroller.scrollHeight;
}

function appendTerminalLine(text, className) {
  const line = document.createElement("div");
  line.className = `terminal-line ${className}`;
  line.textContent = text;
  terminalOutput.appendChild(line);
}

function printTerminalHelp() {
  const helpText = `
MAINFRAME TACTICAL TERMINAL COMMANDS CODES:
---------------------------------------------------------
help                      - Display available mainframe gateways.
status                    - Diagnostic status reading of physical heaps.
diagnose                  - Initiate full secure self-test diagnostic run.
theme [color_name]        - Dynamic shift colors (magenta / green / amber / yellow).
canvas [style]            - Re-route canvas background particles (neural / matrix).
add [task details]       - Direct injection of Sys-level Task vectors.
delete [task_id]          - Execute structural purge on tasks.
clear                     - Wipe the terminal operations scroller clean.
`;
  appendTerminalLine(helpText, "output-response");
}

function printSystemStatus() {
  const stats = `
DIAGNOSTIC TELEMETRY READINGS:
---------------------------------------------------------
OPERATING SYSTEM : V8.04-CYBER-CORE
HOST OPERATOR    : VANSHIKA
STATUS PROTOCOL  : SECURE SHIELD ACTIVE
GATEWAY LATENCY  : ${valPing.textContent} (STABLE)
TOTAL CODES RUN  : ${systemTasks.length} LOADED
CPU WORKLOAD     : ${valCpu.textContent} [4 ACTIVE CORES]
MEMORY ALLOCATED : ${valRam.textContent}
THERMAL STATE    : ${valCoreTemp.textContent} (CORE TEMP)
`;
  appendTerminalLine(stats, "output-response");
}

function triggerMainframeDiagnoseAnimation() {
  appendTerminalLine("INITIATING SYSTEM DIAGNOSE SEQUENCE...", "output-system");
  let step = 0;
  
  const steps = [
    { text: "Scanning secure port tunnels... [STABLE]", delay: 400 },
    { text: "Reading database heaps... [3.4GB RAM CONSUMED]", delay: 800 },
    { text: "Verifying firewall gateway shielding... [100% SECURE]", delay: 1200 },
    { text: "Testing thermal sensors... [CORE TEMP VERIFIED OK]", delay: 1600 },
    { text: "System diagnosis completed. Mainframe is 100% stable. ⚡", delay: 2000 }
  ];
  
  steps.forEach(s => {
    setTimeout(() => {
      appendTerminalLine(`>> ${s.text}`, "output-response");
      terminalScroller.scrollTop = terminalScroller.scrollHeight;
      playKeySound();
      
      if (s.text.includes("completed")) {
        playSuccessSound();
      }
    }, s.delay);
  });
}

function logSystemToTerminal(log) {
  const time = new Date().toTimeString().split(" ")[0];
  appendTerminalLine(`[${time}] [SYSTEM]: ${log}`, "output-system");
  terminalScroller.scrollTop = terminalScroller.scrollHeight;
}

function logWarningToTerminal(log) {
  const time = new Date().toTimeString().split(" ")[0];
  appendTerminalLine(`[${time}] [ALERT]: ${log}`, "output-error");
  terminalScroller.scrollTop = terminalScroller.scrollHeight;
}

// ── BINDINGS & SCREEN CONTROLLERS ────────────────────────────────────────
function setupEventListeners() {
  // Sound toggle button click
  btnToggleAmbient.addEventListener("click", toggleSoundSystem);
  
  // Canvas toggle button click
  btnToggleCanvas.addEventListener("click", toggleCanvasMode);

  // Keyboard typing click trigger
  terminalInput.addEventListener("keydown", (e) => {
    // Avoid playing key clicks on generic modifiers like enter or shift
    if (e.key !== "Enter" && e.key !== "Shift" && e.key !== "Control") {
      playKeySound();
    }
  });

  // Terminal CLI submission
  terminalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const cmd = terminalInput.value;
    executeTerminalCommand(cmd);
    terminalInput.value = "";
  });

  // Focus terminal input if clicked anywhere inside terminal body
  document.querySelector(".terminal-body").addEventListener("click", () => {
    terminalInput.focus();
  });

  // Task adding staging form
  taskAddForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    const cat = taskCategorySelect.value;
    const pri = taskPrioritySelect.value;
    
    if (title) {
      initiateNewTask(title, cat, pri);
      taskTitleInput.value = "";
    }
  });

  // Task Category filter tabs
  taskFilters.forEach(tab => {
    tab.addEventListener("click", () => {
      taskFilters.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const filter = tab.getAttribute("data-filter");
      renderTaskVault(filter);
      
      playKeySound();
    });
  });

  // Dynamic Theme dots changes
  themeDots.forEach(dot => {
    dot.addEventListener("click", () => {
      themeDots.forEach(d => d.classList.remove("active"));
      dot.classList.add("active");
      
      const themeName = dot.getAttribute("data-theme");
      changeDashboardTheme(themeName);
    });
  });
}

function changeDashboardTheme(themeClass) {
  // Clear old classes on body and append new
  document.body.className = "";
  document.body.classList.add(`theme-${themeClass}`);
  activeTheme = themeClass;
  
  // Update footer live log
  liveFooterLog.textContent = `Dashboard styling re-routed to: ${themeClass.toUpperCase()} mode.`;
  
  // Play sound
  playSuccessSound();
  showToastNotification(`SYSTEM COLOUR SET TO: ${themeClass.replace("-", " ").toUpperCase()}`);
}

// ── FLOATING TOAST NOTIFICATION POPUPS ───────────────────────────────────
function showToastNotification(msg) {
  let container = document.getElementById("hud-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "hud-toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "cyber-toast";
  toast.textContent = `[SYSTEM HUD]: ${msg}`;
  container.appendChild(toast);

  // Trigger entering CSS transition
  setTimeout(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
  }, 10);

  // Fade out and remove
  setTimeout(() => {
    toast.style.transform = "translateY(-15px)";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
