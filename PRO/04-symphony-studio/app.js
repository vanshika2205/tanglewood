/* ==========================================================================
   🎵 FL SYMPHONY: BROWSER DAW SEQUENCE ENGINE (HYBRID BEATBOX & SYNTH TUNES)
   ========================================================================== */

// ── GLOBAL STATE & INSTRUMENT CONFIGS ────────────────────────────────────
const SECTIONS = {
  activeTheme: "acid-teal",
  soundKit: "acid-techno",
  isPlaying: false,
  bpm: 120,
  volume: 0.8,
  isMetronomeEnabled: true,
  currentTrackSelect: "kick"  // Selected track in the rack
};

// Web Audio Core Nodes
let audioCtx = null;
let masterGainNode = null;
let compressorNode = null;
let distortionNode = null;     // Warm Analog Saturation

// Equalizer Filters & Reverb Send Nodes
let filterLowpass = null;      // Master Cutoff & Q Resonance
let filterBassBoost = null;    // Low Shelf Boost
let filterTrebleBoost = null;  // High Shelf Brightness
let filterReverbSend = null;   // Reverb Send dry-wet gain node
let reverbNode = null;         // Algorithmic Room/Hall Reverberator
let analyser = null;

// Multi-Channel Track DSP Mixer Blocks (Individual volume/pan gain nodes)
const trackDSP = {};
const channelsList = ["kick", "snare", "hihat", "perc", "bass", "synth", "lead", "acid"];

// Sequencer Engine Clock Settings
let schedulerTimer = null;
let current16thNote = 0;       // Current step tick (0 to 15)
let currentSequencerTicks = 0; // Total absolute tick steps played
let nextNoteTime = 0.0;        // Web Audio absolute start timing
const scheduleAheadTime = 0.1; // Lookahead scheduling window (seconds)
const lookaheadInterval = 25.0; // Interval to check schedule (ms)

// Step Sequencer active notes grids matrix (4 Rhythm + 4 Melodic Channels)
const activeSteps = {
  kick: Array(16).fill(false),
  snare: Array(16).fill(false),
  hihat: Array(16).fill(false),
  perc: Array(16).fill(false),
  bass: Array(16).fill(false),
  synth: Array(16).fill(false),
  lead: Array(16).fill(false),
  acid: Array(16).fill(false)
};

// Custom sequencer notes mapped step-by-step for the 4 melodic channels
const sequencerNotes = {
  bass: Array(16).fill("C4"),
  synth: Array(16).fill("Eb4"),
  lead: Array(16).fill("G4"),
  acid: Array(16).fill("C5")
};

// Interactive 4x4 Launchpad Loop Stem States
const launchpadStems = Array(16).fill().map((_, idx) => ({
  id: idx,
  type: idx < 4 ? "drum" : (idx < 8 ? "bass" : (idx < 12 ? "lead" : "fx")),
  label: getPadLabel(idx),
  isActive: false,
  customAudioBuffer: null
}));

// Preloaded Sound kits minor pentatonic scale intervals (C-minor root frequencies)
const PENTATONIC_SCALES = {
  "acid-techno": [65.41, 77.78, 87.31, 98.00, 116.54, 130.81, 155.56, 174.61], // C2 to F3
  "lofi-chill": [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63], // C3 to E4
  "retro-synth": [98.00, 110.00, 130.81, 146.83, 164.81, 196.00, 220.00, 261.63] // G2 to C4
};

// Curated DAW Melodic patterns library (plays pristine tunes based on kits)
const DAW_MELODY_PATTERNS = {
  "acid-techno": {
    bass: [65.41, 65.41, 77.78, 77.78, 87.31, 87.31, 98.00, 116.54, 130.81, 130.81, 116.54, 98.00, 87.31, 77.78, 65.41, 65.41], // C2 and octave steps
    lead: [261.63, 311.13, 349.23, 392.00, 466.16, 523.25, 466.16, 392.00, 349.23, 392.00, 466.16, 523.25, 622.25, 587.33, 523.25, 466.16],
    acid: [130.81, 155.56, 174.61, 196.00, 233.08, 261.63, 233.08, 196.00, 174.61, 196.00, 233.08, 261.63, 311.13, 293.66, 261.63, 233.08],
    chords: [
      [130.81, 155.56, 196.00], // C minor
      [130.81, 155.56, 196.00],
      [155.56, 196.00, 233.08], // Eb major
      [155.56, 196.00, 233.08],
      [116.54, 146.83, 174.61], // Bb major
      [116.54, 146.83, 174.61],
      [98.00,  116.54, 146.83], // G minor
      [98.00,  116.54, 146.83]
    ]
  },
  "lofi-chill": {
    bass: [65.41, 65.41, 87.31, 87.31, 58.27, 58.27, 77.78, 77.78, 51.91, 51.91, 73.42, 73.42, 49.00, 49.00, 65.41, 65.41], // Jazz progression
    lead: [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 880.00, 783.99, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1046.50, 880.00, 783.99],
    acid: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 392.00, 440.00, 523.25, 587.33, 523.25, 440.00, 392.00],
    chords: [
      [130.81, 164.81, 196.00, 246.94], // C major 7
      [130.81, 164.81, 196.00, 246.94],
      [174.61, 220.00, 261.63, 329.63], // F major 7
      [174.61, 220.00, 261.63, 329.63],
      [116.54, 146.83, 174.61, 220.00], // Bb major 7
      [116.54, 146.83, 174.61, 220.00],
      [155.56, 196.00, 233.08, 293.66]  // Eb major 7
    ]
  },
  "retro-synthwave": {
    bass: [65.41, 130.81, 65.41, 130.81, 51.91, 103.83, 51.91, 103.83, 77.78, 155.56, 77.78, 155.56, 58.27, 116.54, 58.27, 116.54], // running octaves
    lead: [261.63, 293.66, 311.13, 349.23, 392.00, 466.16, 523.25, 587.33, 622.25, 587.33, 523.25, 466.16, 392.00, 349.23, 311.13, 293.66],
    acid: [130.81, 146.83, 155.56, 174.61, 196.00, 233.08, 261.63, 293.66, 311.13, 293.66, 261.63, 233.08, 196.00, 174.61, 155.56, 146.83],
    chords: [
      [130.81, 155.56, 196.00], // C minor
      [130.81, 155.56, 196.00],
      [103.83, 130.81, 155.56], // Ab major
      [103.83, 130.81, 155.56],
      [155.56, 196.00, 233.08], // Eb major
      [155.56, 196.00, 233.08],
      [116.54, 146.83, 174.61], // Bb major
      [116.54, 146.83, 174.61]
    ]
  },
  "retro-synth": {
    bass: [65.41, 130.81, 65.41, 130.81, 51.91, 103.83, 51.91, 103.83, 77.78, 155.56, 77.78, 155.56, 58.27, 116.54, 58.27, 116.54], // running octaves
    lead: [261.63, 293.66, 311.13, 349.23, 392.00, 466.16, 523.25, 587.33, 622.25, 587.33, 523.25, 466.16, 392.00, 349.23, 311.13, 293.66],
    acid: [130.81, 146.83, 155.56, 174.61, 196.00, 233.08, 261.63, 293.66, 311.13, 293.66, 261.63, 233.08, 196.00, 174.61, 155.56, 146.83],
    chords: [
      [130.81, 155.56, 196.00], // C minor
      [130.81, 155.56, 196.00],
      [103.83, 130.81, 155.56], // Ab major
      [103.83, 130.81, 155.56],
      [155.56, 196.00, 233.08], // Eb major
      [155.56, 196.00, 233.08],
      [116.54, 146.83, 174.61], // Bb major
      [116.54, 146.83, 174.61]
    ]
  }
};

// Live playable keybed notes mapping (C-minor pentatonic keyboard)
const SYNTH_KEYS_MAP = [
  { char: "A", note: "C4", freq: 261.63 },
  { char: "S", note: "D4", freq: 293.66 },
  { char: "D", note: "Eb4", freq: 311.13 }, // Black key Eb4
  { char: "F", note: "F4", freq: 349.23 },
  { char: "G", note: "G4", freq: 392.00 },
  { char: "H", note: "Bb4", freq: 466.16 }, // Black key Bb4
  { char: "J", note: "C5", freq: 523.25 },
  { char: "K", note: "D5", freq: 587.33 }
];

// Microphone Recorder States
let mediaRecorder = null;
let recordedAudioChunks = [];
let recordedAudioBuffer = null;
let isRecording = false;

// UI Circular Knobs Drag states
let activeKnob = null;
let activeChannelName = null;
let activeChannelParam = null;
let knobStartY = 0;
let knobStartAngle = 0;
const KNOB_SENSITIVITY = 1.8;

// Dragging states on XY filter pad
let isDraggingXY = false;

// Visualizer style states
let currentVisualizerMode = "bars"; // "bars", "waveform", "circle"

// Background particles and canvas settings
const canvasCosmic = document.getElementById("cosmic-canvas");
const ctxCosmic = canvasCosmic.getContext("2d");
let cosmicParticles = [];

const visualizerCanvas = document.getElementById("studio-visualizer");
const ctxVisualizer = visualizerCanvas.getContext("2d");
let visualizerBufferLength = 0;
let visualizerDataArray = null;

// ── INITIALIZATION ───────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  initCosmicParticles();
  initSequencerDOM();
  initLaunchpadDOM();
  initKeybedDOM();
  initKnobRotations();
  setupEventListeners();
  resizeStudioCanvases();
  
  // Set default gorgeous human beatboxing and chord melody groove on startup (classic FL patterns)
  activeSteps.kick[0] = true;
  activeSteps.kick[8] = true;
  activeSteps.snare[4] = true;
  activeSteps.snare[12] = true;
  activeSteps.hihat[2] = true;
  activeSteps.hihat[6] = true;
  activeSteps.hihat[10] = true;
  activeSteps.hihat[14] = true;
  activeSteps.perc[10] = true;
  
  // Melodic channels start active steps
  activeSteps.bass[0] = true;
  activeSteps.bass[4] = true;
  activeSteps.bass[8] = true;
  activeSteps.bass[12] = true;
  activeSteps.synth[2] = true;
  activeSteps.synth[10] = true;
  activeSteps.lead[6] = true;
  activeSteps.lead[14] = true;
  activeSteps.acid[1] = true;
  activeSteps.acid[9] = true;

  // Initialize startup preset notes matching the melody
  sequencerNotes.bass[0] = "C4";
  sequencerNotes.bass[4] = "Eb4";
  sequencerNotes.bass[8] = "G4";
  sequencerNotes.bass[12] = "Bb4";
  
  sequencerNotes.synth[2] = "C4";
  sequencerNotes.synth[10] = "Eb4";
  
  sequencerNotes.lead[6] = "Bb4";
  sequencerNotes.lead[14] = "C5";
  
  sequencerNotes.acid[1] = "Eb4";
  sequencerNotes.acid[9] = "G4";
  
  renderActiveSequencerSteps();
  initPianoRollDOM();
  
  window.addEventListener("resize", resizeStudioCanvases);
});

