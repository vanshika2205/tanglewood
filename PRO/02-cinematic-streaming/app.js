/* ==========================================================================
   🎬 CINEMA HUB: AUDIO-VISUAL CONTROLLER & DATA STATE ENGINE
   ========================================================================== */

// ── MOVIES & TRAILERS DATABASE ───────────────────────────────────────────
const MOVIES = [
  {
    id: "cosmic-horizon",
    title: "Cosmic Horizon",
    category: "hits",
    year: 2026,
    duration: "45m",
    rating: 4.9,
    synopsis: "An immersive stellar journey into the deepest orbits of the galactic framework. Experience weightless visual peaks and floating atmospheric nebulas in direct cinema audio, designed to showcase advanced color depth and motion graphics.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "neon-cyberwave",
    title: "Neon Cyberwave",
    category: "hits",
    year: 2025,
    duration: "1h 12m",
    rating: 4.8,
    synopsis: "Pulsing cybernetic synthways taking you through the dynamic neon-lit city grid. Watch chrome reflections and metallic hovercars glide smoothly through futuristic cyber tunnels, accompanied by premium high-bass lo-fi audio tracks.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-neon-city-at-night-42231-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "deep-oceans",
    title: "Deep Oceans",
    category: "ambient",
    year: 2026,
    duration: "30m",
    rating: 4.7,
    synopsis: "A relaxing deep-dive into the tranquil light beams of the under-reef soundscape. Float silently alongside soft current shifts, colorful marine life, and ambient oceanic waves that dissolve work-day fatigue instantly.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-underwater-light-beams-in-deep-ocean-41901-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "cozy-fireplace",
    title: "Cozy Fireplace",
    category: "ambient",
    year: 2024,
    duration: "2h 0m",
    rating: 4.9,
    synopsis: "The ultimate relaxing lounge asset. Cozy crackling wooden logs burning in gold-sunset tones, delivering a warm fireside atmosphere that fits perfectly as a calm background dashboard overlay for study and sleep.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-cozy-fireplace-at-night-with-crackling-fire-41908-large.mp4",
    coverUrl: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=600&auto=format&fit=crop"
  }
];

// Mock default community reviews
const DEFAULT_REVIEWS = {
  "cosmic-horizon": [
    { user: "Rohan_A", rating: 5, comment: "Absolutely breathtaking! The visual chimes and color depths are top-tier." },
    { user: "Sneha_V", rating: 4, comment: "Lush ambient space. Best thing to stream in the background while studying." }
  ],
  "neon-cyberwave": [
    { user: "CyberGamer", rating: 5, comment: "Pure synthwave retro vibe. That city tunnel looks stunning!" }
  ]
};

// ── STATE MANAGEMENT ─────────────────────────────────────────────────────
let myList = [];
let currentMovie = null;

// ── DOM ELEMENTS ─────────────────────────────────────────────────────────
const navHome = document.getElementById("nav-btn-home");
const navMyList = document.getElementById("nav-btn-mylist");
const panelHome = document.getElementById("panel-home");
const panelMyList = document.getElementById("panel-mylist");
const mylistBadge = document.getElementById("mylist-badge-count");
const mylistGrid = document.getElementById("mylist-grid");
const mylistEmptyState = document.getElementById("mylist-empty-state");

// Billboard
const billboard = document.getElementById("hero-billboard");
const heroVideoBg = document.getElementById("hero-video-bg");
const heroTitle = document.getElementById("hero-title");
const heroDesc = document.getElementById("hero-desc");
const btnHeroPlay = document.getElementById("btn-hero-play");
const btnHeroMyList = document.getElementById("btn-hero-mylist");

// Carousels
const carouselHits = document.getElementById("carousel-hits");
const carouselAmbient = document.getElementById("carousel-ambient");

// Modal Elements
const modal = document.getElementById("movie-modal");
const closeModalBtn = document.getElementById("btn-close-modal");
const modalVideo = document.getElementById("modal-video-player");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-desc");
const modalYear = document.getElementById("modal-year");
const modalDuration = document.getElementById("modal-duration");

// Custom Video Player controls
const playerPlayBtn = document.getElementById("btn-player-play");
const svgPlay = document.getElementById("svg-player-play");
const svgPause = document.getElementById("svg-player-pause");
const playerMuteBtn = document.getElementById("btn-player-mute");
const svgVolHigh = document.getElementById("svg-player-vol-high");
const svgVolMuted = document.getElementById("svg-player-vol-muted");
const playerFsBtn = document.getElementById("btn-player-fs");
const playerProgressTrack = document.getElementById("player-progress-track");
const playerProgressFill = document.getElementById("player-progress-fill");
const playerTimeDisplay = document.getElementById("player-time-display");

