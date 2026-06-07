/* ==========================================================================
   JAVASCRIPT CONTROLLER: Spotify Web Player Clone
   ========================================================================== */

// 1. Song Library Playlist (using stable SoundHelix files)
const songs = [
  {
    id: 0,
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: "6:12"
  },
  {
    id: 1,
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    album: "Starboy",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: "7:05"
  },
  {
    id: 2,
    title: "Night Changes",
    artist: "One Direction",
    album: "FOUR",
    cover: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=300&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: "5:44"
  },
  {
    id: 3,
    title: "Shape of You",
    artist: "Ed Sheeran",
    album: "÷ (Divide)",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    duration: "5:02"
  },
  {
    id: 4,
    title: "As It Was",
    artist: "Harry Styles",
    album: "Harry's House",
    cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=300&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    duration: "6:03"
  },
  {
    id: 5,
    title: "Stay",
    artist: "The Kid LAROI & Justin Bieber",
    album: "F*CK LOVE 3: OVER YOU",
    cover: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=300&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    duration: "5:38"
  }
];

// 2. State Variables
let currentTrackIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = 'none'; // 'none', 'one', 'all'
let previousVolume = 0.7;
let currentVolume = 0.7;

// DOM Elements
const audioPlayer = document.getElementById('audio-player');
const greetingGrid = document.getElementById('greeting-grid');
const songsGrid = document.getElementById('songs-grid');
const greetingText = document.getElementById('greeting-text');

// Player controls in footer
const btnPlayPause = document.getElementById('btn-play-pause');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnShuffle = document.getElementById('btn-shuffle');
const btnRepeat = document.getElementById('btn-repeat');

// Track info in footer
const playerCover = document.getElementById('player-cover');
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const playerLikeBtn = document.getElementById('player-like-btn');

// Progress Bar slider
const progressTrack = document.getElementById('progress-track');
const progressFill = document.getElementById('progress-fill');
const progressThumb = document.getElementById('progress-thumb');
const timeElapsed = document.getElementById('time-elapsed');
const trackDuration = document.getElementById('track-duration');

// Volume bar slider
const volumeTrack = document.getElementById('volume-track');
const volumeFill = document.getElementById('volume-fill');
const volumeThumb = document.getElementById('volume-thumb');
const volumeIconBtn = document.getElementById('volume-icon-btn');

// Search Bar
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  updateGreeting();
  renderGreetingGrid();
  renderTrendingGrid();
  loadTrack(currentTrackIndex);
  setupEventListeners();
  setVolume(currentVolume);
});

// 3. Dynamic layout generation
function updateGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    greetingText.innerText = "Good Morning";
  } else if (hour < 18) {
    greetingText.innerText = "Good Afternoon";
  } else {
    greetingText.innerText = "Good Evening";
  }
}

function renderGreetingGrid() {
  if (!greetingGrid) return;
  greetingGrid.innerHTML = '';
  
  // Render up to 6 tiles
  const limit = Math.min(6, songs.length);
  for (let i = 0; i < limit; i++) {
    const song = songs[i];
    const tile = document.createElement('div');
    tile.className = 'tile-card';
    tile.onclick = () => playSpecificTrack(song.id);
    
    tile.innerHTML = `
      <img src="${song.cover}" alt="${song.title} Cover" class="tile-img">
      <div class="tile-content">
        <span class="tile-title">${song.title}</span>
        <button class="tile-play-btn" aria-label="Play ${song.title}">
          <i class="fa-solid fa-play"></i>
        </button>
      </div>
    `;
    greetingGrid.appendChild(tile);
  }
}

function renderTrendingGrid() {
  if (!songsGrid) return;
  songsGrid.innerHTML = '';
  
  songs.forEach(song => {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.onclick = () => playSpecificTrack(song.id);
    
    card.innerHTML = `
      <div class="card-img-container">
        <img src="${song.cover}" alt="${song.title} Album Cover" class="card-img">
        <button class="card-play-btn" aria-label="Play ${song.title}">
          <i class="fa-solid fa-play"></i>
        </button>
      </div>
      <h3 class="song-title">${song.title}</h3>
      <p class="song-desc">${song.artist} • ${song.album}</p>
    `;
    songsGrid.appendChild(card);
  });
}