// ── HELPER DATA MAPPING ──────────────────────────────────────────────────
function getPadLabel(idx) {
  const labels = [
    "VOCAL PFF", "SPIT KCH", "DENTAL TSS", "TONGUE TKT",
    "DEEP SUB", "ACID ACID", "DRIVE BASS", "FM GROWL",
    "SKY PLUCK", "SPACE GLASS", "NEBULA ARP", "SOLAR GATE",
    "WHITE RISE", "LASER SWEEP", "CRASH DROP", "REC SLOT"
  ];
  return labels[idx] || `STEM ${idx + 1}`;
}

// Visual layout knobs startup sync
function initKnobRotations() {
  document.getElementById("knob-cutoff").style.transform = "rotate(270deg)";
  document.getElementById("knob-resonance").style.transform = "rotate(15deg)";
  document.getElementById("knob-bass").style.transform = "rotate(135deg)";
  document.getElementById("knob-treble").style.transform = "rotate(135deg)";
  document.getElementById("knob-reverb").style.transform = "rotate(40deg)";
  
  document.getElementById("val-cutoff").textContent = "Max";
  document.getElementById("val-resonance").textContent = "Low";
  document.getElementById("val-bass").textContent = "Flat";
  document.getElementById("val-treble").textContent = "Flat";
  document.getElementById("val-reverb").textContent = "15%";
}

// ── WEB AUDIO CONTEXT & MASTER NODE SYNTHS WIRING ────────────────────────
function makeDistortionCurve(amount) {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

// Algorithmic room reverb delay network (Schroeder/Freeverb feedback loop)
function createReverbDelayNetwork() {
  const reverbInput = audioCtx.createGain();
  const reverbOutput = audioCtx.createGain();
  
  // Parallel delay channels with prime times representing diffuse room reflections
  const delayTimes = [0.029, 0.037, 0.043, 0.053];
  const feedbackGains = [0.55, 0.5, 0.45, 0.4];
  
  const merger = audioCtx.createChannelMerger(2);
  
  delayTimes.forEach((delayTime, idx) => {
    const delayNode = audioCtx.createDelay();
    delayNode.delayTime.setValueAtTime(delayTime, audioCtx.currentTime);
    
    const feedback = audioCtx.createGain();
    feedback.gain.setValueAtTime(feedbackGains[idx], audioCtx.currentTime);
    
    const lpFilter = audioCtx.createBiquadFilter();
    lpFilter.type = "lowpass";
    lpFilter.frequency.setValueAtTime(2200, audioCtx.currentTime); // High frequency absorption
    
    reverbInput.connect(delayNode);
    delayNode.connect(lpFilter);
    lpFilter.connect(feedback);
    feedback.connect(delayNode); // Comb filter feedback loop
    
    // stereo split
    if (idx % 2 === 0) {
      lpFilter.connect(merger, 0, 0); // left
    } else {
      lpFilter.connect(merger, 0, 1); // right
    }
  });
  
  merger.connect(reverbOutput);
  
  return {
    input: reverbInput,
    output: reverbOutput
  };
}

function initAudioContext() {
  if (audioCtx) return;
  
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  // Master volume and gain controls
  masterGainNode = audioCtx.createGain();
  masterGainNode.gain.setValueAtTime(SECTIONS.volume, audioCtx.currentTime);
  
  compressorNode = audioCtx.createDynamicsCompressor();
  compressorNode.threshold.setValueAtTime(-18, audioCtx.currentTime);
  compressorNode.knee.setValueAtTime(24, audioCtx.currentTime);
  compressorNode.ratio.setValueAtTime(8, audioCtx.currentTime);
  compressorNode.attack.setValueAtTime(0.005, audioCtx.currentTime);
  compressorNode.release.setValueAtTime(0.18, audioCtx.currentTime);

  // Analogue shaper waveshaper for warmth and compression saturation
  distortionNode = audioCtx.createWaveShaper();
  distortionNode.curve = makeDistortionCurve(25); // Rich overdrive harmonics
  distortionNode.oversample = "4x";
  
  // Filters and EQ setup
  filterLowpass = audioCtx.createBiquadFilter();
  filterLowpass.type = "lowpass";
  filterLowpass.frequency.setValueAtTime(20000, audioCtx.currentTime);
  filterLowpass.Q.setValueAtTime(1.0, audioCtx.currentTime);
  
  filterBassBoost = audioCtx.createBiquadFilter();
  filterBassBoost.type = "lowshelf";
  filterBassBoost.frequency.setValueAtTime(150, audioCtx.currentTime);
  filterBassBoost.gain.setValueAtTime(0, audioCtx.currentTime);
  
  filterTrebleBoost = audioCtx.createBiquadFilter();
  filterTrebleBoost.type = "highshelf";
  filterTrebleBoost.frequency.setValueAtTime(8000, audioCtx.currentTime);
  filterTrebleBoost.gain.setValueAtTime(0, audioCtx.currentTime);
  
  // Algorithmic reverb send connection
  reverbNode = createReverbDelayNetwork();
  
  filterReverbSend = audioCtx.createGain();
  filterReverbSend.gain.setValueAtTime(0.12, audioCtx.currentTime); // default 15% (0.12 wet blend)
  
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 128;
  visualizerBufferLength = analyser.frequencyBinCount;
  visualizerDataArray = new Uint8Array(visualizerBufferLength);
  
  // Multi-Channel Track DSP Mixer Blocks wiring (Individual Panner & Gain strips)
  channelsList.forEach(chan => {
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime); // default vol 80%
    
    const pannerNode = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
    if (pannerNode) {
      pannerNode.pan.setValueAtTime(0.0, audioCtx.currentTime); // center pan
    }
    
    // Wire: source -> gainNode -> pannerNode -> filterLowpass
    if (pannerNode) {
      gainNode.connect(pannerNode);
      pannerNode.connect(filterLowpass);
    } else {
      gainNode.connect(filterLowpass);
    }
    
    trackDSP[chan] = {
      gain: gainNode,
      panner: pannerNode,
      isMuted: false,
      volumeVal: 0.8,
      panVal: 0.0
    };
  });
  
  // Connect Audio DSP Grid
  // Pre-filter Dry splits
  filterLowpass.connect(filterBassBoost);
  
  // Pre-filter Wet reverb splits
  filterLowpass.connect(reverbNode.input);
  reverbNode.output.connect(filterReverbSend);
  filterReverbSend.connect(filterBassBoost);
  
  // Master Output cascade
  filterBassBoost.connect(filterTrebleBoost);
  filterTrebleBoost.connect(masterGainNode);
  masterGainNode.connect(distortionNode);
  distortionNode.connect(compressorNode);
  compressorNode.connect(analyser);
  analyser.connect(audioCtx.destination);

  // Trigger VU and spectrum visuals
  drawVisualizerSpectrum();
}

// ── 8-CHANNEL PROCEDURAL VOCAL BEATBOX & MELODY SYNTHESIS ENGINES ────────

// 🎙️ 1. VOCAL KICK (Plosive human air pop "Pff / Bum")
function playVocalKick(time) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const noise = audioCtx.createBufferSource();
  const noiseGain = audioCtx.createGain();
  
  const destNode = trackDSP["kick"] ? trackDSP["kick"].gain : filterLowpass;
  
  osc.connect(gain);
  gain.connect(destNode);
  
  // Lip air plosive noise burst
  const bufSize = audioCtx.sampleRate * 0.04;
  const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  noise.buffer = buf;
  
  const filterBand = audioCtx.createBiquadFilter();
  filterBand.type = "bandpass";
  filterBand.frequency.setValueAtTime(180, time);
  filterBand.Q.setValueAtTime(3.0, time);
  
  noise.connect(filterBand);
  filterBand.connect(noiseGain);
  noiseGain.connect(destNode);
  
  // Deep sweep sub base body
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);
  
  gain.gain.setValueAtTime(1.6, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
  
  noiseGain.gain.setValueAtTime(0.7, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);
  
  osc.start(time);
  noise.start(time);
  osc.stop(time + 0.22);
  noise.stop(time + 0.05);
}

// 🎙️ 2. SPIT SNARE (Spitting human burst "Kch / Psh")
function playSpitSnare(time) {
  const destNode = trackDSP["snare"] ? trackDSP["snare"].gain : filterLowpass;
  
  // Snappy air spit noise burst through teeth
  const bufSize = audioCtx.sampleRate * 0.22;
  const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  
  const noise = audioCtx.createBufferSource();
  noise.buffer = buf;
  
  const filterBand = audioCtx.createBiquadFilter();
  filterBand.type = "bandpass";
  filterBand.frequency.setValueAtTime(1600, time);
  filterBand.frequency.exponentialRampToValueAtTime(800, time + 0.15);
  filterBand.Q.setValueAtTime(3.5, time);
  
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(1.1, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
  
  noise.connect(filterBand);
  filterBand.connect(noiseGain);
  noiseGain.connect(destNode);
  
  // Vocal cords triangle slap sweep
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(260, time);
  osc.frequency.exponentialRampToValueAtTime(120, time + 0.08);
  
  oscGain.gain.setValueAtTime(0.6, time);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
  
  osc.connect(oscGain);
  oscGain.connect(destNode);
  
  noise.start(time);
  osc.start(time);
  noise.stop(time + 0.24);
  osc.stop(time + 0.12);
}

// 🔔 3. DENTAL HI-HAT (Human dental air friction click "Tss")
function playDentalHat(time) {
  const destNode = trackDSP["hihat"] ? trackDSP["hihat"].gain : filterLowpass;
  
  const bufSize = audioCtx.sampleRate * 0.035;
  const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  
  const noise = audioCtx.createBufferSource();
  noise.buffer = buf;
  
  const filterHigh = audioCtx.createBiquadFilter();
  filterHigh.type = "highpass";
  filterHigh.frequency.setValueAtTime(9500, time);
  
  const filterBand = audioCtx.createBiquadFilter();
  filterBand.type = "bandpass";
  filterBand.frequency.setValueAtTime(12000, time);
  filterBand.Q.setValueAtTime(4.0, time);
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.45, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);
  
  noise.connect(filterHigh);
  filterHigh.connect(filterBand);
  filterBand.connect(gain);
  gain.connect(destNode);
  
  noise.start(time);
  noise.stop(time + 0.04);
}