// Star rating / reviews
const ratingStars = document.querySelectorAll(".rating-star");
const avgRatingLabel = document.getElementById("average-rating-label");
const reviewsScroller = document.getElementById("reviews-scroller");
const reviewForm = document.getElementById("review-form");
const reviewInput = document.getElementById("review-input");

// Search bar
const movieSearchInput = document.getElementById("movie-search");

// ── INITIALIZATION ───────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  loadMyListFromStorage();
  populateCarousels();
  setupBillboard(MOVIES[0]);
  setupEventListeners();
  updateMyListBadge();
});

// ── SAVED MY LIST CONTROLLER ─────────────────────────────────────────────
function loadMyListFromStorage() {
  const saved = localStorage.getItem("cinema_mylist");
  if (saved) {
    myList = JSON.parse(saved);
  }
}

function saveMyListToStorage() {
  localStorage.setItem("cinema_mylist", JSON.stringify(myList));
  updateMyListBadge();
}

function updateMyListBadge() {
  mylistBadge.textContent = myList.length;
  mylistBadge.style.transform = "scale(1.2)";
  setTimeout(() => mylistBadge.style.transform = "scale(1)", 200);
}

function toggleMyList(movieId) {
  const idx = myList.indexOf(movieId);
  if (idx > -1) {
    myList.splice(idx, 1); // remove
    showToastNotification("Removed from My List");
  } else {
    myList.push(movieId); // add
    showToastNotification("Added to My List!");
  }
  saveMyListToStorage();
  updateMyListUI();
  populateMyListGrid();
}

// ── UI RENDER ENGINES ────────────────────────────────────────────────────
function populateCarousels() {
  carouselHits.innerHTML = "";
  carouselAmbient.innerHTML = "";

  MOVIES.forEach(movie => {
    const card = document.createElement("div");
    card.classList.add("movie-card");
    card.setAttribute("data-id", movie.id);
    card.innerHTML = `
      <img src="${movie.coverUrl}" alt="${movie.title}">
      <div class="movie-card-overlay">
        <div class="movie-card-title">${movie.title}</div>
        <div class="movie-card-meta">
          <span class="movie-card-rating">★ ${movie.rating}</span>
          <span>•</span>
          <span>${movie.duration}</span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => openModal(movie));

    if (movie.category === "hits") {
      carouselHits.appendChild(card);
    } else {
      carouselAmbient.appendChild(card);
    }
  });
}

function populateMyListGrid() {
  const grid = document.getElementById("mylist-grid");
  // Clean dynamic cards (leave empty state element)
  const cards = grid.querySelectorAll(".movie-card");
  cards.forEach(c => c.remove());

  if (myList.length === 0) {
    mylistEmptyState.classList.remove("hidden");
    return;
  }

  mylistEmptyState.classList.add("hidden");

  myList.forEach(id => {
    const movie = MOVIES.find(m => m.id === id);
    if (!movie) return;

    const card = document.createElement("div");
    card.classList.add("movie-card");
    card.setAttribute("data-id", movie.id);
    card.innerHTML = `
      <img src="${movie.coverUrl}" alt="${movie.title}">
      <div class="movie-card-overlay">
        <div class="movie-card-title">${movie.title}</div>
        <div class="movie-card-meta">
          <span class="movie-card-rating">★ ${movie.rating}</span>
          <span>•</span>
          <span>${movie.duration}</span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => openModal(movie));
    grid.appendChild(card);
  });
}

function updateMyListUI() {
  if (!currentMovie) return;
  const inList = myList.includes(currentMovie.id);
  
  // Update Billboard List Button
  if (currentMovie.id === MOVIES[0].id) {
    btnHeroMyList.querySelector("span").textContent = inList ? "Remove List" : "My List";
  }
}

// ── BILLBOARD MAIN BANNER CONTROLLER ─────────────────────────────────────
function setupBillboard(movie) {
  heroTitle.textContent = movie.title;
  heroDesc.textContent = movie.synopsis;

  // Load and play silent video loop in background of main billboard
  heroVideoBg.src = movie.videoUrl;
  heroVideoBg.load();
  heroVideoBg.play().catch(err => console.warn("Billboard background autoplay blocked:", err));

  btnHeroPlay.onclick = () => openModal(movie);
  btnHeroMyList.onclick = () => toggleMyList(movie.id);

  updateMyListUI();
}