// 4. Playback Logic
function loadTrack(index) {
  const song = songs[index];
  if (!song) return;
  
  audioPlayer.src = song.url;
  audioPlayer.load();
  
  // Update footer UI
  playerCover.src = song.cover;
  playerTitle.innerText = song.title;
  playerArtist.innerText = song.artist;
  trackDuration.innerText = song.duration;
  timeElapsed.innerText = "0:00";
  progressFill.style.width = '0%';
  progressThumb.style.left = '0%';
  
  // Reset like button visually
  playerLikeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
  playerLikeBtn.classList.remove('liked');
}

function playTrack() {
  isPlaying = true;
  audioPlayer.play()
    .then(() => {
      btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
      btnPlayPause.title = "Pause";
    })
    .catch(err => {
      console.warn("Autoplay block or source failed:", err);
      isPlaying = false;
    });
}

function pauseTrack() {
  isPlaying = false;
  audioPlayer.pause();
  btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
  btnPlayPause.title = "Play";
}

function togglePlayPause() {
  if (isPlaying) {
    pauseTrack();
  } else {
    playTrack();
  }
}

function playSpecificTrack(id) {
  const index = songs.findIndex(s => s.id === id);
  if (index !== -1) {
    currentTrackIndex = index;
    loadTrack(currentTrackIndex);
    playTrack();
  }
}

function playNextTrack() {
  if (isShuffle) {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * songs.length);
    } while (newIndex === currentTrackIndex && songs.length > 1);
    currentTrackIndex = newIndex;
  } else {
    currentTrackIndex = (currentTrackIndex + 1) % songs.length;
  }
  loadTrack(currentTrackIndex);
  playTrack();
}

function playPrevTrack() {
  // If song played more than 3 seconds, reset to beginning
  if (audioPlayer.currentTime > 3) {
    audioPlayer.currentTime = 0;
  } else {
    currentTrackIndex = (currentTrackIndex - 1 + songs.length) % songs.length;
    loadTrack(currentTrackIndex);
  }
  playTrack();
}

// 5. Volume Adjustments
function setVolume(val) {
  currentVolume = val;
  audioPlayer.volume = val;
  
  // Update Slider fill & thumb
  const percentage = val * 100;
  volumeFill.style.width = `${percentage}%`;
  volumeThumb.style.left = `${percentage}%`;
  
  // Update volume icon
  if (val === 0) {
    volumeIconBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
  } else if (val < 0.35) {
    volumeIconBtn.innerHTML = '<i class="fa-solid fa-volume-off"></i>';
  } else if (val < 0.7) {
    volumeIconBtn.innerHTML = '<i class="fa-solid fa-volume-low"></i>';
  } else {
    volumeIconBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
  }
}

function toggleMute() {
  if (currentVolume > 0) {
    previousVolume = currentVolume;
    setVolume(0);
  } else {
    setVolume(previousVolume);
  }
}

// 6. Navigation Tabs Switcher
window.switchTab = function(tabName) {
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => item.classList.remove('active'));
  
  const searchBar = document.getElementById('header-search-bar');
  const activeTab = document.getElementById(`tab-${tabName}`);
  if (activeTab) activeTab.classList.add('active');

  // Handle Search Input display
  if (tabName === 'search') {
    searchBar.classList.add('visible');
    searchInput.focus();
  } else {
    searchBar.classList.remove('visible');
  }
};

// 7. Search Filtering
window.handleSearch = function(query) {
  const filterVal = query.toLowerCase().trim();
  
  if (filterVal !== '') {
    clearSearchBtn.style.display = 'flex';
  } else {
    clearSearchBtn.style.display = 'none';
  }

  const cards = document.querySelectorAll('.song-card');
  let matchCount = 0;
  
  cards.forEach(card => {
    const title = card.querySelector('.song-title').innerText.toLowerCase();
    const desc = card.querySelector('.song-desc').innerText.toLowerCase();
    
    if (title.includes(filterVal) || desc.includes(filterVal)) {
      card.style.display = 'block';
      matchCount++;
    } else {
      card.style.display = 'none';
    }
  });

  // Dynamically show greeting based on filter results
  if (matchCount === 0) {
    document.getElementById('trending-section').querySelector('h2').innerText = "No Tracks Found";
  } else {
    document.getElementById('trending-section').querySelector('h2').innerText = "Trending Tracks";
  }
};