// 💥 4. TONGUE PERCUSSION (Human tongue click suction pop "Tkt")
function playTongueRim(time) {
  const destNode = trackDSP["perc"] ? trackDSP["perc"].gain : filterLowpass;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(destNode);
  
  // Extremely rapid pitch swept sine wave representing tongue suction release
  osc.type = "sine";
  osc.frequency.setValueAtTime(950, time);
  osc.frequency.exponentialRampToValueAtTime(280, time + 0.007);
  
  gain.gain.setValueAtTime(0.85, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.009);
  
  osc.start(time);
  osc.stop(time + 0.012);
}

// 🎸 5. DEEP MELODIC SUB BASSLINE (Pristine deep bass tune octaves)
function playDAWMelodyBass(step, time) {
  const destNode = trackDSP["bass"] ? trackDSP["bass"].gain : filterLowpass;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  let freq;
  if (sequencerNotes && sequencerNotes.bass && sequencerNotes.bass[step]) {
    const noteName = sequencerNotes.bass[step];
    const noteObj = SYNTH_KEYS_MAP.find(k => k.note === noteName) || SYNTH_KEYS_MAP[0];
    freq = noteObj.freq * 0.25; // 2 octaves down for warm sub-bass
  } else {
    const patterns = DAW_MELODY_PATTERNS[SECTIONS.soundKit] || DAW_MELODY_PATTERNS["acid-techno"];
    freq = patterns.bass[step % patterns.bass.length];
  }
  
  osc.connect(gain);
  gain.connect(destNode);
  
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(freq, time);
  
  // Sub bass sweep filter
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(250, time);
  filter.frequency.exponentialRampToValueAtTime(80, time + 0.18);
  
  osc.disconnect(gain);
  osc.connect(filter);
  filter.connect(gain);
  
  gain.gain.setValueAtTime(0.58, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
  
  osc.start(time);
  osc.stop(time + 0.24);
}

// 🎹 6. LUSH CHORD PROGRESSION PAD (cinematic progressive chords)
function playDAWMelodySynth(step, time) {
  const destNode = trackDSP["synth"] ? trackDSP["synth"].gain : filterLowpass;
  
  let freqs;
  if (sequencerNotes && sequencerNotes.synth && sequencerNotes.synth[step]) {
    const noteName = sequencerNotes.synth[step];
    const noteObj = SYNTH_KEYS_MAP.find(k => k.note === noteName) || SYNTH_KEYS_MAP[0];
    const rootFreq = noteObj.freq * 0.5; // octave shift down
    
    // Construct chord triad dynamically based on root note degree
    if (noteName.startsWith("C")) {
      freqs = [rootFreq, rootFreq * 1.189, rootFreq * 1.498]; // C minor (Eb, G)
    } else if (noteName.startsWith("Eb")) {
      freqs = [rootFreq, rootFreq * 1.26, rootFreq * 1.498]; // Eb major (G, Bb)
    } else if (noteName.startsWith("F")) {
      freqs = [rootFreq, rootFreq * 1.26, rootFreq * 1.498]; // F major (A, C)
    } else if (noteName.startsWith("G")) {
      freqs = [rootFreq, rootFreq * 1.189, rootFreq * 1.498]; // G minor (Bb, D)
    } else if (noteName.startsWith("Bb")) {
      freqs = [rootFreq, rootFreq * 1.26, rootFreq * 1.498]; // Bb major (D, F)
    } else {
      freqs = [rootFreq, rootFreq * 1.2, rootFreq * 1.5]; // default minor chord
    }
  } else {
    const patterns = DAW_MELODY_PATTERNS[SECTIONS.soundKit] || DAW_MELODY_PATTERNS["acid-techno"];
    const chordIndex = Math.floor(step / 4) % patterns.chords.length;
    freqs = patterns.chords[chordIndex];
  }
  
  const masterGain = audioCtx.createGain();
  masterGain.connect(destNode);
  
  freqs.forEach((freq) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0.24, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);
    
    osc.start(time);
    osc.stop(time + 0.38);
  });
  
  masterGain.gain.setValueAtTime(1.0, time);
}

// 🚀 7. SOARING RETRO LEAD (Detuned Supersaws with custom stereo delay sweep)
function playDAWMelodyLead(step, time) {
  const destNode = trackDSP["lead"] ? trackDSP["lead"].gain : filterLowpass;
  
  let freq;
  if (sequencerNotes && sequencerNotes.lead && sequencerNotes.lead[step]) {
    const noteName = sequencerNotes.lead[step];
    const noteObj = SYNTH_KEYS_MAP.find(k => k.note === noteName) || SYNTH_KEYS_MAP[0];
    freq = noteObj.freq; // standard retro octave
  } else {
    const patterns = DAW_MELODY_PATTERNS[SECTIONS.soundKit] || DAW_MELODY_PATTERNS["acid-techno"];
    freq = patterns.lead[step % patterns.lead.length];
  }
  
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3200, time);
  filter.frequency.exponentialRampToValueAtTime(180, time + 0.25);
  filter.Q.setValueAtTime(1.5, time);
  
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(destNode);
  
  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(freq, time);
  
  osc2.type = "sawtooth";
  osc2.frequency.setValueAtTime(freq + 3.0, time); // detuned slightly
  
  gain.gain.setValueAtTime(0.22, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);
  
  // Custom stereo echo delay send
  const delay = audioCtx.createDelay();
  delay.delayTime.setValueAtTime(0.22, time);
  const delayFeedback = audioCtx.createGain();
  delayFeedback.gain.setValueAtTime(0.35, time);
  
  gain.connect(delay);
  delay.connect(delayFeedback);
  delayFeedback.connect(delay);
  delay.connect(destNode);
  
  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + 0.35);
  osc2.stop(time + 0.35);
}

// ⚡ 8. TB-303 RESONANT ACID ARPEGGIATOR (Bubbling retro arpeggio)
function playDAWMelodyAcid(step, time) {
  const destNode = trackDSP["acid"] ? trackDSP["acid"].gain : filterLowpass;
  
  let freq;
  if (sequencerNotes && sequencerNotes.acid && sequencerNotes.acid[step]) {
    const noteName = sequencerNotes.acid[step];
    const noteObj = SYNTH_KEYS_MAP.find(k => k.note === noteName) || SYNTH_KEYS_MAP[0];
    freq = noteObj.freq * 0.5; // low acid register
  } else {
    const patterns = DAW_MELODY_PATTERNS[SECTIONS.soundKit] || DAW_MELODY_PATTERNS["acid-techno"];
    freq = patterns.acid[step % patterns.acid.length];
  }
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2500, time);
  filter.frequency.exponentialRampToValueAtTime(100, time + 0.16);
  filter.Q.setValueAtTime(6.0, time); // High resonant acid Q sweeps!
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(destNode);
  
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(freq, time);
  
  gain.gain.setValueAtTime(0.26, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
  
  osc.start(time);
  osc.stop(time + 0.2);
}

// ── METRONOME WOODBLOCK CLICK SYNTHESIS ──────────────────────────────────
function playMetronomeClick(time) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination); // Direct output routing
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(1600, time);
  
  gain.gain.setValueAtTime(0.15, time); // Subtle volume
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.022);
  
  osc.start(time);
  osc.stop(time + 0.025);
}

// ── STANDARD SYNTHESIS FOR LAUNCHPAD & KEYBOARD ──────────────────────────
// Fat, Punchy Saturated Analog Kick Drum (Launchpad drum backup)
function playKickSynth(time) {
  const oscBody = audioCtx.createOscillator();
  const oscClick = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  oscBody.connect(gain);
  oscClick.connect(gain);
  gain.connect(filterLowpass);
  
  oscBody.type = "sine";
  oscBody.frequency.setValueAtTime(180, time);
  oscBody.frequency.exponentialRampToValueAtTime(45, time + 0.1);
  
  oscClick.type = "sine";
  oscClick.frequency.setValueAtTime(2500, time);
  oscClick.frequency.exponentialRampToValueAtTime(200, time + 0.005);
  
  gain.gain.setValueAtTime(1.2, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
  
  oscBody.start(time);
  oscClick.start(time);
  oscBody.stop(time + 0.18);
  oscClick.stop(time + 0.01);
}

// Crisp, Snappy Dual-Layer Snare Drum (Launchpad snare backup)
function playSnareSynth(time) {
  const bufferSize = audioCtx.sampleRate * 0.18;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;
  
  const filterBandpass = audioCtx.createBiquadFilter();
  filterBandpass.type = "bandpass";
  filterBandpass.frequency.setValueAtTime(1200, time);
  filterBandpass.Q.setValueAtTime(2.0, time);
  
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.8, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
  
  noiseNode.connect(filterBandpass);
  filterBandpass.connect(noiseGain);
  noiseGain.connect(filterLowpass);
  
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(220, time);
  osc.frequency.linearRampToValueAtTime(150, time + 0.08);
  
  oscGain.gain.setValueAtTime(0.4, time);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
  
  osc.connect(oscGain);
  oscGain.connect(filterLowpass);
  
  noiseNode.start(time);
  osc.start(time);
  noiseNode.stop(time + 0.2);
  osc.stop(time + 0.12);
}

// Detuned 6-Oscillator Metallic Hi-Hat (Launchpad hihat backup)
function playHiHatSynth(time) {
  const metalFreqs = [293, 305, 370, 412, 437, 500];
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.35, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
  
  const filterBand = audioCtx.createBiquadFilter();
  filterBand.type = "bandpass";
  filterBand.frequency.setValueAtTime(10000, time);
  filterBand.Q.setValueAtTime(2.5, time);
  
  const filterHigh = audioCtx.createBiquadFilter();
  filterHigh.type = "highpass";
  filterHigh.frequency.setValueAtTime(8000, time);
  
  filterBand.connect(filterHigh);
  filterHigh.connect(gain);
  gain.connect(filterLowpass);
  
  metalFreqs.forEach((freq) => {
    const osc = audioCtx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, time);
    
    osc.connect(filterBand);
    osc.start(time);
    osc.stop(time + 0.05);
  });
}