// ── MODAL MOVIE CONTAINER WINDOW ─────────────────────────────────────────
function openModal(movie) {
  currentMovie = movie;
  
  // Pause billboard background
  heroVideoBg.pause();

  // Populate Details
  modalTitle.textContent = movie.title;
  modalDesc.textContent = movie.synopsis;
  modalYear.textContent = movie.year;
  modalDuration.textContent = movie.duration;

  // Set Player source
  modalVideo.src = movie.videoUrl;
  modalVideo.load();

  // Show Modal
  modal.classList.add("open");

  // Play automatically inside modal trigger gesture
  playVideoPlayer();

  // Load Ratings and Reviews from Storage
  loadReviewsAndRatings(movie.id);

  updateMyListUI();
}

function closeModal() {
  modal.classList.remove("open");
  pauseVideoPlayer();
  modalVideo.removeAttribute("src"); // Clear memory streams

  // Resume billboard
  heroVideoBg.play().catch(() => {});
}

// ── CUSTOM VIDEO PLAYER CONTROLS HUB ─────────────────────────────────────
function playVideoPlayer() {
  modalVideo.play().catch(err => console.error("Modal player blocked: ", err));
  svgPlay.classList.add("hidden");
  svgPause.classList.remove("hidden");
}

function pauseVideoPlayer() {
  modalVideo.pause();
  svgPlay.classList.remove("hidden");
  svgPause.classList.add("hidden");
}

function togglePlay() {
  if (modalVideo.paused) {
    playVideoPlayer();
  } else {
    pauseVideoPlayer();
  }
}

function toggleMute() {
  if (modalVideo.muted) {
    modalVideo.muted = false;
    svgVolHigh.classList.remove("hidden");
    svgVolMuted.classList.add("hidden");
  } else {
    modalVideo.muted = true;
    svgVolHigh.classList.add("hidden");
    svgVolMuted.classList.remove("hidden");
  }
}

function updateProgressTrack() {
  if (isNaN(modalVideo.duration)) return;
  const pct = (modalVideo.currentTime / modalVideo.duration) * 100;
  playerProgressFill.style.width = `${pct}%`;

  // Time format
  playerTimeDisplay.textContent = `${formatTime(modalVideo.currentTime)} / ${formatTime(modalVideo.duration)}`;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

// Seekbar jump clicks
playerProgressTrack.addEventListener("click", (e) => {
  if (isNaN(modalVideo.duration)) return;
  const trackWidth = playerProgressTrack.clientWidth;
  const clickX = e.offsetX;
  const jumpPct = clickX / trackWidth;
  modalVideo.currentTime = jumpPct * modalVideo.duration;
});

// Fullscreen toggle
playerFsBtn.onclick = () => {
  if (modalVideo.requestFullscreen) {
    modalVideo.requestFullscreen();
  } else if (modalVideo.webkitRequestFullscreen) {
    modalVideo.webkitRequestFullscreen(); // Safari support
  }
};

// ── COMMUNITY REVIEWS & STAR RATING ENGINE ──────────────────────────────
function loadReviewsAndRatings(movieId) {
  // Retrieve saved reviews or fallback to defaults
  let reviews = JSON.parse(localStorage.getItem(`reviews_${movieId}`));
  if (!reviews) {
    reviews = DEFAULT_REVIEWS[movieId] || [];
    localStorage.setItem(`reviews_${movieId}`, JSON.stringify(reviews));
  }

  // Retrieve saved user rating
  const userRating = localStorage.getItem(`rating_${movieId}`) || 0;
  highlightStars(parseInt(userRating));

  // Render Reviews list
  renderReviewsList(reviews);

  // Update Average rating label
  updateAverageRatingLabel(movieId, reviews);
}

function renderReviewsList(reviews) {
  reviewsScroller.innerHTML = "";
  if (reviews.length === 0) {
    reviewsScroller.innerHTML = `<div class="review-item-text" style="color: var(--text-muted); font-style: italic;">Be the first to share your thoughts on this Cinema!</div>`;
    return;
  }

  reviews.forEach(rev => {
    const item = document.createElement("div");
    item.classList.add("review-item");
    item.innerHTML = `
      <div class="review-item-header">
        <span class="review-item-user">@ ${rev.user}</span>
        <span style="color: var(--gold-accent);">★ ${rev.rating || 5} / 5</span>
      </div>
      <div class="review-item-text">${rev.comment}</div>
    `;
    reviewsScroller.appendChild(item);
  });

  // Scroll to bottom
  reviewsScroller.scrollTop = reviewsScroller.scrollHeight;
}

function highlightStars(rating) {
  ratingStars.forEach(star => {
    const starRating = parseInt(star.getAttribute("data-rating"));
    if (starRating <= rating) {
      star.classList.add("selected");
    } else {
      star.classList.remove("selected");
    }
  });
}

function submitUserRating(rating) {
  if (!currentMovie) return;
  
  // Save to storage
  localStorage.setItem(`rating_${currentMovie.id}`, rating);
  highlightStars(rating);
  showToastNotification(`You rated this: ${rating} Stars!`);

  // Refresh reviews metadata
  let reviews = JSON.parse(localStorage.getItem(`reviews_${currentMovie.id}`)) || [];
  updateAverageRatingLabel(currentMovie.id, reviews);
}

function updateAverageRatingLabel(movieId, reviews) {
  const userRating = parseInt(localStorage.getItem(`rating_${movieId}`)) || 0;
  
  let totalRating = userRating;
  let count = userRating > 0 ? 1 : 0;

  reviews.forEach(r => {
    totalRating += r.rating || 5;
    count++;
  });

  if (count === 0) {
    avgRatingLabel.textContent = "Avg: N/A";
    return;
  }

  const avg = (totalRating / count).toFixed(1);
  avgRatingLabel.textContent = `Avg: ${avg} / 5 (${count} Votes)`;
}

// Submit a text review
reviewForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentMovie) return;

  const text = reviewInput.value.trim();
  if (!text) return;

  const userRating = parseInt(localStorage.getItem(`rating_${currentMovie.id}`)) || 5;
  let reviews = JSON.parse(localStorage.getItem(`reviews_${currentMovie.id}`)) || [];

  // Add new review object
  const newRev = {
    user: "You (Vanshika)",
    rating: userRating,
    comment: text
  };

  reviews.push(newRev);
  localStorage.setItem(`reviews_${currentMovie.id}`, JSON.stringify(reviews));

  renderReviewsList(reviews);
  updateAverageRatingLabel(currentMovie.id, reviews);
  
  reviewInput.value = "";
  showToastNotification("Review submitted!");
});

