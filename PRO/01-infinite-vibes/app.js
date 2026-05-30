/* ==========================================================================
   🎵 INFINITE VIBES: CORE AUDIO & INTERACTION ENGINE (WITH PROCEDURAL OFFLINE SYNTH & AUTO-CORS FALLBACK)
   ========================================================================== */

// ── PLAYLIST & METADATA DATABASE ─────────────────────────────────────────
const PLAYLIST = [
  {
    id: 0,
    title: "Galactic Synthesizer (Offline)",
    artist: "Synthesized Live",
    vibe: "ambient",
    audioUrl: "synth",
    coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=300&auto=format&fit=crop",
    lyrics: `
[00:00.00] ✨ (Initializing Procedural Star Synth...)
[00:04.00] Web Audio API active. Generating real-time oscillators.
[00:09.00] Warm synthesized ambient pads active...
[00:15.00] Enjoy 100% offline, zero-network, zero-CORS sound space!
[00:22.00] Twinkling star chimes appearing in Pentatonic scale.
[00:30.00] A peaceful digital dreamscape playing just for you.
[00:38.00] Moving glowing lines react to the live synth chimes.
[00:46.00] Continuous procedural generation in infinite mode.
[00:54.00] Feel the soft triangle-wave pads embracing the room.
[01:02.00] Perfect focus, organic frequencies, zero lag.
[01:10.00] (Synth pads rising and swelling in harmony...)
[01:25.00] Stars align... keep dreaming, keep coding.
[01:40.00] Pentatonic bells dancing above the cosmic horizon.
[02:00.00] Zero external files required. Pure audio engineering.
[02:30.00] Entering next cosmic quadrant...
[03:00.00] ✨ Dynamic soundwaves dancing forever.
`
  },
  {
    id: 1,
    title: "Cozy Afternoons",
    artist: "Lofi Dreamer",
    vibe: "lofi",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://raw.githubusercontent.com/muhammederdem/mini-player/master/img/1.jpg",
    lyrics: `
[00:00.00] ☕ (Cozy Afternoons - Mellow Lo-Fi keys playing)
[00:08.00] Grab a warm cup of coffee and settle in.
[00:15.00] Time slows down... focus takes over.
[00:23.00] Smooth lo-fi snare snaps in the background.
[00:30.00] Beautiful, warm piano chords swelling nicely.
[00:38.00] Enjoy the unblocked high-speed stream!
[00:46.00] Perfect CORS, perfect visualizer waves.
[01:00.00] (Jazz chords expanding smoothly...)
[01:30.00] Peace... Focus... Cozy vibes...
`
  },
  {
    id: 2,
    title: "Late Night Cruise",
    artist: "Synth Rider",
    vibe: "synthwave",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    coverUrl: "https://raw.githubusercontent.com/muhammederdem/mini-player/master/img/2.jpg",
    lyrics: `
[00:00.00] ⚡ (Late Night Cruise - Neon retro synthesizer rising)
[00:10.00] Cruise down the neon-lit city highway.
[00:18.00] Glow chimes shimmering in the midnight air.
[00:26.00] Dynamic synth bassline driving your heartbeat.
[00:35.00] Zero limits, zero blocks, pure high-fidelity energy.
[01:00.00] Outrun the clock, ride the synthetic waves!
`
  },
  {
    id: 3,
    title: "Warm Campfires",
    artist: "Amber Echoes",
    vibe: "acoustic",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    coverUrl: "https://raw.githubusercontent.com/muhammederdem/mini-player/master/img/3.jpg",
    lyrics: `
[00:00.00] 🌇 (Warm Campfires - Cozy organic guitars plucking)
[00:12.00] Gather around the crackling sparks.
[00:20.00] Warm strings harmonizing with the summer breeze.
[00:30.00] Let the daylight fade into starlight.
[00:40.00] Relaxation in its purest, most acoustic form.
[01:20.00] Simple, rustic, absolute coziness.
`
  },
  {
    id: 4,
    title: "Stellar Journey",
    artist: "Nebula Drifter",
    vibe: "ambient",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    coverUrl: "https://raw.githubusercontent.com/muhammederdem/mini-player/master/img/4.jpg",
    lyrics: `
[00:00.00] 🪐 (Stellar Journey - Cosmic relaxing pads expanding)
[00:15.00] Floating weightless across the Orion nebula.
[00:30.00] Space dust sparkling in the distant starlight.
[00:45.00] Endless cosmic chimes echoing through the void.
[01:00.00] Deep, quiet, atmospheric absolute peace.
`
  }
];

// Loopable ambient audios from raw sources
const AMBIENT_SOURCES = {
  rain: "https://raw.githubusercontent.com/rafaelreis-hotmart/audio-ambient/main/rain.mp3",
  cafe: "https://raw.githubusercontent.com/rafaelreis-hotmart/audio-ambient/main/cafe.mp3",
  fire: "https://raw.githubusercontent.com/rafaelreis-hotmart/audio-ambient/main/fire.mp3",
  scratch: "https://raw.githubusercontent.com/rafaelreis-hotmart/audio-ambient/main/vinyl-scratch.mp3"
};

// ── STATE VARIABLES ──────────────────────────────────────────────────────
let currentTrackIndex = 0;
let isPlaying = false;
let isMuted = false;
let isShuffle = false;
let isRepeat = false;
let parsedLyrics = [];
let activeLyricIndex = -1;
let currentVisualizerStyle = "bars"; // "bars" or "radial"

// YouTube Stream Health States
const INVIDIOUS_INSTANCES = [
  "yewtu.be",
  "invidious.kavin.rocks",
  "vid.puffyan.us",
  "inv.riverside.rocks",
  "invidious.namazso.eu"
];
let activeInvidiousInstance = INVIDIOUS_INSTANCES[0];