// Lush Detuned Supersaw Pluck with exponential Filter Sweeps (Piano & Launchpad lead)
function playPluckSynth(freq, time) {
  const oscs = [];
  const detunes = [-4.5, 0, 4.5]; // 3 Detuned voices in cents
  
  const leadGain = audioCtx.createGain();
  
  const filterSweep = audioCtx.createBiquadFilter();
  filterSweep.type = "lowpass";
  filterSweep.frequency.setValueAtTime(4500, time);
  filterSweep.frequency.exponentialRampToValueAtTime(140, time + 0.24);
  filterSweep.Q.setValueAtTime(1.8, time);
  
  detunes.forEach(dt => {
    const osc = audioCtx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);
    osc.detune.setValueAtTime(dt * 10, time);
    
    osc.connect(filterSweep);
    oscs.push(osc);
  });
  
  const subOsc = audioCtx.createOscillator();
  const subGain = audioCtx.createGain();
  subOsc.type = "sine";
  subOsc.frequency.setValueAtTime(freq * 0.5, time);
  
  subGain.gain.setValueAtTime(0.3, time);
  subGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);
  
  subOsc.connect(subGain);
  subGain.connect(filterLowpass);
  
  leadGain.gain.setValueAtTime(0.34, time);
  leadGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);
  
  filterSweep.connect(leadGain);
  leadGain.connect(filterLowpass);
  
  const delayLeft = audioCtx.createDelay();
  const delayRight = audioCtx.createDelay();
  const feedbackLeft = audioCtx.createGain();
  const feedbackRight = audioCtx.createGain();
  
  delayLeft.delayTime.setValueAtTime(0.2, time); 
  delayRight.delayTime.setValueAtTime(0.4, time); 
  
  feedbackLeft.gain.setValueAtTime(0.35, time);
  feedbackRight.gain.setValueAtTime(0.35, time);
  
  const panLeft = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
  const panRight = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
  
  leadGain.connect(delayLeft);
  delayLeft.connect(feedbackLeft);
  feedbackLeft.connect(delayRight); 
  delayRight.connect(feedbackRight);
  feedbackRight.connect(delayLeft); 
  
  if (panLeft && panRight) {
    panLeft.pan.setValueAtTime(-0.8, time); 
    panRight.pan.setValueAtTime(0.8, time);  
    
    delayLeft.connect(panLeft);
    delayRight.connect(panRight);
    
    panLeft.connect(filterLowpass);
    panRight.connect(filterLowpass);
  } else {
    delayLeft.connect(filterLowpass);
    delayRight.connect(filterLowpass);
  }
  
  oscs.forEach(osc => osc.start(time));
  subOsc.start(time);
  
  oscs.forEach(osc => osc.stop(time + 0.38));
  subOsc.stop(time + 0.35);
}

function playMicrophoneTrigger(time) {
  if (!recordedAudioBuffer) return;
  
  const source = audioCtx.createBufferSource();
  source.buffer = recordedAudioBuffer;
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(1.0, time);
  
  source.connect(gain);
  gain.connect(filterLowpass);
  
  source.start(time);
}

function playCustomFileLoop(buffer, time) {
  if (!buffer) return;
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.8, time);
  
  source.connect(gain);
  gain.connect(filterLowpass);
  
  source.start(time);
}

function playFrequenciesSweep(up, time) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(up ? 100 : 1500, time);
  osc.frequency.exponentialRampToValueAtTime(up ? 1500 : 100, time + 0.4);
  
  gain.gain.setValueAtTime(0.12, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);
  
  osc.connect(gain);
  gain.connect(filterLowpass);
  
  osc.start(time);
  osc.stop(time + 0.45);
}

// Hardware button click beeps
function playKeyClickSound() {
  initAudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "triangle";
  osc.frequency.setValueAtTime(800 + Math.random()*250, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.03);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.04);
}

function playSuccessChime() {
  initAudioContext();
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(523.25, t);
  osc.frequency.exponentialRampToValueAtTime(659.25, t + 0.08);
  gain.gain.setValueAtTime(0.05, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.start();
  osc.stop(t + 0.14);
}

function playDeleteAlert() {
  initAudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(160, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(55, audioCtx.currentTime + 0.16);
  gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.19);
}

// ── STEP SEQUENCER CLOCK SCHEDULER ───────────────────────────────────────
function schedulerLoop() {
  while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
    schedule16thNote(current16thNote, nextNoteTime);
    advanceSequencerTimeline();
  }
  schedulerTimer = setTimeout(schedulerLoop, lookaheadInterval);
}

function advanceSequencerTimeline() {
  const secondsPerBeat = 60.0 / SECTIONS.bpm;
  const secondsPerStep = secondsPerBeat / 4.0; 
  
  nextNoteTime += secondsPerStep;
  current16thNote = (current16thNote + 1) % 16;
  currentSequencerTicks++; // absolute step counter increments
}

function schedule16thNote(step, time) {
  // Trigger metronome beeps on beat coordinates (steps 0, 4, 8, 12) if active
  if (step % 4 === 0 && SECTIONS.isMetronomeEnabled) {
    playMetronomeClick(time);
  }

  // Trigger active human vocal beatbox and melodic steps
  if (activeSteps.kick[step]) playVocalKick(time);
  if (activeSteps.snare[step]) playSpitSnare(time);
  if (activeSteps.hihat[step]) playDentalHat(time);
  if (activeSteps.perc[step]) playTongueRim(time);
  
  // Melodic channels play curated pentatonic chord sequences
  if (activeSteps.bass[step]) playDAWMelodyBass(step, time);
  if (activeSteps.synth[step]) playDAWMelodySynth(step, time);
  if (activeSteps.lead[step]) playDAWMelodyLead(step, time);
  if (activeSteps.acid[step]) playDAWMelodyAcid(step, time);

  // Trigger active Launchpad loop stems
  launchpadStems.forEach((pad) => {
    if (!pad.isActive) return;
    
    if (pad.customAudioBuffer) {
      if (step === 0) {
        playCustomFileLoop(pad.customAudioBuffer, time);
      }
      return;
    }
    
    if (pad.type === "drum") {
      if (step % 4 === 0) {
        playKickSynth(time);
        playHiHatSynth(time + 0.1);
      }
      if (step % 4 === 2) {
        playHiHatSynth(time);
      }
    } 
    else if (pad.type === "bass") {
      if (step % 2 === 1) {
        const scale = PENTATONIC_SCALES[SECTIONS.soundKit];
        const freq = scale[pad.id % 4] * 0.5; // low bass register
        playPluckSynth(freq, time);
      }
    }
    else if (pad.type === "lead") {
      if (step % 4 === pad.id % 4) {
        const scale = PENTATONIC_SCALES[SECTIONS.soundKit];
        const freq = scale[(pad.id + step) % scale.length];
        playPluckSynth(freq, time);
      }
    }
    else if (pad.type === "fx") {
      if (step === 0) {
        if (pad.id === 15) {
          playMicrophoneTrigger(time);
        } else {
          playFrequenciesSweep(pad.id % 2 === 0, time);
        }
      }
    }
  });

  // Sync visuals in sync with scheduler time offset
  audioCtx.resume();
  setTimeout(() => {
    renderSequencerPlayheadUI(step);
    renderLcdTimeDisplay();
  }, (time - audioCtx.currentTime) * 1000);
}

// Calculate and render digital time (001 : 01 : 01 style)
function renderLcdTimeDisplay() {
  const totalSteps = currentSequencerTicks;
  
  const bar = Math.floor(totalSteps / 16) + 1;
  const beat = Math.floor((totalSteps % 16) / 4) + 1;
  const step = (totalSteps % 4) + 1;
  
  const barStr = bar.toString().padStart(3, "0");
  const beatStr = beat.toString().padStart(2, "0");
  const stepStr = step.toString().padStart(2, "0");
  
  const lcd = document.getElementById("lcd-time-display");
  if (lcd) {
    lcd.textContent = `${barStr} : ${beatStr} : ${stepStr}`;
  }
}

// ── DOM BUILDERS & UI RENDERERS ──────────────────────────────────────────
function initSequencerDOM() {
  channelsList.forEach(chan => {
    const wrapper = document.getElementById(`steps-${chan}`);
    if (!wrapper) return;
    wrapper.innerHTML = "";
    
    for (let i = 0; i < 16; i++) {
      const step = document.createElement("button");
      step.className = "step-dot";
      step.setAttribute("data-step", i);
      
      step.addEventListener("click", () => {
        toggleSequencerStep(chan, i);
      });
      
      wrapper.appendChild(step);
    }
  });
}

function initLaunchpadDOM() {
  const container = document.getElementById("launchpad-grid");
  container.innerHTML = "";
  
  launchpadStems.forEach((pad) => {
    const element = document.createElement("button");
    element.className = "launchpad-pad";
    element.setAttribute("data-id", pad.id);
    element.setAttribute("data-type", pad.type);
    
    element.innerHTML = `
      <div class="pad-id-tag">${(pad.id + 1).toString().padStart(2, "0")}</div>
      <div class="pad-label">${pad.label}</div>
    `;
    
    element.addEventListener("click", () => {
      toggleLaunchpadPad(pad.id);
    });
    
    // Drag & Drop stem loading handlers
    element.addEventListener("dragover", (e) => {
      e.preventDefault();
      element.style.borderColor = "var(--color-accent)";
      element.style.background = "rgba(var(--color-accent-rgb), 0.08)";
    });

    element.addEventListener("dragleave", () => {
      element.style.borderColor = "";
      element.style.background = "";
    });

    element.addEventListener("drop", (e) => {
      e.preventDefault();
      element.style.borderColor = "";
      element.style.background = "";
      
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("audio/")) {
        loadCustomSampleIntoPad(file, pad.id);
      } else {
        showToastNotification("ERROR: File must be audio format!");
      }
    });

    container.appendChild(element);
  });
}

function loadCustomSampleIntoPad(file, padId) {
  initAudioContext();
  showToastNotification(`DECODING: ${file.name.substring(0, 15)}...`);
  
  const fileReader = new FileReader();
  fileReader.onload = function() {
    audioCtx.decodeAudioData(fileReader.result, (buffer) => {
      const pad = launchpadStems[padId];
      pad.customAudioBuffer = buffer;
      pad.label = "USER CLIP";
      
      initLaunchpadDOM();
      
      playSuccessChime();
      showToastNotification(`LOOP SAMPLE BOUND TO PAD [${padId + 1}]!`);
    }, (err) => {
      console.error("Decode dropped file failed: ", err);
      showToastNotification("ERROR: Decrypting audio failed.");
    });
  };
  fileReader.readAsArrayBuffer(file);
}