// ── BINDINGS & SCREEN TAB SWITCHES ───────────────────────────────────────
function setupEventListeners() {
  // Screen Tabs switching
  navHome.addEventListener("click", () => {
    navHome.classList.add("active");
    navMyList.classList.remove("active");
    panelHome.classList.add("active");
    panelMyList.classList.remove("active");
  });

  navMyList.addEventListener("click", () => {
    navMyList.classList.add("active");
    navHome.classList.remove("active");
    panelMyList.classList.add("active");
    panelHome.classList.remove("active");
    populateMyListGrid(); // Populate Saved list dynamically
  });

  // Modal controls
  closeModalBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Custom Video Player events
  playerPlayBtn.addEventListener("click", togglePlay);
  modalVideo.addEventListener("click", togglePlay);
  playerMuteBtn.addEventListener("click", toggleMute);
  modalVideo.addEventListener("timeupdate", updateProgressTrack);

  // Rating Stars clicks
  ratingStars.forEach(star => {
    star.addEventListener("click", () => {
      const rating = parseInt(star.getAttribute("data-rating"));
      submitUserRating(rating);
    });
  });

  // Live search input filtering
  movieSearchInput.addEventListener("input", performMovieSearchFilter);
}

// ── FILTER SEARCH ENGINE ─────────────────────────────────────────────────
function performMovieSearchFilter(e) {
  const query = e.target.value.toLowerCase().trim();
  const allCards = document.querySelectorAll(".movie-carousel .movie-card");

  allCards.forEach(card => {
    const movieId = card.getAttribute("data-id");
    const movie = MOVIES.find(m => m.id === movieId);
    if (!movie) return;

    const matchesTitle = movie.title.toLowerCase().includes(query);
    const matchesDesc = movie.synopsis.toLowerCase().includes(query);
    const matchesCategory = movie.category.toLowerCase().includes(query);

    if (matchesTitle || matchesDesc || matchesCategory || query === "") {
      card.style.display = "block";
      card.style.opacity = "1";
    } else {
      card.style.display = "none";
      card.style.opacity = "0";
    }
  });
}

// ── SLIDING DYNAMIC TOAST POPUPS ─────────────────────────────────────────
function showToastNotification(msg) {
  let container = document.getElementById("cinema-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "cinema-toast-container";
    container.style.cssText = `
      position: fixed;
      bottom: 40px;
      right: 40px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.style.cssText = `
    background: rgba(13, 17, 27, 0.9);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 42, 59, 0.3);
    color: #ffffff;
    font-family: 'Outfit', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 12px 22px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 
                0 0 15px rgba(255, 42, 59, 0.15);
    transform: translateY(30px);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  `;
  toast.textContent = msg;
  container.appendChild(toast);

  // Fade in
  setTimeout(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
  }, 10);

  // Fade out
  setTimeout(() => {
    toast.style.transform = "translateY(-20px)";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}