const VIBE_COLORS = {
  ambient: { hex: "#64ffda", rgb: "100, 255, 218" },
  lofi: { hex: "#ff4081", rgb: "255, 64, 129" },
  synthwave: { hex: "#00f2fe", rgb: "0, 242, 254" },
  acoustic: { hex: "#ffd54f", rgb: "255, 213, 79" }
};
let cachedNeonColor = VIBE_COLORS.ambient.hex;
let cachedNeonColorRGB = VIBE_COLORS.ambient.rgb;

let activeVideoId = "";
let activeTrackData = null;
let activeInvidiousInstanceIndex = 0;
let streamRetryCount = 0;
let hasTriedWithoutCORS = false;
let isWebAudioConnected = true; // State of active web audio connection

// Live Synthesizer States (Zero-CORS Fallback Engine)
let isSynthActive = false;
let synthInterval = null;
let synthOscillators = [];
let synthGainNodes = [];
let synthStartTime = 0;
let synthPausedTime = 0;
let synthCurrentTime = 0;
const synthDuration = 180; // 3 minutes total track duration

// Web Audio API Elements
let audioCtx = null;
let audioSource = null;
let analyser = null;
let dataArray = null;
let bufferLength = 0;
let animationFrameId = null;

// Scratch/Crackle FX
let scratchAudio = null;

// ── DOM ELEMENTS ─────────────────────────────────────────────────────────
const body = document.body;
let audio = document.getElementById("main-audio");
const playPauseBtn = document.getElementById("btn-play-pause");
const playIcon = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");
const prevBtn = document.getElementById("btn-prev");
const nextBtn = document.getElementById("btn-next");
const shuffleBtn = document.getElementById("btn-shuffle");
const repeatBtn = document.getElementById("btn-repeat");
const seekSlider = document.getElementById("seek-slider");
const progressFill = document.getElementById("progress-fill");
const progressThumb = document.getElementById("progress-thumb");
const timeCurrent = document.getElementById("time-current");
const timeTotal = document.getElementById("time-total");
const volumeSlider = document.getElementById("volume-slider");
const volumeFill = document.getElementById("volume-fill");
const volumeThumb = document.getElementById("volume-thumb");
const muteBtn = document.getElementById("btn-mute");
const volumeHighIcon = document.getElementById("volume-high");
const volumeMutedIcon = document.getElementById("volume-muted");

// Turntable
const vinylRecord = document.getElementById("vinyl-record");
const tonearm = document.getElementById("tonearm-assembly");
const trackArt = document.getElementById("track-art");
const miniTrackArt = document.getElementById("mini-track-art");
const trackTitle = document.getElementById("player-track-title");
const trackArtist = document.getElementById("player-track-artist");

// Visualizer Canvas
const canvas = document.getElementById("audio-visualizer");
const ctx = canvas.getContext("2d");
const btnToggleVisualizer = document.getElementById("btn-toggle-visualizer");

// Sidebar Tabs & Panels
const tabLyrics = document.getElementById("tab-lyrics");
const tabPlaylist = document.getElementById("tab-playlist");
const panelLyrics = document.getElementById("panel-lyrics");
const panelPlaylist = document.getElementById("panel-playlist");
const lyricsList = document.getElementById("lyrics-list");
const lyricScroller = document.getElementById("lyric-scroller");
const trackListContainer = document.getElementById("track-list");

// Upload Zone
const uploadZone = document.getElementById("upload-zone");
const fileInput = document.getElementById("file-input");

// Ambient Mixer
const btnOpenMixer = document.getElementById("btn-open-mixer");
const btnCloseMixer = document.getElementById("btn-close-mixer");
const mixerModal = document.getElementById("mixer-modal");
const sliderRain = document.getElementById("ambient-rain");
const sliderCafe = document.getElementById("ambient-cafe");
const sliderFire = document.getElementById("ambient-fire");
const lblRain = document.getElementById("lbl-vol-rain");
const lblCafe = document.getElementById("lbl-vol-cafe");
const lblFire = document.getElementById("lbl-vol-fire");
const fillRain = document.getElementById("rain-fill");
const fillCafe = document.getElementById("cafe-fill");
const fillFire = document.getElementById("fire-fill");
const thumbRain = document.getElementById("rain-thumb");
const thumbCafe = document.getElementById("cafe-thumb");
const thumbFire = document.getElementById("fire-thumb");

const audioRain = document.getElementById("audio-rain");
const audioCafe = document.getElementById("audio-cafe");
const audioFire = document.getElementById("audio-fire");

// ── INITIALIZATION ───────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  setupPlaylist();
  loadTrack(currentTrackIndex);
  setupEventListeners();
  setupMixerSliders();
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  
  // Set ambient audio loop sources (Direct links bypass redirects)
  audioRain.src = AMBIENT_SOURCES.rain;
  audioCafe.src = AMBIENT_SOURCES.cafe;
  audioFire.src = AMBIENT_SOURCES.fire;

  // Set default volume levels
  audio.volume = parseFloat(volumeSlider.value) / 100;
  
  // Setup local scratch FX audio element
  scratchAudio = new Audio(AMBIENT_SOURCES.scratch);
  scratchAudio.volume = 0.25;

  // Listen for audio loading errors (e.g. CORS blocks, offline networks)
  audio.addEventListener("error", handleAudioLoadingError);
  audio.addEventListener("ended", handleAudioEnded);
});

function handleAudioEnded() {
  if (isRepeat) {
    audio.currentTime = 0;
    playAudio();
  } else {
    nextTrack();
  }
}