function initKeybedDOM() {
  const list = document.getElementById("synth-keys-list");
  list.innerHTML = "";
  
  SYNTH_KEYS_MAP.forEach((item) => {
    const keypad = document.createElement("div");
    const isBlack = item.note.includes("b");
    keypad.className = `synth-key-pad ${isBlack ? "black-key" : ""}`;
    keypad.setAttribute("data-key", item.char);
    
    keypad.innerHTML = `
      <span class="key-char">${item.char}</span>
      <span class="key-note">${item.note}</span>
    `;
    
    if (isBlack) {
      if (item.char === "D") {
        keypad.style.left = "calc(2 * (100% - 8px) / 6 - 15px)";
      } else if (item.char === "H") {
        keypad.style.left = "calc(4 * (100% - 8px) / 6 - 17px)";
      }
    }
    
    // Trigger on click
    keypad.addEventListener("mousedown", () => {
      initAudioContext();
      playPluckSynth(item.freq, audioCtx.currentTime);
      keypad.classList.add("triggered");
    });
    
    keypad.addEventListener("mouseup", () => {
      keypad.classList.remove("triggered");
    });
    
    keypad.addEventListener("mouseleave", () => {
      keypad.classList.remove("triggered");
    });
    
    list.appendChild(keypad);
  });
}

function initPianoRollDOM() {
  const grid = document.getElementById("piano-roll-grid");
  if (!grid) return;
  
  const currentTrack = SECTIONS.currentTrackSelect || "bass";
  const isMelodic = ["bass", "synth", "lead", "acid"].includes(currentTrack);
  
  grid.innerHTML = "";
  
  if (!isMelodic) {
    // Render high quality glassmorphic empty placeholder for drum channels
    grid.innerHTML = `
      <div class="piano-roll-empty-banner">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="neon-text" style="color: var(--color-accent);">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8v4"></path>
          <path d="M12 16h.01"></path>
        </svg>
        <h4 style="color: #ffffff; margin-top: 10px; font-size: 0.8rem; font-weight: 800; font-family: var(--font-raj); letter-spacing: 0.8px;">DRUM CHANNEL: ${currentTrack.toUpperCase()} SELECTED</h4>
        <p style="color: #64748b; font-size: 0.7rem; margin-top: 6px; font-family: var(--font-mono); line-height: 1.4; max-width: 420px;">
          Drums are trigger-only channels. Click a melodic channel (<span class="neon-text" style="color: var(--color-accent); font-weight: 800;">SUB-BASS</span>, <span class="neon-text" style="color: var(--color-accent); font-weight: 800;">CHORD-PAD</span>, <span class="neon-text" style="color: var(--color-accent); font-weight: 800;">RETRO-LEAD</span>, or <span class="neon-text" style="color: var(--color-accent); font-weight: 800;">ACID-303</span>) in the Channel Rack to compose custom notes & tunes in this Piano Roll!
        </p>
      </div>
    `;
    return;
  }
  
  // Custom melody scale: 8 notes (C4, D4, Eb4, F4, G4, Bb4, C5, D5) from highest (D5) to lowest (C4)
  const notesToDraw = [...SYNTH_KEYS_MAP].reverse(); 
  
  notesToDraw.forEach((item) => {
    const row = document.createElement("div");
    row.className = "piano-roll-row";
    
    // Note indicator badge on the left
    const label = document.createElement("div");
    const isBlack = item.note.includes("b");
    label.className = `note-label ${isBlack ? "black-key-label" : ""}`;
    label.textContent = item.note;
    row.appendChild(label);
    
    // Grid cells wrapper on the right
    const cellsContainer = document.createElement("div");
    cellsContainer.className = "piano-roll-cells-container";
    
    for (let stepIdx = 0; stepIdx < 16; stepIdx++) {
      const cell = document.createElement("div");
      cell.className = `piano-roll-cell ${isBlack ? "black-row" : ""}`;
      cell.setAttribute("data-note", item.note);
      cell.setAttribute("data-step", stepIdx);
      
      // Highlight cell if it matches the current active step note in the sequencer
      if (activeSteps[currentTrack][stepIdx] && sequencerNotes[currentTrack][stepIdx] === item.note) {
        cell.classList.add("active");
      }
      
      cell.addEventListener("click", () => {
        initAudioContext();
        const wasActive = cell.classList.contains("active");
        
        if (wasActive) {
          // If they click the exact note that is active, turn this step off
          activeSteps[currentTrack][stepIdx] = false;
        } else {
          // Activate step & assign this row's pitch note
          activeSteps[currentTrack][stepIdx] = true;
          sequencerNotes[currentTrack][stepIdx] = item.note;
          
          // Synthesize pitch preview so they hear what note is placed
          let previewFreq = item.freq;
          if (currentTrack === "bass") previewFreq *= 0.25;
          else if (currentTrack === "acid") previewFreq *= 0.5;
          else if (currentTrack === "synth") previewFreq *= 0.5;
          
          playPluckSynth(previewFreq, audioCtx.currentTime);
        }
        
        // Dynamic double sync re-renders
        initPianoRollDOM();
        renderActiveSequencerSteps();
      });
      
      cellsContainer.appendChild(cell);
    }
    
    row.appendChild(cellsContainer);
    grid.appendChild(row);
  });
}

function renderActiveSequencerSteps() {
  channelsList.forEach(chan => {
    const dots = document.querySelectorAll(`#steps-${chan} .step-dot`);
    dots.forEach((dot, index) => {
      if (activeSteps[chan][index]) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });
  });
}

function toggleSequencerStep(chan, stepIdx) {
  initAudioContext();
  playKeyClickSound();
  
  activeSteps[chan][stepIdx] = !activeSteps[chan][stepIdx];
  renderActiveSequencerSteps();
  initPianoRollDOM(); // Keep Piano Roll grid synced!
}

function toggleLaunchpadPad(padId) {
  initAudioContext();
  
  const pad = launchpadStems[padId];
  pad.isActive = !pad.isActive;
  
  const element = document.querySelector(`.launchpad-pad[data-id="${padId}"]`);
  
  if (pad.isActive) {
    element.classList.add("active");
    playSuccessChime();
    showToastNotification("LOOP ACTIVE: " + pad.label);
  } else {
    element.classList.remove("active");
    playKeyClickSound();
    showToastNotification("LOOP MUTED: " + pad.label);
  }
}

function renderSequencerPlayheadUI(stepIdx) {
  const allSteps = document.querySelectorAll(".step-dot");
  allSteps.forEach(s => s.classList.remove("playhead-active"));
  
  const currentStepDots = document.querySelectorAll(`.step-dot[data-step="${stepIdx}"]`);
  currentStepDots.forEach(s => s.classList.add("playhead-active"));
  
  const container = document.querySelector(".sequencer-channels-container");
  if (!container) return;
  
  const padOffsetPct = (165 / container.clientWidth) * 100; // Offset aligns with 165px lane controls
  const finalLeftPct = padOffsetPct + ((100 - padOffsetPct) * (stepIdx / 16));
  
  container.style.setProperty("--playhead-left", `${finalLeftPct}%`);
  
  const css = `
    .sequencer-channels-container::after {
      left: calc(${finalLeftPct}% + ${stepIdx === 0 ? 0 : 2}px) !important;
    }
  `;
  let styleSheet = document.getElementById("playhead-style");
  if (!styleSheet) {
    styleSheet = document.createElement("style");
    styleSheet.id = "playhead-style";
    document.head.appendChild(styleSheet);
  }
  styleSheet.textContent = css;

  // Highlight active playhead column in the Piano Roll grid cells
  const allRollCells = document.querySelectorAll(".piano-roll-cell");
  allRollCells.forEach(cell => cell.classList.remove("playhead-active"));
  
  const activeRollCells = document.querySelectorAll(`.piano-roll-cell[data-step="${stepIdx}"]`);
  activeRollCells.forEach(cell => cell.classList.add("playhead-active"));
}

// ── PLAYBACK ACTION CONTROLLERS ──────────────────────────────────────────
function toggleSequencerMachine() {
  initAudioContext();
  
  SECTIONS.isPlaying = !SECTIONS.isPlaying;
  const playBtn = document.getElementById("btn-daw-play");
  const stopBtn = document.getElementById("btn-daw-stop");
  const container = document.querySelector(".sequencer-channels-container");
  
  if (SECTIONS.isPlaying) {
    playBtn.classList.add("play-btn-active");
    if (stopBtn) stopBtn.classList.remove("active");
    if (container) container.classList.add("playing");
    
    current16thNote = 0;
    currentSequencerTicks = 0;
    nextNoteTime = audioCtx.currentTime + 0.05;
    schedulerLoop();
    
    playSuccessChime();
    showToastNotification("DAW MELODY SEQUENCER OPERATIONS ACTIVE");
  } else {
    playBtn.classList.remove("play-btn-active");
    if (stopBtn) stopBtn.classList.add("active");
    if (container) container.classList.remove("playing");
    
    clearTimeout(schedulerTimer);
    
    const allSteps = document.querySelectorAll(".step-dot");
    allSteps.forEach(s => s.classList.remove("playhead-active"));
    
    playKeyClickSound();
    showToastNotification("DAW MELODY SEQUENCER OPERATIONS TERMINATED");
  }
}