window.clearSearch = function() {
  searchInput.value = '';
  clearSearchBtn.style.display = 'none';
  handleSearch('');
  searchInput.focus();
};

// 8. Event Listeners Setup
function setupEventListeners() {
  // Play/Pause button
  btnPlayPause.addEventListener('click', togglePlayPause);
  
  // Previous/Next
  btnPrev.addEventListener('click', playPrevTrack);
  btnNext.addEventListener('click', playNextTrack);
  
  // Shuffle
  btnShuffle.addEventListener('click', () => {
    isShuffle = !isShuffle;
    btnShuffle.classList.toggle('active', isShuffle);
  });
  
  // Repeat
  btnRepeat.addEventListener('click', () => {
    if (isRepeat === 'none') {
      isRepeat = 'all';
      btnRepeat.classList.add('active');
      btnRepeat.querySelector('i').className = 'fa-solid fa-repeat';
      btnRepeat.title = "Repeat All";
    } else if (isRepeat === 'all') {
      isRepeat = 'one';
      btnRepeat.classList.add('active');
      btnRepeat.querySelector('i').className = 'fa-solid fa-repeat';
      btnRepeat.title = "Repeat One";
      
      // Add a tiny '1' badge overlay to repeat icon to match real Spotify
      btnRepeat.style.position = 'relative';
      let badge = btnRepeat.querySelector('.repeat-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'repeat-badge';
        badge.innerText = '1';
        badge.style.fontSize = '8px';
        badge.style.position = 'absolute';
        badge.style.top = '-2px';
        badge.style.right = '-2px';
        badge.style.background = 'var(--sp-green)';
        badge.style.color = 'black';
        badge.style.borderRadius = '50%';
        badge.style.width = '10px';
        badge.style.height = '10px';
        badge.style.display = 'flex';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        btnRepeat.appendChild(badge);
      }
    } else {
      isRepeat = 'none';
      btnRepeat.classList.remove('active');
      btnRepeat.title = "Enable Repeat";
      const badge = btnRepeat.querySelector('.repeat-badge');
      if (badge) badge.remove();
    }
  });

  // Track ended event
  audioPlayer.addEventListener('ended', () => {
    if (isRepeat === 'one') {
      audioPlayer.currentTime = 0;
      playTrack();
    } else {
      playNextTrack();
    }
  });

  // Audio update time (progress slider)
  audioPlayer.addEventListener('timeupdate', () => {
    if (!audioPlayer.duration) return;
    
    const elapsed = audioPlayer.currentTime;
    const duration = audioPlayer.duration;
    
    // Update elapsed time text
    timeElapsed.innerText = formatTime(elapsed);
    
    // Update fill width & thumb position
    const percentage = (elapsed / duration) * 100;
    progressFill.style.width = `${percentage}%`;
    progressThumb.style.left = `${percentage}%`;
  });

  // Loaded metadata duration
  audioPlayer.addEventListener('loadedmetadata', () => {
    trackDuration.innerText = formatTime(audioPlayer.duration);
  });

  // Progress bar seek click
  progressTrack.addEventListener('click', (e) => {
    const rect = progressTrack.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const pct = clickX / width;
    if (audioPlayer.duration) {
      audioPlayer.currentTime = pct * audioPlayer.duration;
    }
  });

  // Volume slider click
  volumeTrack.addEventListener('click', (e) => {
    const rect = volumeTrack.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const pct = Math.max(0, Math.min(1, clickX / width));
    setVolume(pct);
  });

  // Volume icon button mute toggle
  volumeIconBtn.addEventListener('click', toggleMute);

  // Like Button toggle
  playerLikeBtn.addEventListener('click', () => {
    const isLiked = playerLikeBtn.classList.contains('liked');
    if (isLiked) {
      playerLikeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
      playerLikeBtn.classList.remove('liked');
    } else {
      playerLikeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
      playerLikeBtn.classList.add('liked');
    }
  });
}

// 9. Time Formatter Helper (seconds -> MM:SS)
function formatTime(secs) {
  if (isNaN(secs)) return "0:00";
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