// Dynamic Native Audio Recreation Engine (Bypasses Web Audio CORS blocks)
function recreateAudioElement(withWebAudio) {
  if (isWebAudioConnected === withWebAudio && document.getElementById("main-audio")) return;
  isWebAudioConnected = withWebAudio;
  
  console.log(`🛠️ Recreating HTML5 Audio element. WebAudio Connection: ${withWebAudio}`);
  
  // Store volume and URLs
  const currentVolume = audio.volume;
  const currentMuted = audio.muted;
  const currentUrl = audio.src;
  
  // Clean up old audio node
  audio.pause();
  audio.removeAttribute("src");
  try { audio.load(); } catch(e){}
  
  audio.removeEventListener("timeupdate", updateProgressBar);
  audio.removeEventListener("ended", handleAudioEnded);
  audio.removeEventListener("error", handleAudioLoadingError);
  audio.remove();
  
  // Create brand new untainted audio node
  audio = document.createElement("audio");
  audio.id = "main-audio";
  audio.style.display = "none";
  document.body.appendChild(audio);
  
  // Restore states
  audio.volume = currentVolume;
  audio.muted = currentMuted;
  
  // Re-bind listeners
  audio.addEventListener("timeupdate", updateProgressBar);
  audio.addEventListener("ended", handleAudioEnded);
  audio.addEventListener("error", handleAudioLoadingError);
  
  if (withWebAudio) {
    audio.setAttribute("crossorigin", "anonymous");
    if (audioCtx) {
      try {
        audioSource = audioCtx.createMediaElementSource(audio);
        audioSource.connect(analyser);
      } catch(e) {
        console.warn("Could not re-route WebAudio source:", e);
      }
    }
  } else {
    audio.removeAttribute("crossorigin");
    // Leave audioSource as null so it plays directly to browser speakers!
  }
  
  if (currentUrl && currentUrl !== window.location.href) {
    audio.src = currentUrl;
    try { audio.load(); } catch(e){}
  }
}

// ── PLAYLIST & UI GENERATION ─────────────────────────────────────────────
function setupPlaylist() {
  trackListContainer.innerHTML = "";
  PLAYLIST.forEach((track, index) => {
    const item = document.createElement("div");
    item.classList.add("track-item");
    if (index === currentTrackIndex) item.classList.add("active");
    item.setAttribute("data-index", index);

    const durations = ["Live Synth", "6:12", "7:05", "5:44", "5:02"];
    const duration = track.duration || durations[index] || "3:30";

    item.innerHTML = `
      <div class="track-item-art">
        <img src="${track.coverUrl}" alt="${track.title}">
      </div>
      <div class="track-item-meta">
        <div class="track-item-title">${track.title}</div>
        <div class="track-item-artist">${track.artist}</div>
      </div>
      <div class="track-item-duration">${duration}</div>
    `;

    item.addEventListener("click", () => {
      if (currentTrackIndex === index) {
        togglePlay();
      } else {
        currentTrackIndex = index;
        loadTrack(currentTrackIndex);
        playAudio();
      }
    });

    trackListContainer.appendChild(item);
  });
  
  document.getElementById("track-count").textContent = `${PLAYLIST.length} Tracks`;
}