function loadKitPresetNotes(kitName) {
  // Clear melodic active steps
  ["bass", "synth", "lead", "acid"].forEach(chan => {
    activeSteps[chan].fill(false);
  });
  
  // Set default steps based on kit name
  if (kitName === "acid-techno") {
    activeSteps.bass[0] = true;
    activeSteps.bass[4] = true;
    activeSteps.bass[8] = true;
    activeSteps.bass[12] = true;
    activeSteps.synth[2] = true;
    activeSteps.synth[10] = true;
    activeSteps.lead[6] = true;
    activeSteps.lead[14] = true;
    activeSteps.acid[1] = true;
    activeSteps.acid[9] = true;
    
    // Notes
    sequencerNotes.bass[0] = "C4";
    sequencerNotes.bass[4] = "Eb4";
    sequencerNotes.bass[8] = "G4";
    sequencerNotes.bass[12] = "Bb4";
    
    sequencerNotes.synth[2] = "C4";
    sequencerNotes.synth[10] = "Eb4";
    
    sequencerNotes.lead[6] = "Bb4";
    sequencerNotes.lead[14] = "C5";
    
    sequencerNotes.acid[1] = "Eb4";
    sequencerNotes.acid[9] = "G4";
  } 
  else if (kitName === "lofi-chill") {
    activeSteps.bass[0] = true;
    activeSteps.bass[4] = true;
    activeSteps.bass[8] = true;
    activeSteps.bass[12] = true;
    activeSteps.synth[2] = true;
    activeSteps.synth[10] = true;
    activeSteps.lead[4] = true;
    activeSteps.lead[12] = true;
    activeSteps.acid[2] = true;
    activeSteps.acid[10] = true;
    
    // Notes for Lofi Chill
    sequencerNotes.bass[0] = "C4";
    sequencerNotes.bass[4] = "F4";
    sequencerNotes.bass[8] = "Eb4";
    sequencerNotes.bass[12] = "Bb4";
    
    sequencerNotes.synth[2] = "C4";
    sequencerNotes.synth[10] = "F4";
    
    sequencerNotes.lead[4] = "G4";
    sequencerNotes.lead[12] = "C5";
    
    sequencerNotes.acid[2] = "Eb4";
    sequencerNotes.acid[10] = "Bb4";
  } 
  else if (kitName === "retro-synthwave" || kitName === "retro-synth") {
    activeSteps.bass[0] = true;
    activeSteps.bass[2] = true;
    activeSteps.bass[4] = true;
    activeSteps.bass[6] = true;
    activeSteps.bass[8] = true;
    activeSteps.bass[10] = true;
    activeSteps.bass[12] = true;
    activeSteps.bass[14] = true;
    activeSteps.synth[0] = true;
    activeSteps.synth[8] = true;
    activeSteps.lead[2] = true;
    activeSteps.lead[10] = true;
    activeSteps.acid[4] = true;
    activeSteps.acid[12] = true;
    
    // Notes for Retro Synthwave
    sequencerNotes.bass[0] = "C4";
    sequencerNotes.bass[2] = "C4";
    sequencerNotes.bass[4] = "Eb4";
    sequencerNotes.bass[6] = "Eb4";
    sequencerNotes.bass[8] = "G4";
    sequencerNotes.bass[10] = "G4";
    sequencerNotes.bass[12] = "Bb4";
    sequencerNotes.bass[14] = "Bb4";
    
    sequencerNotes.synth[0] = "C4";
    sequencerNotes.synth[8] = "Eb4";
    
    sequencerNotes.lead[2] = "Bb4";
    sequencerNotes.lead[10] = "C5";
    
    sequencerNotes.acid[4] = "G4";
    sequencerNotes.acid[12] = "Bb4";
  }
}

function clearSequencerGrid() {
  playDeleteAlert();
  
  channelsList.forEach(chan => {
    activeSteps[chan].fill(false);
  });
  
  renderActiveSequencerSteps();
  initPianoRollDOM(); // Keep Piano Roll synced!
  showToastNotification("DAW CHANNELS GRIDS WIPED");
}

// ── EQUALIZER FILTERS & KAOSS XY TOUCHPAD CONTROL CONTROLLER ─────────────
function handleKnobDrag(e) {
  if (activeChannelName && activeChannelParam) {
    initAudioContext();
    const deltaY = knobStartY - e.clientY;
    let nextAngle = knobStartAngle + (deltaY * KNOB_SENSITIVITY);
    if (nextAngle > 270) nextAngle = 270;
    if (nextAngle < 0) nextAngle = 0;
    
    const dial = document.querySelector(`[data-channel="${activeChannelName}"][data-param="${activeChannelParam}"] .channel-knob-dial`);
    if (dial) dial.style.transform = `rotate(${nextAngle}deg)`;
    
    const pct = nextAngle / 270;
    updateChannelDSPNode(activeChannelName, activeChannelParam, pct);
    return;
  }

  if (!activeKnob) return;
  
  initAudioContext();
  
  const deltaY = knobStartY - e.clientY;
  let nextAngle = knobStartAngle + (deltaY * KNOB_SENSITIVITY);
  
  if (nextAngle > 270) nextAngle = 270;
  if (nextAngle < 0) nextAngle = 0;
  
  const dial = document.getElementById(`knob-${activeKnob}`);
  if (dial) dial.style.transform = `rotate(${nextAngle}deg)`;
  
  const pct = nextAngle / 270;
  updateBiquadFilterNode(activeKnob, pct);
  
  if (activeKnob === "cutoff" || activeKnob === "resonance") {
    syncXYCrosshairFromDials();
  }
}

function updateChannelDSPNode(chan, param, percent) {
  if (!trackDSP[chan]) return;
  const dsp = trackDSP[chan];
  
  if (param === "vol") {
    dsp.volumeVal = percent * 1.3; // Max volume 130%
    if (!dsp.isMuted) {
      dsp.gain.gain.setValueAtTime(dsp.volumeVal, audioCtx.currentTime);
    }
  } else if (param === "pan") {
    dsp.panVal = (percent * 2.0) - 1.0; // Pan ranges from -1.0 (Left) to +1.0 (Right)
    if (dsp.panner) {
      dsp.panner.pan.setValueAtTime(dsp.panVal, audioCtx.currentTime);
    }
  }
}

function toggleChannelMute(chan, btn) {
  if (!trackDSP[chan]) return;
  const dsp = trackDSP[chan];
  
  dsp.isMuted = !dsp.isMuted;
  
  if (dsp.isMuted) {
    btn.classList.remove("active"); // LED off
    dsp.gain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    showToastNotification(`CHANNEL MUTED: ${chan.toUpperCase()}`);
  } else {
    btn.classList.add("active"); // LED on
    dsp.gain.gain.setValueAtTime(dsp.volumeVal, audioCtx.currentTime);
    showToastNotification(`CHANNEL UNMUTED: ${chan.toUpperCase()}`);
  }
  playKeyClickSound();
}

function selectMixerChannel(chan, btn) {
  document.querySelectorAll(".channel-select-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  SECTIONS.currentTrackSelect = chan;
  
  // Update Piano Roll header title and grid
  const keybedTitleText = document.getElementById("keybed-title-text");
  if (keybedTitleText) {
    keybedTitleText.textContent = `🎹 SYMPHONY PIANO ROLL (ACTIVE: ${chan.toUpperCase()})`;
  }
  
  initPianoRollDOM(); // re-render grid for new channel!
  
  playKeyClickSound();
  showToastNotification(`CHANNEL CHOSEN: ${chan.toUpperCase()}`);
}

function updateBiquadFilterNode(param, percent) {
  if (!audioCtx) return;
  
  const labelVal = document.getElementById(`val-${param}`);
  
  switch(param) {
    case "cutoff":
      const minHz = 40;
      const maxHz = 20000;
      const freq = Math.round(minHz * Math.pow(maxHz / minHz, percent));
      
      filterLowpass.frequency.setValueAtTime(freq, audioCtx.currentTime);
      if (labelVal) labelVal.textContent = percent > 0.98 ? "Max" : `${freq} Hz`;
      break;
      
    case "resonance":
      const qVal = (percent * 18.0).toFixed(1);
      
      filterLowpass.Q.setValueAtTime(parseFloat(qVal), audioCtx.currentTime);
      if (labelVal) labelVal.textContent = percent < 0.02 ? "Low" : `${qVal}`;
      break;
      
    case "bass":
      const bassGain = Math.round((percent * 24) - 12);
      
      filterBassBoost.gain.setValueAtTime(bassGain, audioCtx.currentTime);
      if (labelVal) labelVal.textContent = bassGain === 0 ? "Flat" : `${bassGain > 0 ? "+" : ""}${bassGain} dB`;
      break;
      
    case "treble":
      const trebleGain = Math.round((percent * 24) - 12);
      
      filterTrebleBoost.gain.setValueAtTime(trebleGain, audioCtx.currentTime);
      if (labelVal) labelVal.textContent = trebleGain === 0 ? "Flat" : `${trebleGain > 0 ? "+" : ""}${trebleGain} dB`;
      break;
      
    case "reverb":
      const reverbPct = Math.round(percent * 100);
      if (filterReverbSend) {
        filterReverbSend.gain.setValueAtTime(percent * 0.7, audioCtx.currentTime); // limit gain factor to 0.7 max to avoid loop ringing
      }
      if (labelVal) labelVal.textContent = reverbPct === 0 ? "Off" : `${reverbPct}%`;
      break;
  }
}

function spawnXYRipple(x, y) {
  const pad = document.getElementById("xy-filter-pad");
  const ripple = document.createElement("div");
  ripple.className = "xy-ripple";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  
  if (pad) pad.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 650);
}

function handleXYTouchDrag(e) {
  if (!isDraggingXY) return;
  
  initAudioContext();
  
  const pad = document.getElementById("xy-filter-pad");
  const rect = pad.getBoundingClientRect();
  
  let clickX = e.clientX - rect.left;
  let clickY = e.clientY - rect.top;
  
  if (clickX < 0) clickX = 0;
  if (clickX > rect.width) clickX = rect.width;
  if (clickY < 0) clickY = 0;
  if (clickY > rect.height) clickY = rect.height;
  
  // Throttle ripple trigger circles
  if (Math.random() < 0.22) {
    spawnXYRipple(clickX, clickY);
  }
  
  const pctX = clickX / rect.width;
  const pctY = 1.0 - (clickY / rect.height); // Invert Y axis
  
  const crosshair = document.getElementById("xy-crosshair");
  if (crosshair) {
    crosshair.style.left = `${pctX * 100}%`;
    crosshair.style.top = `${(1.0 - pctY) * 100}%`;
  }
  
  const cutoffHz = Math.round(40 * Math.pow(20000 / 40, pctX));
  const resVal = (pctY * 18.0).toFixed(1);
  document.getElementById("xy-coords-text").textContent = `F: ${cutoffHz}Hz | Q: ${resVal}`;
  
  filterLowpass.frequency.setValueAtTime(cutoffHz, audioCtx.currentTime);
  filterLowpass.Q.setValueAtTime(parseFloat(resVal), audioCtx.currentTime);
  
  const dialCutoff = document.getElementById("knob-cutoff");
  const dialResonance = document.getElementById("knob-resonance");
  
  if (dialCutoff) dialCutoff.style.transform = `rotate(${pctX * 270}deg)`;
  if (dialResonance) dialResonance.style.transform = `rotate(${pctY * 270}deg)`;
  
  document.getElementById("val-cutoff").textContent = pctX > 0.98 ? "Max" : `${cutoffHz} Hz`;
  document.getElementById("val-resonance").textContent = pctY < 0.02 ? "Low" : `${resVal}`;
}

function syncXYCrosshairFromDials() {
  const dialCutoff = document.getElementById("knob-cutoff").style.transform;
  const dialResonance = document.getElementById("knob-resonance").style.transform;
  
  const matchCutoff = dialCutoff.match(/rotate\(([^deg)]+)deg\)/);
  const matchResonance = dialResonance.match(/rotate\(([^deg)]+)deg\)/);
  
  const angleCutoff = matchCutoff ? parseFloat(matchCutoff[1]) : 270;
  const angleResonance = matchResonance ? parseFloat(matchResonance[1]) : 15;
  
  const pctX = angleCutoff / 270;
  const pctY = angleResonance / 270;
  
  const crosshair = document.getElementById("xy-crosshair");
  if (crosshair) {
    crosshair.style.left = `${pctX * 100}%`;
    crosshair.style.top = `${(1.0 - pctY) * 100}%`;
  }
  
  const cutoffHz = Math.round(40 * Math.pow(20000 / 40, pctX));
  const resVal = (pctY * 18.0).toFixed(1);
  document.getElementById("xy-coords-text").textContent = `F: ${cutoffHz}Hz | Q: ${resVal}`;
}

// ── MICROPHONE SAMPLE RECORDER CONTROLLER ──────────────────────────────
function toggleAudioRecording() {
  initAudioContext();
  
  if (isRecording) {
    stopMicrophoneRecording();
  } else {
    startMicrophoneRecording();
  }
}

function startMicrophoneRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToastNotification("ERROR: Mic stream unsupported by host gateway.");
    return;
  }
  
  isRecording = true;
  recordedAudioChunks = [];
  
  const recDot = document.getElementById("record-pulse");
  const recBtn = document.getElementById("btn-daw-rec");
  const title = document.getElementById("rec-status-title");
  const desc = document.getElementById("rec-status-desc");
  
  if (recDot) recDot.classList.add("recording");
  if (recBtn) recBtn.classList.add("recording");
  if (title) title.textContent = "RECORDING MIC LIVE...";
  if (desc) desc.textContent = "Recording stream audio (max 3s)...";
  
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = e => recordedAudioChunks.push(e.data);
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordedAudioChunks, { type: "audio/ogg; codecs=opus" });
        const fileReader = new FileReader();
        
        fileReader.onload = function() {
          audioCtx.decodeAudioData(fileReader.result, (buffer) => {
            recordedAudioBuffer = buffer;
            showToastNotification("MIC SAMPLE SUCCESSFULLY RENDERED & BOUND! 🎙️");
            
            const pad16 = launchpadStems[15];
            pad16.label = "MIC SAMPLE";
            initLaunchpadDOM();
            
            if (title) title.textContent = "SAMPLE RECORDED";
            if (desc) desc.textContent = "Saved inside Launchpad Slot 16! Press trigger.";
          }, (err) => {
            console.error("Decode audio failed:", err);
            if (title) title.textContent = "ERROR SYNAPSE";
            if (desc) desc.textContent = "Failed decoding microphone signal.";
          });
        };
        
        fileReader.readAsArrayBuffer(audioBlob);
      };
      
      mediaRecorder.start();
      
      // Auto-stop limit recording at 3s
      setTimeout(() => {
        if (isRecording) stopMicrophoneRecording();
      }, 3000);
      
    }).catch(err => {
      console.error("Mic access denied:", err);
      isRecording = false;
      if (recDot) recDot.classList.remove("recording");
      if (recBtn) recBtn.classList.remove("recording");
      if (title) title.textContent = "GATEWAY BLOCKED";
      if (desc) desc.textContent = "Microphone stream permission denied.";
      showToastNotification("ERROR: Mic stream permission blocked.");
    });
}

function stopMicrophoneRecording() {
  if (!isRecording) return;
  isRecording = false;
  
  const recDot = document.getElementById("record-pulse");
  const recBtn = document.getElementById("btn-daw-rec");
  
  if (recDot) recDot.classList.remove("recording");
  if (recBtn) recBtn.classList.remove("recording");
  
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
}

// ── BACKGROUND COSMIC PARTICLES LAYER ───────────────────────────────────
class CosmicNode {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.45;
    this.vy = (Math.random() - 0.5) * 0.45;
    this.baseRadius = Math.random() * 1.5 + 0.6;
  }
  
  draw(volFactor) {
    const activeAccent = getComputedStyle(document.body).getPropertyValue("--color-accent").trim();
    ctxCosmic.fillStyle = activeAccent;
    ctxCosmic.beginPath();
    
    // Scale particle diameter dynamically in sync with audio amplitude
    const currentRadius = this.baseRadius + (volFactor * 10);
    ctxCosmic.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
    ctxCosmic.fill();
    
    // Render dynamic neural connection energy webs if beat is active
    if (volFactor > 0.04) {
      ctxCosmic.strokeStyle = `rgba(${getComputedStyle(document.body).getPropertyValue("--color-accent-rgb")}, ${volFactor * 0.16})`;
      ctxCosmic.lineWidth = volFactor * 1.6;
      cosmicParticles.forEach(other => {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 85 + (volFactor * 50)) {
          ctxCosmic.beginPath();
          ctxCosmic.moveTo(this.x, this.y);
          ctxCosmic.lineTo(other.x, other.y);
          ctxCosmic.stroke();
        }
      });
    }
  }
  
  update(volFactor) {
    // Increase node velocity dynamically in sync with audio force
    const speedBoost = 1.0 + (volFactor * 14.0);
    this.x += this.vx * speedBoost;
    this.y += this.vy * speedBoost;
    
    if (this.x < 0) this.x = canvasCosmic.width;
    if (this.x > canvasCosmic.width) this.x = 0;
    if (this.y < 0) this.y = canvasCosmic.height;
    if (this.y > canvasCosmic.height) this.y = 0;
  }
}

function initCosmicParticles() {
  cosmicParticles = [];
  const qty = 48;
  for (let i = 0; i < qty; i++) {
    cosmicParticles.push(new CosmicNode(Math.random() * canvasCosmic.width, Math.random() * canvasCosmic.height));
  }
}

function drawCosmicAnimation() {
  ctxCosmic.clearRect(0, 0, canvasCosmic.width, canvasCosmic.height);
  
  // Real-time audio analyser tracking factor
  let volFactor = 0;
  if (analyser && audioCtx && audioCtx.state === "running") {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    volFactor = (sum / dataArray.length) / 255.0; // Normalised factor (0.0 to 1.0)
  }
  
  cosmicParticles.forEach(p => {
    p.update(volFactor);
    p.draw(volFactor);
  });
  
  requestAnimationFrame(drawCosmicAnimation);
}