function updatePlaylistUI() {
  const items = trackListContainer.querySelectorAll(".track-item");
  items.forEach((item, index) => {
    if (index === currentTrackIndex) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// ── TRACK LOADING ENGINE ─────────────────────────────────────────────────
function loadTrack(index) {
  const track = PLAYLIST[index];
  
  // Update details
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;
  trackArt.src = track.coverUrl;
  miniTrackArt.src = track.coverUrl;

  // Toggle active synth state
  if (track.audioUrl === "synth") {
    isSynthActive = true;
    audio.removeAttribute("src"); // Clear source
    synthCurrentTime = 0;
    synthPausedTime = 0;
  } else {
    isSynthActive = false;
    stopSynth();
    
    // Always attempt high-fidelity CORS visualizer mode first
    recreateAudioElement(true);
    hasTriedWithoutCORS = false;
    
    audio.src = track.audioUrl;
    audio.load();
  }
  
  // Reset seek sliders
  seekSlider.value = 0;
  progressFill.style.width = "0%";
  progressThumb.style.left = "0%";
  timeCurrent.textContent = "0:00";
  timeTotal.textContent = isSynthActive ? "3:00" : "0:00";
  
  // Set theme class on body
  body.className = ""; // Remove all classes
  body.classList.add(`vibe-${track.vibe}`);
  
  // Cache neon accent colors instantly via lookup table to eliminate visualizer performance lag
  const themeColors = VIBE_COLORS[track.vibe] || VIBE_COLORS.ambient;
  cachedNeonColor = themeColors.hex;
  cachedNeonColorRGB = themeColors.rgb;

  // Parse and display lyrics
  parseLyrics(track.lyrics);
  displayLyrics();
  
  // Reset active lyric line state
  activeLyricIndex = -1;
  
  // Platter vinyl resetting
  if (!isPlaying) {
    tonearm.classList.remove("playing");
    vinylRecord.classList.remove("playing");
  }

  updatePlaylistUI();
}

// ── PLAYBACK LOGIC ───────────────────────────────────────────────────────
function togglePlay() {
  if (isPlaying) {
    pauseAudio();
  } else {
    playAudio();
  }
}

function playAudio() {
  // Web Audio Context setup on first play gesture
  initWebAudio();

  isPlaying = true;
  
  // Tonearm and vinyl spinning drops immediately to bypass autoplay gesture blocking!
  tonearm.classList.add("playing");
  vinylRecord.classList.add("playing");
  
  // Play vinyl needle drop scratch sound in parallel
  scratchAudio.currentTime = 0;
  scratchAudio.play().catch(() => {});

  if (isSynthActive) {
    // Start offline Web Synth pads
    playSynth();
  } else {
    // Play standard Audio element synchronously in click gesture context!
    audio.play().catch(err => {
      console.error("Audio playback blocked: ", err);
      handleAudioLoadingError(err);
    });
  }
  
  // Toggle play buttons
  playIcon.classList.add("hidden");
  pauseIcon.classList.remove("hidden");
  
  // Start visualizer animation
  drawVisualizer();
  
  // Trigger background ambient channels if active
  playAmbientTracks();
}

function pauseAudio() {
  isPlaying = false;
  
  if (isSynthActive) {
    pauseSynth();
  } else {
    audio.pause();
  }
  
  pauseAmbientTracks();

  // Pick needle off vinyl
  tonearm.classList.remove("playing");
  vinylRecord.classList.remove("playing");

  playIcon.classList.remove("hidden");
  pauseIcon.classList.add("hidden");
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
}

function prevTrack() {
  currentTrackIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
  loadTrack(currentTrackIndex);
  if (isPlaying) {
    playAudio();
  }
}

function nextTrack() {
  if (isShuffle) {
    currentTrackIndex = Math.floor(Math.random() * PLAYLIST.length);
  } else {
    currentTrackIndex = (currentTrackIndex + 1) % PLAYLIST.length;
  }
  loadTrack(currentTrackIndex);
  if (isPlaying) {
    playAudio();
  }
}

// ── SYNCED LYRICS PARSER & ENGINE ────────────────────────────────────────
function parseLyrics(lrcText) {
  parsedLyrics = [];
  const lines = lrcText.split("\n");
  const timeRegExp = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;

  lines.forEach(line => {
    const match = timeRegExp.exec(line);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = match[3] ? parseInt(match[3]) : 0;
      // Convert time to total seconds
      const totalSeconds = minutes * 60 + seconds + (milliseconds / 100);
      const text = line.replace(timeRegExp, "").trim();
      
      if (text) {
        parsedLyrics.push({ time: totalSeconds, text: text });
      }
    }
  });

  // Sort by timeline
  parsedLyrics.sort((a, b) => a.time - b.time);
}

function displayLyrics() {
  lyricsList.innerHTML = "";
  if (parsedLyrics.length === 0) {
    lyricsList.innerHTML = `<div class="lyric-line placeholder">Instrumental track... Enjoy the vibes</div>`;
    return;
  }

  parsedLyrics.forEach((lyric, idx) => {
    const lineEl = document.createElement("div");
    lineEl.classList.add("lyric-line");
    lineEl.textContent = lyric.text;
    lineEl.setAttribute("data-index", idx);
    
    // Clicking on lyric jumps to that song timing!
    lineEl.addEventListener("click", () => {
      if (isSynthActive) {
        synthPausedTime = lyric.time;
        synthStartTime = Date.now() - (synthPausedTime * 1000);
      } else {
        audio.currentTime = lyric.time;
      }
      updateProgressBar();
    });

    lyricsList.appendChild(lineEl);
  });
}

function updateLyricsSync(currentTime) {
  if (parsedLyrics.length === 0) return;

  // Find active lyric index
  let activeIndex = -1;
  for (let i = 0; i < parsedLyrics.length; i++) {
    if (currentTime >= parsedLyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Update active styling & auto-scroll
  if (activeIndex !== activeLyricIndex && activeIndex !== -1) {
    const lines = lyricsList.querySelectorAll(".lyric-line");
    lines.forEach(line => line.classList.remove("active"));

    const activeLine = lyricsList.querySelector(`.lyric-line[data-index="${activeIndex}"]`);
    if (activeLine) {
      activeLine.classList.add("active");
      
      const containerHeight = lyricScroller.clientHeight;
      const lineOffsetTop = activeLine.offsetTop;
      const linePercentHeight = activeLine.clientHeight;
      
      lyricScroller.scrollTop = lineOffsetTop - (containerHeight / 2.6) + (linePercentHeight / 2);
    }
    activeLyricIndex = activeIndex;
  }
}

// ── WEB AUDIO API VISUALIZER SYSTEM ──────────────────────────────────────
function initWebAudio() {
  if (audioCtx) return; // Only init once!

  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256; // 128 frequencies bars
    
    if (isWebAudioConnected) {
      // Bind main HTML5 Audio source to context
      audioSource = audioCtx.createMediaElementSource(audio);
      audioSource.connect(analyser);
      analyser.connect(audioCtx.destination);
    } else {
      analyser.connect(audioCtx.destination);
    }
    
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
  } catch (err) {
    console.warn("Web Audio API is not fully supported or blocked by browser policies: ", err);
  }
}

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

function drawVisualizer() {
  if (!isPlaying) return;

  animationFrameId = requestAnimationFrame(drawVisualizer);
  
  if (!analyser) {
    drawMockWaves();
    return;
  }

  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Get active neon accent colors from cached variables to prevent browser layout thrashing
  const neonColor = cachedNeonColor;
  const neonColorRGB = cachedNeonColorRGB;

  // If Synth mode, update dummy timeline counter on frame tick
  if (isSynthActive) {
    synthCurrentTime = (Date.now() - synthStartTime) / 1000;
    if (synthCurrentTime >= synthDuration) {
      synthCurrentTime = 0;
      synthStartTime = Date.now();
    }
    updateProgressBar();
  }

  if (currentVisualizerStyle === "bars") {
    // 📊 STYLE A: SLEEK BOTTOM MOUNTED RODS
    const barWidth = (canvas.width / bufferLength) * 1.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const percentVal = dataArray[i] / 255;
      barHeight = percentVal * canvas.height * 0.85;

      // Dynamic color gradient for each bar
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      gradient.addColorStop(0, `rgba(${neonColorRGB}, 0.15)`);
      gradient.addColorStop(0.5, `rgba(${neonColorRGB}, 0.5)`);
      gradient.addColorStop(1, neonColor);

      ctx.fillStyle = gradient;
      
      ctx.beginPath();
      ctx.roundRect(x, canvas.height - barHeight, barWidth - 4, barHeight, 6);
      ctx.fill();

      // Neon glow cap dot
      if (barHeight > 5) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = neonColor;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x + (barWidth - 4) / 2, canvas.height - barHeight, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      x += barWidth;
    }
  } else {
    // 🌀 STYLE B: COAXIAL RADIAL RINGS WRAPPING VINYL (Center visualizer)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 80;
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = neonColor;
    ctx.strokeStyle = neonColor;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    for (let i = 0; i < bufferLength; i++) {
      const angle = (i / bufferLength) * Math.PI * 2;
      const amplitude = (dataArray[i] / 255) * 28;
      const r = baseRadius + amplitude;
      
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glowing core rings
    ctx.strokeStyle = `rgba(${neonColorRGB}, 0.3)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius - 10, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Fallback waves generator if browser doesn't permit active Web Audio context
function drawMockWaves() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const neonColor = cachedNeonColor;
  const time = Date.now() * 0.004;

  ctx.strokeStyle = neonColor;
  ctx.lineWidth = 3;
  ctx.shadowBlur = 12;
  ctx.shadowColor = neonColor;
  ctx.beginPath();

  for (let i = 0; i < canvas.width; i++) {
    const wave1 = Math.sin(i * 0.01 + time) * 15;
    const wave2 = Math.cos(i * 0.02 - time * 0.5) * 8;
    const y = (canvas.height / 2) + wave1 + wave2;

    if (i === 0) ctx.moveTo(i, y);
    else ctx.lineTo(i, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// ── PROGRESS SEEK SLIDER CONTROLS ────────────────────────────────────────
function updateProgressBar() {
  const currentTime = isSynthActive ? synthCurrentTime : audio.currentTime;
  const duration = isSynthActive ? synthDuration : audio.duration;
  
  if (isNaN(duration) || duration === 0) return;
  
  // Update seeking percentages
  const pct = (currentTime / duration) * 100;
  seekSlider.value = pct;
  progressFill.style.width = `${pct}%`;
  progressThumb.style.left = `${pct}%`;

  // Update digital time displays
  timeCurrent.textContent = formatTime(currentTime);
  timeTotal.textContent = formatTime(duration);

  // Sync lyrics to timeline
  updateLyricsSync(currentTime);
}

function formatTime(secs) {
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

// ── OFFLINE WEB AUDIO PROCEDURAL SYNTHESIZER ─────────────────────────────
function playSynth() {
  if (!audioCtx) initWebAudio();
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  // Setup start timers for timeline sync
  synthStartTime = Date.now() - (synthPausedTime * 1000);
  
  // Clear any existing synth loop
  stopSynthFallback();

  // Chords progression (Fmaj7 -> G6 -> Am7 -> Em7)
  const chords = [
    [87.31, 174.61, 220.00, 261.63, 349.23],  // Fmaj7
    [98.00, 196.00, 246.94, 293.66, 392.00],  // G6
    [110.00, 220.00, 261.63, 329.63, 392.00], // Am7
    [82.41, 164.81, 196.00, 246.94, 329.63]   // Em7
  ];
  
  let currentChord = 0;

  function triggerSynthChord() {
    if (!isPlaying || !isSynthActive) return;

    const freqs = chords[currentChord];
    currentChord = (currentChord + 1) % chords.length;

    // Fade out previous active oscillators slowly to prevent clicks
    synthOscillators.forEach((osc, idx) => {
      try {
        const gainNode = synthGainNodes[idx];
        const now = audioCtx.currentTime;
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
        setTimeout(() => {
          try { osc.stop(); } catch(e){}
        }, 2200);
      } catch(e){}
    });

    synthOscillators = [];
    synthGainNodes = [];

    // Trigger new warm triangle wave nodes
    freqs.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "triangle"; // Cosy warm pad sound
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      // Balanced low volumes
      const vol = idx === 0 ? 0.04 : 0.015;
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 1.5); // Warm attack

      osc.connect(gain);
      gain.connect(analyser);
      osc.start();

      synthOscillators.push(osc);
      synthGainNodes.push(gain);
    });

    // Rhythmic star bells chimes (randomly triggered in pentatonic)
    if (Math.random() > 0.25) {
      setTimeout(triggerStarBell, 1000);
      if (Math.random() > 0.5) {
        setTimeout(triggerStarBell, 2200);
      }
    }
  }

  // Trigger initial chord immediately
  triggerSynthChord();

  // Loop chord shifts every 5.5 seconds
  synthInterval = setInterval(triggerSynthChord, 5500);
}

function triggerStarBell() {
  if (!isPlaying || !isSynthActive || !audioCtx) return;
  
  const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // Pentatonic bells C5-C6
  const freq = scale[Math.floor(Math.random() * scale.length)];

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine"; // Pure crystalline chime
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.035, audioCtx.currentTime + 0.05); // Fast chime strike
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.8); // Long ring decay

  osc.connect(gain);
  gain.connect(analyser);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 3.0);
}

function pauseSynth() {
  synthPausedTime = synthCurrentTime;
  stopSynthFallback();
}

function stopSynth() {
  synthPausedTime = 0;
  synthCurrentTime = 0;
  stopSynthFallback();
}

function stopSynthFallback() {
  if (synthInterval) {
    clearInterval(synthInterval);
    synthInterval = null;
  }
  synthOscillators.forEach(osc => {
    try { osc.stop(); } catch(e){}
  });
  synthOscillators = [];
  synthGainNodes = [];
}

// ── AUTOMATIC CORS / OFFLINE FALLBACK MECHANICS (WITH SELF-HEALING STREAM & CORS REMOVAL) ──────────────────────────
function handleAudioLoadingError(err) {
  if (isSynthActive) return; // Prevent infinite loading error loops when procedural synthesizer is active!
  
  console.warn("🔒 Audio loading error caught:", err);
  
  // STEP 1: If browser blocks due to strict CORS, strip crossorigin by recreating audio element and retry once!
  if (!hasTriedWithoutCORS) {
    hasTriedWithoutCORS = true;
    console.log("⚡ Strict CORS detected. Recreating audio node without CORS and retrying stream...");
    showToastPopup("⚡ Optimizing stream... playing in Safe Mode.");
    
    // Recreate element in Direct Safe speaker-bypass mode (CORS-immune!)
    recreateAudioElement(false);
    
    if (isPlaying) {
      audio.play().catch(retryErr => {
        console.warn("Play in safe mode failed:", retryErr);
        handleAudioLoadingError(retryErr); // Proceed to server rotation fallback
      });
    }
    return;
  }
  
  // STEP 2: If playing without CORS still failed, it means the server itself is offline. Try cycling to backup server!
  if (activeVideoId && streamRetryCount < INVIDIOUS_INSTANCES.length) {
    streamRetryCount++;
    hasTriedWithoutCORS = false; // Reset for the new URL
    activeInvidiousInstanceIndex = (activeInvidiousInstanceIndex + 1) % INVIDIOUS_INSTANCES.length;
    const nextInstance = INVIDIOUS_INSTANCES[activeInvidiousInstanceIndex];
    
    console.log(`🔄 Retrying YouTube stream with backup server: https://${nextInstance}`);
    showToastPopup(`🔄 Connection failed. Trying backup server...`);
    
    const nextStreamUrl = `https://${nextInstance}/latest_version?id=${activeVideoId}&itag=140&local=true`;
    
    // Update playlist track url reference
    PLAYLIST[currentTrackIndex].audioUrl = nextStreamUrl;
    
    // Recreate element in CORS-seeking mode for the new URL
    recreateAudioElement(true);
    audio.src = nextStreamUrl;
    audio.load();
    
    if (isPlaying) {
      audio.play().catch(retryErr => {
        console.warn("Backup stream play failed: ", retryErr);
        handleAudioLoadingError(retryErr); // Re-trigger chain to try next server!
      });
    }
  } else {
    // If no YouTube stream active, or ALL servers failed, fallback to Synthesizer!
    console.warn("⚠️ All network tracks or proxies failed. Triggering live procedural Synthesizer backup!");
    
    showToastPopup("⚠️ Connection offline or blocked. Activating local Synthesizer...");
    
    activeVideoId = ""; // Reset
    currentTrackIndex = 0;
    loadTrack(currentTrackIndex);
    
    if (isPlaying) {
      playAudio();
    }
  }
}

// Elegant Toast Pop-up Creator
function showToastPopup(msg) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    // Inline dynamic style block for premium toast stack
    container.style.cssText = `
      position: absolute;
      bottom: 120px;
      right: 40px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.style.cssText = `
    background: rgba(18, 22, 38, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 64, 129, 0.3);
    color: #ffffff;
    font-family: 'Outfit', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    padding: 14px 24px;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 
                0 0 15px rgba(255, 64, 129, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    transform: translateY(30px);
    opacity: 0;
    transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
  `;
  toast.innerHTML = msg;
  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
  }, 10);

  // Fade out and remove
  setTimeout(() => {
    toast.style.transform = "translateY(-20px)";
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 4500);
}

// ── AMBIENT MIXER MECHANICS ──────────────────────────────────────────────
function setupMixerSliders() {
  sliderRain.addEventListener("input", (e) => {
    const val = e.target.value;
    fillRain.style.width = `${val}%`;
    thumbRain.style.left = `${val}%`;
    lblRain.textContent = val > 0 ? `${val}%` : "Off";
    audioRain.volume = parseFloat(val) / 100;
  });

  sliderCafe.addEventListener("input", (e) => {
    const val = e.target.value;
    fillCafe.style.width = `${val}%`;
    thumbCafe.style.left = `${val}%`;
    lblCafe.textContent = val > 0 ? `${val}%` : "Off";
    audioCafe.volume = parseFloat(val) / 100;
  });

  sliderFire.addEventListener("input", (e) => {
    const val = e.target.value;
    fillFire.style.width = `${val}%`;
    thumbFire.style.left = `${val}%`;
    lblFire.textContent = val > 0 ? `${val}%` : "Off";
    audioFire.volume = parseFloat(val) / 100;
  });
}

function playAmbientTracks() {
  if (sliderRain.value > 0) audioRain.play().catch(() => {});
  if (sliderCafe.value > 0) audioCafe.play().catch(() => {});
  if (sliderFire.value > 0) audioFire.play().catch(() => {});
}

function pauseAmbientTracks() {
  audioRain.pause();
  audioCafe.pause();
  audioFire.pause();
}

// ── INTERACTIVE EVENT BINDINGS ───────────────────────────────────────────
function setupEventListeners() {
  // Master Play Buttons
  playPauseBtn.addEventListener("click", togglePlay);
  vinylRecord.addEventListener("click", togglePlay);

  // Skip Tracks Buttons
  prevBtn.addEventListener("click", prevTrack);
  nextBtn.addEventListener("click", nextTrack);

  // Shuffle & Repeat toggles
  shuffleBtn.addEventListener("click", () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle("active", isShuffle);
  });
  
  repeatBtn.addEventListener("click", () => {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle("active", isRepeat);
  });

  // Audio timeline seeking updates
  audio.addEventListener("timeupdate", updateProgressBar);
  audio.addEventListener("ended", handleAudioEnded);

  // Seekbar click and drag inputs
  seekSlider.addEventListener("input", (e) => {
    const pct = e.target.value;
    const duration = isSynthActive ? synthDuration : audio.duration;
    if (isNaN(duration) || duration === 0) return;
    
    const jumpTo = (pct / 100) * duration;
    
    // Instant smooth fill visual update while dragging
    progressFill.style.width = `${pct}%`;
    progressThumb.style.left = `${pct}%`;
    timeCurrent.textContent = formatTime(jumpTo);
    
    if (isSynthActive) {
      synthPausedTime = jumpTo;
      synthStartTime = Date.now() - (synthPausedTime * 1000);
    } else {
      audio.currentTime = jumpTo;
    }
  });

  // Master Volume adjustments
  volumeSlider.addEventListener("input", (e) => {
    const val = e.target.value;
    volumeFill.style.width = `${val}%`;
    thumbVolume(val);
    audio.volume = parseFloat(val) / 100;
    
    if (val == 0) {
      isMuted = true;
      toggleMuteUI(true);
    } else {
      isMuted = false;
      toggleMuteUI(false);
    }
  });

  muteBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    if (isMuted) {
      audio.muted = true;
      toggleMuteUI(true);
    } else {
      audio.muted = false;
      toggleMuteUI(false);
    }
  });

  // Sidebar Panel Tabs switching
  tabLyrics.addEventListener("click", () => {
    tabLyrics.classList.add("active");
    tabPlaylist.classList.remove("active");
    panelLyrics.classList.add("active");
    panelPlaylist.classList.remove("active");
  });

  tabPlaylist.addEventListener("click", () => {
    tabPlaylist.classList.add("active");
    tabLyrics.classList.remove("active");
    panelPlaylist.classList.add("active");
    panelLyrics.classList.remove("active");
  });

  // Ambient sound modal controls
  btnOpenMixer.addEventListener("click", () => {
    mixerModal.classList.add("open");
  });

  btnCloseMixer.addEventListener("click", () => {
    mixerModal.classList.remove("open");
    if (isPlaying) playAmbientTracks();
  });

  mixerModal.addEventListener("click", (e) => {
    if (e.target === mixerModal) {
      mixerModal.classList.remove("open");
      if (isPlaying) playAmbientTracks();
    }
  });

  // Visualizer switch toggles (Header)
  btnToggleVisualizer.addEventListener("click", () => {
    if (currentVisualizerStyle === "bars") {
      currentVisualizerStyle = "radial";
      btnToggleVisualizer.querySelector("span").textContent = "Visualizer: Radial";
    } else {
      currentVisualizerStyle = "bars";
      btnToggleVisualizer.querySelector("span").textContent = "Visualizer: Bars";
    }
    // Re-draw immediately if playing
    if (isPlaying) {
      drawVisualizer();
    }
  });

  // Drag and Drop Local MP3 features
  setupDragAndDrop();

  // YouTube Search Hookups
  const ytSearchInput = document.getElementById("yt-search-input");
  const btnYtSearch = document.getElementById("btn-yt-search");
  const btnCloseResults = document.getElementById("btn-close-results");

  btnYtSearch.addEventListener("click", performCombinedSearch);
  btnCloseResults.addEventListener("click", () => {
    document.getElementById("yt-search-results").classList.add("hidden");
  });

  ytSearchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performCombinedSearch();
    }
  });
}

function thumbVolume(val) {
  volumeThumb.style.left = `${val}%`;
}

function toggleMuteUI(muted) {
  if (muted) {
    volumeHighIcon.classList.add("hidden");
    volumeMutedIcon.classList.remove("hidden");
    volumeFill.style.width = "0%";
    volumeThumb.style.left = "0%";
  } else {
    volumeHighIcon.classList.remove("hidden");
    volumeMutedIcon.classList.add("hidden");
    const val = volumeSlider.value;
    volumeFill.style.width = `${val}%`;
    volumeThumb.style.left = `${val}%`;
  }
}

// ── CUSTOM DRAG-AND-DROP FILE UPLOADS ────────────────────────────────────
function setupDragAndDrop() {
  ["dragenter", "dragover"].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.add("dragover");
    }, false);
  });

  ["dragleave", "drop"].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.remove("dragover");
    }, false);
  });

  uploadZone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleUploadedFile(files[0]);
    }
  });

  uploadZone.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleUploadedFile(e.target.files[0]);
    }
  });
}

function handleUploadedFile(file) {
  if (!file.type.startsWith("audio/")) {
    alert("Please upload a valid audio file (e.g. .mp3 or .wav)!");
    return;
  }

  let fileName = file.name.replace(/\.[^/.]+$/, ""); // Strip extension
  let title = fileName;
  let artist = "Local Vibe Master";

  if (fileName.includes("-")) {
    const parts = fileName.split("-");
    artist = parts[0].trim();
    title = parts[1].trim();
  }

  const fileUrl = URL.createObjectURL(file);
  const newTrack = {
    id: PLAYLIST.length,
    title: title,
    artist: artist,
    vibe: "acoustic",
    audioUrl: fileUrl,
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop",
    lyrics: `
[00:00.00] 📂 Playing local audio file: "${title}"
[00:05.00] Web Audio API active. Generating real-time visualizer.
[00:15.00] Smooth lo-fi frequency response active.
[00:30.00] Enjoy your custom audio vibe!
`,
    duration: "Local"
  };

  PLAYLIST.push(newTrack);
  setupPlaylist();
  currentTrackIndex = PLAYLIST.length - 1;
  loadTrack(currentTrackIndex);
  playAudio();
  showToastPopup(`📁 Loaded local file: "${title}"`);
}

// Stream an iTunes preview track (no CORS proxy needed)
function streamItunesTrack(item) {
  const newTrack = {
    id: PLAYLIST.length,
    title: item.title,
    artist: item.artist,
    vibe: "synthwave",
    audioUrl: item.audioUrl,
    coverUrl: item.thumbnail,
    lyrics: generateMockLyrics(item.title),
    duration: formatTime(item.lengthSeconds || 30)
  };
  PLAYLIST.push(newTrack);
  setupPlaylist();
  currentTrackIndex = PLAYLIST.length - 1;
  loadTrack(currentTrackIndex);
  document.getElementById("yt-search-results").classList.add("hidden");
  tabLyrics.click();
  playAudio();
  showToastPopup(`📡 Streaming iTunes preview: "${item.title}"`);
}

// Utility to generate placeholder lyrics for iTunes tracks
function generateMockLyrics(trackTitle) {
  return `
[00:00.00] 📡 (Initializing iTunes preview for: "${trackTitle}")
[00:04.00] iTunes stream ready. 30‑second preview loaded.
[00:09.00] Visualizer synced to preview audio.
[00:15.00] Enjoy the short vibe!
[00:30.00] Preview ended.
`;
}

// ── PREMIUM YOUTUBE STREAMING SEARCH MECHANICS ─────────── 
// ── PREMIUM YOUTUBE STREAMING SEARCH MECHANICS ─────────── 
async function performCombinedSearch() {
  const input = document.getElementById("yt-search-input");
  const query = encodeURIComponent(input.value.trim());
  if (!input.value.trim()) {
    alert("Please enter a song title or artist!");
    return;
  }

  const resultsList = document.getElementById("yt-results-list");
  const resultsPanel = document.getElementById("yt-search-results");
  
  resultsPanel.classList.remove("hidden");
  resultsList.innerHTML = `<div class="lyric-line placeholder" style="margin-top: 50px;">🔍 Searching the cyber-grid for "${input.value}"...</div>`;

  let searchResults = [];
  let isYoutubeSearch = false;

  // Try YouTube (Invidious API) first to get FULL tracks with self-healing rotation
  for (let i = 0; i < INVIDIOUS_INSTANCES.length; i++) {
    const idx = (activeInvidiousInstanceIndex + i) % INVIDIOUS_INSTANCES.length;
    const instance = INVIDIOUS_INSTANCES[idx];
    try {
      console.log(`Searching Invidious grid: https://${instance}`);
      const res = await fetch(`https://${instance}/api/v1/search?q=${query}&type=video`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          searchResults = data.filter(item => item.type === "video").slice(0, 10).map(item => ({
            source: "youtube",
            videoId: item.videoId,
            title: item.title,
            artist: item.author,
            duration: item.lengthSeconds || 180,
            thumbnail: item.videoThumbnails?.[0]?.url || `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`,
            audioUrl: `https://${instance}/latest_version?id=${item.videoId}&itag=140&local=true`
          }));
          
          // Lock working instance
          activeInvidiousInstanceIndex = idx;
          activeInvidiousInstance = instance;
          isYoutubeSearch = true;
          break;
        }
      }
    } catch (e) {
      console.warn(`Invidious search failed on ${instance}, rotating...`);
    }
  }

  // Fallback to iTunes Search API if all Invidious nodes are offline
  if (searchResults.length === 0) {
    try {
      console.log("All Invidious nodes offline. Falling back to iTunes search previews.");
      const res = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=10`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        searchResults = data.results.map(track => ({
          source: "itunes",
          title: track.trackName,
          artist: track.artistName,
          duration: Math.floor(track.trackTimeMillis / 1000) || 30,
          thumbnail: track.artworkUrl100,
          audioUrl: track.previewUrl
        }));
      }
    } catch (e) {
      console.warn("iTunes fallback search failed", e);
    }
  }

  // Render results
  resultsList.innerHTML = "";
  if (searchResults.length > 0) {
    searchResults.forEach(track => {
      const itemEl = document.createElement("div");
      itemEl.classList.add("yt-result-item");
      
      const durationStr = formatTime(track.duration);
      
      itemEl.innerHTML = `
        <div class="yt-result-art">
          <img src="${track.thumbnail}" alt="${track.title}">
        </div>
        <div class="yt-result-meta">
          <div class="yt-result-title">${track.title}</div>
          <div class="yt-result-artist">${track.artist}</div>
        </div>
        <div class="yt-result-duration">${durationStr}</div>
      `;
      
      itemEl.addEventListener("click", () => {
        if (track.source === "youtube") {
          const newTrack = {
            id: PLAYLIST.length,
            title: track.title,
            artist: track.artist,
            vibe: "synthwave",
            audioUrl: track.audioUrl,
            coverUrl: track.thumbnail,
            lyrics: `
[00:00.00] 📡 (Streaming full song from YouTube grid...)
[00:05.00] Title: ${track.title}
[00:10.00] Artist: ${track.artist}
[00:15.00] Zero-CORS safe fallback engine active.
[00:30.00] Visualizer fully synchronized. Enjoy!
`,
            duration: durationStr,
            videoId: track.videoId
          };

          // Save state for audio loading self-healing
          activeVideoId = track.videoId;
          activeTrackData = track;
          streamRetryCount = 0;

          PLAYLIST.push(newTrack);
          setupPlaylist();
          currentTrackIndex = PLAYLIST.length - 1;
          loadTrack(currentTrackIndex);
          document.getElementById("yt-search-results").classList.add("hidden");
          tabLyrics.click();
          playAudio();
          showToastPopup(`📡 Streaming Full YouTube Track: "${track.title}"`);
        } else {
          // Play iTunes preview track
          streamItunesTrack({
            title: track.title,
            artist: track.artist,
            audioUrl: track.audioUrl,
            thumbnail: track.thumbnail,
            lengthSeconds: track.duration
          });
        }
      });
      
      resultsList.appendChild(itemEl);
    });
  } else {
    resultsList.innerHTML = `<div class="lyric-line placeholder" style="margin-top: 50px;">❌ No results found on the grid.</div>`;
  }
}