// ── MASTER REAL-TIME MULTI-MODE EQUALIZER VISUALIZER ─────────────────────
function drawVisualizerSpectrum() {
  if (!analyser) return;
  
  requestAnimationFrame(drawVisualizerSpectrum);
  
  ctxVisualizer.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
  
  const accentRGB = getComputedStyle(document.body).getPropertyValue("--color-accent-rgb").trim();
  const accentHex = getComputedStyle(document.body).getPropertyValue("--color-accent").trim();
  
  if (currentVisualizerMode === "bars") {
    // Draw professional Dual-Segment Stereo LED VU Peak Meter!
    analyser.getByteFrequencyData(visualizerDataArray);
    
    // Retrieve Left and Right averages by splitting frequencies
    let leftSum = 0;
    let rightSum = 0;
    const half = Math.floor(visualizerBufferLength / 2);
    for (let i = 0; i < half; i++) leftSum += visualizerDataArray[i];
    for (let i = half; i < visualizerBufferLength; i++) rightSum += visualizerDataArray[i];
    
    const leftAvg = leftSum / half;
    const rightAvg = rightSum / half;
    
    const maxSegments = 16;
    const segmentWidth = 14;
    const segmentHeight = (visualizerCanvas.height / 2) - 8;
    const gap = 3;
    
    const drawVUBars = (yOffset, avgValue) => {
      const activeCount = Math.round((avgValue / 255) * maxSegments);
      
      for (let i = 0; i < maxSegments; i++) {
        const x = i * (segmentWidth + gap) + 16;
        
        let color = "rgba(16, 185, 129, 0.1)"; 
        if (i < activeCount) {
          if (i < 9) color = "#10b981";      // 1-9 green
          else if (i < 13) color = "#eab308"; // 10-13 yellow
          else color = "#ef4444";             // 14-16 red clipping!
        } else {
          if (i < 9) color = "rgba(16, 185, 129, 0.04)";
          else if (i < 13) color = "rgba(234, 179, 8, 0.04)";
          else color = "rgba(239, 68, 68, 0.04)";
        }
        
        ctxVisualizer.fillStyle = color;
        ctxVisualizer.fillRect(x, yOffset, segmentWidth, segmentHeight);
      }
    };
    
    // VU Stereo lettering labels
    ctxVisualizer.font = "bold 9px var(--font-mono)";
    ctxVisualizer.fillStyle = "#64748b";
    ctxVisualizer.fillText("L", 2, 16);
    ctxVisualizer.fillText("R", 2, visualizerCanvas.height - 8);
    
    drawVUBars(4, leftAvg);
    drawVUBars(visualizerCanvas.height / 2 + 2, rightAvg);
  } 
  else if (currentVisualizerMode === "waveform") {
    analyser.getByteTimeDomainData(visualizerDataArray);
    
    ctxVisualizer.strokeStyle = accentHex;
    ctxVisualizer.lineWidth = 3.8;
    ctxVisualizer.shadowBlur = 12;
    ctxVisualizer.shadowColor = accentHex;
    
    ctxVisualizer.beginPath();
    const sliceWidth = visualizerCanvas.width / visualizerBufferLength;
    let x = 0;
    
    for (let i = 0; i < visualizerBufferLength; i++) {
      const v = visualizerDataArray[i] / 128.0;
      const y = (v * visualizerCanvas.height) / 2;
      
      if (i === 0) {
        ctxVisualizer.moveTo(x, y);
      } else {
        ctxVisualizer.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctxVisualizer.stroke();
    ctxVisualizer.shadowBlur = 0;
  }
  else if (currentVisualizerMode === "circle") {
    analyser.getByteFrequencyData(visualizerDataArray);
    
    let sum = 0;
    for(let i=0; i<visualizerBufferLength; i++) {
      sum += visualizerDataArray[i];
    }
    const avg = sum / visualizerBufferLength;
    const radius = 25 + (avg / 255) * 50;
    
    const cX = visualizerCanvas.width / 2;
    const cY = visualizerCanvas.height / 2;
    
    ctxVisualizer.strokeStyle = accentHex;
    ctxVisualizer.lineWidth = 4.5;
    ctxVisualizer.shadowBlur = 15;
    ctxVisualizer.shadowColor = accentHex;
    
    ctxVisualizer.beginPath();
    ctxVisualizer.arc(cX, cY, radius, 0, Math.PI * 2);
    ctxVisualizer.stroke();
    
    ctxVisualizer.strokeStyle = `rgba(${accentRGB}, 0.28)`;
    ctxVisualizer.lineWidth = 1.5;
    ctxVisualizer.shadowBlur = 0;
    ctxVisualizer.beginPath();
    ctxVisualizer.arc(cX, cY, Math.max(5, radius - 12), 0, Math.PI * 2);
    ctxVisualizer.stroke();
  }
}

function toggleVisualizerMode() {
  playKeyClickSound();
  const btn = document.getElementById("btn-toggle-vis-mode");
  
  if (currentVisualizerMode === "bars") {
    currentVisualizerMode = "waveform";
    btn.textContent = "MODE: OSCILLOSCOPE";
    showToastNotification("VISUALIZER MODE: OSCILLOSCOPE");
  } else if (currentVisualizerMode === "waveform") {
    currentVisualizerMode = "circle";
    btn.textContent = "MODE: RADAR SHOCKWAVE";
    showToastNotification("VISUALIZER MODE: CONCENTRIC SHOCKWAVE");
  } else {
    currentVisualizerMode = "bars";
    btn.textContent = "MODE: DAW VU METERS";
    showToastNotification("VISUALIZER MODE: STEREO LED VU METERS");
  }
}

function resizeStudioCanvases() {
  canvasCosmic.width = window.innerWidth;
  canvasCosmic.height = window.innerHeight;
  initCosmicParticles();
  
  const box = visualizerCanvas.parentElement;
  if (box) {
    visualizerCanvas.width = box.clientWidth;
    visualizerCanvas.height = box.clientHeight;
  }
}

// ── BINDINGS & APP EVENT LISTENERS ──────────────────────────────────────
function setupEventListeners() {
  // DAW Toolbar Play / Stop / Record
  document.getElementById("btn-daw-play").addEventListener("click", toggleSequencerMachine);
  const stopBtn = document.getElementById("btn-daw-stop");
  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      if (SECTIONS.isPlaying) toggleSequencerMachine();
    });
  }
  const recBtn = document.getElementById("btn-daw-rec");
  if (recBtn) recBtn.addEventListener("click", toggleAudioRecording);
  
  // Metronome click toggle button
  const metroBtn = document.getElementById("btn-daw-metro");
  if (metroBtn) {
    metroBtn.addEventListener("click", () => {
      SECTIONS.isMetronomeEnabled = !SECTIONS.isMetronomeEnabled;
      if (SECTIONS.isMetronomeEnabled) {
        metroBtn.classList.add("active");
        metroBtn.textContent = "🔔";
        showToastNotification("METRONOME CLICK OPERATIONAL");
      } else {
        metroBtn.classList.remove("active");
        metroBtn.textContent = "🔕";
        showToastNotification("METRONOME CLICK MUTED");
      }
      playKeyClickSound();
    });
  }

  // Track Selector, Mute & Mixing Dials click handles inside the Channel Rack
  const muteBtns = document.querySelectorAll(".channel-mute-btn");
  muteBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      initAudioContext();
      const chan = btn.getAttribute("data-channel");
      toggleChannelMute(chan, btn);
    });
  });

  const selectBtns = document.querySelectorAll(".channel-select-btn");
  selectBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const chan = btn.closest(".sequencer-lane").getAttribute("data-instrument");
      selectMixerChannel(chan, btn);
    });
  });

  const chanKnobs = document.querySelectorAll(".channel-knob-container");
  chanKnobs.forEach(knob => {
    knob.addEventListener("mousedown", (e) => {
      activeChannelName = knob.getAttribute("data-channel");
      activeChannelParam = knob.getAttribute("data-param");
      activeKnob = null; // deactivate master knob
      
      knobStartY = e.clientY;
      
      const dial = knob.querySelector(".channel-knob-dial");
      const transform = dial.style.transform;
      const match = transform.match(/rotate\(([^deg)]+)deg\)/);
      knobStartAngle = match ? parseFloat(match[1]) : 135;
      
      document.body.style.cursor = "ns-resize";
      e.stopPropagation();
    });
  });
  
  // Sequencer Play / Stop backup button
  const seqPlayBtn = document.getElementById("btn-sequencer-play");
  if (seqPlayBtn) seqPlayBtn.addEventListener("click", toggleSequencerMachine);
  
  // Sequencer Clear button
  document.getElementById("btn-sequencer-clear").addEventListener("click", clearSequencerGrid);
  
  // BPM range slider
  const bpmSlider = document.getElementById("bpm-slider");
  const bpmDisplay = document.getElementById("bpm-display");
  bpmSlider.addEventListener("input", (e) => {
    SECTIONS.bpm = parseInt(e.target.value);
    bpmDisplay.textContent = SECTIONS.bpm;
  });

  // Master Volume range slider
  const volSlider = document.getElementById("vol-slider");
  const volDisplay = document.getElementById("vol-display");
  volSlider.addEventListener("input", (e) => {
    SECTIONS.volume = parseFloat(e.target.value) / 100;
    volDisplay.textContent = e.target.value;
    
    if (masterGainNode) {
      masterGainNode.gain.setValueAtTime(SECTIONS.volume, audioCtx.currentTime);
    }
  });

  // Sound kit selector dropdown change
  document.getElementById("sound-kit-select").addEventListener("change", (e) => {
    playSuccessChime();
    SECTIONS.soundKit = e.target.value;
    loadKitPresetNotes(SECTIONS.soundKit); // Load the preset notes for the new kit!
    renderActiveSequencerSteps();
    initPianoRollDOM(); // refresh Piano Roll grid!
    showToastNotification(`INSTRUMENT KIT ROUTED TO: ${SECTIONS.soundKit.replace("-", " ").toUpperCase()}`);
  });

  // Theme change buttons
  const themeBtns = document.querySelectorAll(".theme-btn");
  themeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      themeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const theme = btn.getAttribute("data-theme");
      changeStudioTheme(theme);
    });
  });

  // EQ Knobs Click-Dragging rotations binding
  const knobs = document.querySelectorAll(".eq-knob-container");
  knobs.forEach(knob => {
    knob.addEventListener("mousedown", (e) => {
      activeKnob = knob.getAttribute("data-knob");
      activeChannelName = null;
      
      knobStartY = e.clientY;
      
      const dial = document.getElementById(`knob-${activeKnob}`);
      const transform = dial.style.transform;
      const match = transform.match(/rotate\(([^deg)]+)deg\)/);
      knobStartAngle = match ? parseFloat(match[1]) : 135;
      
      document.body.style.cursor = "ns-resize";
    });
  });

  // XY Kaoss Pad Touch Event Bindings
  const xyPad = document.getElementById("xy-filter-pad");
  xyPad.addEventListener("mousedown", (e) => {
    isDraggingXY = true;
    handleXYTouchDrag(e);
  });

  window.addEventListener("mousemove", (e) => {
    if (isDraggingXY) {
      handleXYTouchDrag(e);
    } else {
      handleKnobDrag(e);
    }
  });

  window.addEventListener("mouseup", () => {
    if (isDraggingXY) {
      isDraggingXY = false;
      playKeyClickSound();
    }
    if (activeKnob || activeChannelName) {
      activeKnob = null;
      activeChannelName = null;
      activeChannelParam = null;
      document.body.style.cursor = "default";
      playKeyClickSound();
    }
  });

  // Visualizer Mode button click
  document.getElementById("btn-toggle-vis-mode").addEventListener("click", toggleVisualizerMode);

  // Keyboard Hotkeys binding for playing the live pentatonic keypad notes
  window.addEventListener("keydown", (e) => {
    const hotkey = e.key.toUpperCase();
    const match = SYNTH_KEYS_MAP.find(item => item.char === hotkey);
    
    if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SELECT") return;

    if (match) {
      initAudioContext();
      if (e.repeat) return;
      
      playPluckSynth(match.freq, audioCtx.currentTime);
      
      const keyEl = document.querySelector(`.synth-key-pad[data-key="${hotkey}"]`);
      if (keyEl) keyEl.classList.add("triggered");
    }
  });

  window.addEventListener("keyup", (e) => {
    const hotkey = e.key.toUpperCase();
    const keyEl = document.querySelector(`.synth-key-pad[data-key="${hotkey}"]`);
    if (keyEl) keyEl.classList.remove("triggered");
  });

  // Tab-switching for Piano Roll vs Live Keyboard
  const tabPianoRoll = document.getElementById("tab-piano-roll");
  const tabLiveKeys = document.getElementById("tab-live-keys");
  const pianoRollContainer = document.getElementById("piano-roll-container");
  const synthKeysList = document.getElementById("synth-keys-list");
  
  if (tabPianoRoll && tabLiveKeys) {
    tabPianoRoll.addEventListener("click", () => {
      tabPianoRoll.classList.add("active");
      tabLiveKeys.classList.remove("active");
      if (pianoRollContainer) pianoRollContainer.classList.remove("hidden");
      if (synthKeysList) synthKeysList.classList.add("hidden");
      playKeyClickSound();
      initPianoRollDOM(); // refresh grid contents
    });
    
    tabLiveKeys.addEventListener("click", () => {
      tabLiveKeys.classList.add("active");
      tabPianoRoll.classList.remove("active");
      if (synthKeysList) synthKeysList.classList.remove("hidden");
      if (pianoRollContainer) pianoRollContainer.classList.add("hidden");
      playKeyClickSound();
    });
  }

  // Trigger cosmic particles animation loop
  drawCosmicAnimation();
}

function changeStudioTheme(themeName) {
  document.body.className = "";
  document.body.classList.add(`theme-${themeName}`);
  SECTIONS.activeTheme = themeName;
  
  playSuccessChime();
  showToastNotification(`ACTIVE SYNAPSE SHIFTED TO: ${themeName.replace("-", " ").toUpperCase()}`);
}

// ── FLOATING TOAST NOTIFICATION POPUPS ───────────────────────────────────
function showToastNotification(msg) {
  let container = document.getElementById("studio-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "studio-toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "studio-toast";
  toast.textContent = `[DAW HUD]: ${msg}`;
  container.appendChild(toast);

  // Animate Entrance
  setTimeout(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
  }, 15);

  // Animate Exit
  setTimeout(() => {
    toast.style.transform = "translateY(-18px)";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}
