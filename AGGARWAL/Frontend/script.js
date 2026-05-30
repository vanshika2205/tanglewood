// DOM Elements
const womenTrigger = document.getElementById('text2'); // The "women" text
const menTrigger = document.getElementById('text1'); // The "men" text
const sidebar = document.getElementById('filter-sidebar');
const closeSidebar = document.getElementById('close-sidebar');
const sidebarTitle = document.getElementById('sidebar-title');

const applyFiltersBtn = document.getElementById('apply-filters-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');

const galleryContainer = document.getElementById('gallery-container');
const galleryGrid = document.getElementById('gallery-grid');
const closeGallery = document.getElementById('close-gallery');
const galleryTitle = document.getElementById('gallery-title');

// Current selection state
let currentSection = 'Men';

// Image resolution helper to handle string names (image.png, image copy.png) and numeric IDs
function getProductImagePath(id) {
    if (id === 'default_copy') {
        return 'assets/image copy.png';
    }
    if (id === 'default') {
        return 'assets/image.png';
    }
    return `assets/image copy ${id}.png`;
}

const categoryFilterGroup = document.querySelectorAll('.filter-group')[0];
const brandFilterGroup = document.querySelectorAll('.filter-group')[1];

function updateFilters(section) {
    if (section === 'Men') {
        categoryFilterGroup.innerHTML = `
            <h3>Category</h3>
            <label><input type="radio" name="category" value="Suits"> Suits</label>
            <label><input type="radio" name="category" value="Shirts"> Shirts</label>
            <label><input type="radio" name="category" value="Trousers"> Trousers</label>
        `;
        brandFilterGroup.innerHTML = `
            <h3>Brand</h3>
            <label><input type="radio" name="brand" value="Raymond"> Raymond</label>
            <label><input type="radio" name="brand" value="Tasmania"> Tasmania</label>
            <label><input type="radio" name="brand" value="Siyaram's"> Siyaram's</label>
            <label><input type="radio" name="brand" value="Mistair"> Mistair</label>
        `;
    } else {
        categoryFilterGroup.innerHTML = `
            <h3>Category</h3>
            <label><input type="radio" name="category" value="Sarees"> Sarees</label>
            <label><input type="radio" name="category" value="Dresses"> Dresses</label>
            <label><input type="radio" name="category" value="Tops"> Tops</label>
            <label><input type="radio" name="category" value="Kurtis"> Kurtis</label>
        `;
        brandFilterGroup.innerHTML = `
            <h3>Brand</h3>
            <label><input type="radio" name="brand" value="Biba"> Biba</label>
            <label><input type="radio" name="brand" value="W for Woman"> W for Woman</label>
            <label><input type="radio" name="brand" value="Zara"> Zara</label>
            <label><input type="radio" name="brand" value="Mango"> Mango</label>
        `;
    }
}

// Open Sidebar Logic
if(womenTrigger) {
    womenTrigger.addEventListener('click', () => {
        currentSection = 'Women';
        sidebarTitle.textContent = "Women's Collection";
        updateFilters('Women');
        sidebar.classList.add('open');
    });
}

if(menTrigger) {
    menTrigger.addEventListener('click', () => {
        currentSection = 'Men';
        sidebarTitle.textContent = "Men's Collection";
        updateFilters('Men');
        sidebar.classList.add('open');
    });
}

// Close Sidebar Logic
if(closeSidebar) {
    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });
}

// Gallery Logic
if(closeGallery) {
    closeGallery.addEventListener('click', () => {
        galleryContainer.classList.add('hidden-gallery');
        document.body.style.overflow = 'auto';
    });
}

// Product Filtering System (From Original Request)
function renderProducts() {
    galleryGrid.innerHTML = '';
    galleryTitle.textContent = `${currentSection} - Filtered Collection`;
    
    const selectedBrand = document.querySelector('input[name="brand"]:checked')?.value;
    const selectedCategory = document.querySelector('input[name="category"]:checked')?.value;

    let imagesToShow = [];
    let sliderImages = [];
    
    // Brand and Category Product Filter Mappings
    // Brand and Category Product Filter Mappings
    if (currentSection === 'Women') {
        // Define base pools for each category as requested by the user
        const sareesMain = ['default', 'default_copy', 2, 3, 4, 5, 6, 7, 8, 9];
        const sareesSlider = [];
        
        const kurtisMain = [];
        const kurtisSlider = [];
        
        const dressesMain = [];
        const dressesSlider = [];
        
        const topsMain = [];
        const topsSlider = [];

        // 1. Both Brand AND Category are selected
        if (selectedBrand && selectedCategory) {
            if (selectedBrand === 'Biba' && selectedCategory === 'Sarees') {
                imagesToShow = sareesMain;
                sliderImages = sareesSlider;
            } else if (selectedBrand === 'Biba' && selectedCategory === 'Kurtis') {
                imagesToShow = kurtisMain;
                sliderImages = kurtisSlider;
            } else if (selectedBrand === 'W for Woman' && selectedCategory === 'Sarees') {
                imagesToShow = [];
                sliderImages = [];
            } else if (selectedBrand === 'W for Woman' && selectedCategory === 'Kurtis') {
                imagesToShow = [];
                sliderImages = [];
            } else {
                // Where there is no item, leave it completely empty
                imagesToShow = [];
                sliderImages = [];
            }
        }
        // 2. Only Brand is selected
        else if (selectedBrand) {
            if (selectedBrand === 'Biba') {
                imagesToShow = [...sareesMain, ...kurtisMain];
                sliderImages = [...sareesSlider, ...kurtisSlider];
            } else if (selectedBrand === 'W for Woman') {
                imagesToShow = [];
                sliderImages = [];
            } else {
                imagesToShow = [];
                sliderImages = [];
            }
        }
        // 3. Only Category is selected
        else if (selectedCategory) {
            if (selectedCategory === 'Sarees') {
                imagesToShow = sareesMain;
                sliderImages = sareesSlider;
            } else if (selectedCategory === 'Kurtis') {
                imagesToShow = kurtisMain;
                sliderImages = kurtisSlider;
            } else {
                imagesToShow = [];
                sliderImages = [];
            }
        }
        // 4. Default: No filters selected at all
        else {
            imagesToShow = ['default', 'default_copy', 2, 3, 4, 5, 6, 7, 8, 9];
            sliderImages = [];
        }
    } else {
        // Men's Logic
        // 1. Both Brand AND Category are selected
        if (selectedBrand && selectedCategory) {
            if (selectedBrand === 'Raymond' && selectedCategory === 'Suits') {
                sliderImages = [24, 40];
                imagesToShow = [18, 43, 42, 41, 39, 38, 37];
            } else if (selectedBrand === 'Raymond' && selectedCategory === 'Shirts') {
                sliderImages = [74];
                imagesToShow = [82, 80, 79, 78];
            } else if (selectedBrand === 'Raymond' && selectedCategory === 'Trousers') {
                sliderImages = [];
                imagesToShow = [83, 81, 76, 75, 73, 72, 71];
            } else if (selectedBrand === 'Tasmania' && selectedCategory === 'Suits') {
                sliderImages = [36, 46];
                imagesToShow = [51, 50, 49, 48, 47, 45, 44];
            } else if (selectedBrand === "Siyaram's" && selectedCategory === 'Suits') {
                sliderImages = [25, 26, 85, 60, 58, 34];
                imagesToShow = [28, 29, 30, 31, 32, 33];
            } else if (selectedBrand === "Siyaram's" && selectedCategory === 'Shirts') {
                sliderImages = [60, 58];
                imagesToShow = [69, 68, 66, 64];
            } else if (selectedBrand === "Siyaram's" && selectedCategory === 'Trousers') {
                sliderImages = [];
                imagesToShow = [70, 68, 67, 65, 63, 62, 61, 59, 57, 56, 55, 54];
            } else if (selectedBrand === 'Mistair' && selectedCategory === 'Suits') {
                sliderImages = [34];
                imagesToShow = [35, 52, 53];
            } else {
                // Where there is no item, leave it completely empty
                imagesToShow = [];
                sliderImages = [];
            }
        }
        // 2. Only Brand is selected
        else if (selectedBrand) {
            if (selectedBrand === 'Raymond') {
                sliderImages = [24, 40, 74, 77];
                imagesToShow = [18, 43, 42, 41, 39, 38, 37, 82, 80, 79, 78, 83, 81, 76, 75, 73, 72, 71];
            } else if (selectedBrand === 'Tasmania') {
                sliderImages = [36, 46];
                imagesToShow = [51, 50, 49, 48, 47, 45, 44];
            } else if (selectedBrand === "Siyaram's") {
                sliderImages = [25, 26, 60, 58];
                imagesToShow = [28, 29, 30, 31, 32, 33, 69, 68, 66, 64, 70, 68, 67, 65, 63, 62, 61, 59, 57, 56, 55, 54];
            } else if (selectedBrand === 'Mistair') {
                sliderImages = [34];
                imagesToShow = [35, 52, 53];
            }
        }
        // 3. Only Category is selected
        else if (selectedCategory) {
            if (selectedCategory === 'Suits') {
                imagesToShow = [18, 43, 42, 41, 39, 38, 37, 51, 50, 49, 48, 47, 45, 44, 28, 29, 30, 31, 32, 33, 35, 52, 53];
                sliderImages = [24, 40, 36, 46, 25, 26, 85, 60, 58, 34];
            } else if (selectedCategory === 'Shirts') {
                imagesToShow = [82, 80, 79, 78, 69, 68, 66, 64];
                sliderImages = [74, 60, 58];
            } else if (selectedCategory === 'Trousers') {
                imagesToShow = [83, 81, 76, 75, 73, 72, 71, 70, 68, 67, 65, 63, 62, 61, 59, 57, 56, 55, 54];
                sliderImages = [];
            } else {
                // Where there is no item, leave it completely empty
                imagesToShow = [];
                sliderImages = [];
            }
        }
        // 4. Default: No filters selected at all
        else {
            imagesToShow = [18, 30, 31, 32, 33, 35, 37, 43, 78, 80];
            sliderImages = [];
        }
    }

    // Render Special Slider for Featured Ad Banners
    if (sliderImages.length > 0) {
        const sliderDiv = document.createElement('div');
        sliderDiv.className = 'special-slider';
        
        sliderImages.forEach((num) => {
            const img = document.createElement('img');
            img.src = getProductImagePath(num);
            img.alt = `Featured ${num}`;
            sliderDiv.appendChild(img);
        });
        
        galleryGrid.appendChild(sliderDiv);
        
        // Auto-play horizontal scroll logic
        if (sliderImages.length > 1) {
            let currentIndex = 0;
            
            // Clear any existing interval to prevent overlapping timers
            if (window.sliderIntervalId) {
                clearInterval(window.sliderIntervalId);
            }
            
            window.sliderIntervalId = setInterval(() => {
                // If slider is removed from DOM, clear interval
                if (!document.body.contains(sliderDiv)) {
                    clearInterval(window.sliderIntervalId);
                    return;
                }
                
                currentIndex = (currentIndex + 1) % sliderImages.length;
                sliderDiv.scrollTo({
                    left: currentIndex * sliderDiv.clientWidth,
                    behavior: 'smooth'
                });
            }, 3000); // 3 seconds interval
        }
    }

    // Render Standard Grid Items
    imagesToShow.forEach(num => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.style.cursor = 'pointer'; // Make it look clickable
        
        // Generate random data for the card display
        const brandStr = selectedBrand || currentSection;
        const catStr = selectedCategory || 'Premium Collection';
        const basePrice = Math.floor(Math.random() * 5000) + 3000;
        const currentPrice = basePrice.toLocaleString('en-IN');
        const originalPrice = Math.floor(basePrice * 1.4).toLocaleString('en-IN');
        const discount = Math.floor(Math.random() * 20) + 30; // 30-50% off
        const ratingCount = Math.floor(Math.random() * 500) + 50;
        
        item.innerHTML = `
            <img src="${getProductImagePath(num)}" alt="Product ${num}" loading="lazy">
            <div class="product-card-details">
                <div class="card-brand">${brandStr}</div>
                <div class="card-title">${brandStr} ${catStr}</div>
                <div class="card-rating">⭐⭐⭐⭐⭐ <span>(${ratingCount})</span></div>
                <div class="card-price">
                    <span class="c-price">₹${currentPrice}</span>
                    <span class="o-price">₹${originalPrice}</span>
                    <span class="d-off">(${discount}% OFF)</span>
                </div>
            </div>
        `;
        
        // Add click listener to open the product modal with the PRE-GENERATED price
        item.addEventListener('click', () => {
            openProductModal(num, brandStr, catStr, currentPrice, originalPrice, discount);
        });
        
        galleryGrid.appendChild(item);
    });

    // Show Gallery Overlay
    galleryContainer.classList.remove('hidden-gallery');
    sidebar.classList.remove('open');
    document.body.style.overflow = 'hidden'; // prevent scrolling background
}

if(applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', renderProducts);
}

if(clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
        document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    });
}

// =========================================================
// PRODUCT MODAL LOGIC
// =========================================================

const productModal = document.getElementById('product-modal');
const closeProductModal = document.getElementById('close-product-modal');
const modalProductImg = document.getElementById('modal-product-img');
const modalProductBrand = document.getElementById('modal-product-brand');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductPrice = document.getElementById('modal-product-price');
const originalPriceElem = document.querySelector('.original-price');

const addToCartBtn = document.getElementById('add-to-cart-btn');
const toastNotification = document.getElementById('toast-notification');

// Open Modal Function
function openProductModal(imgNum, brand, category, currentPrice, originalPrice, discount) {
    // Populate Image
    modalProductImg.src = getProductImagePath(imgNum);
    
    // Populate Title/Brand
    modalProductBrand.textContent = brand;
    modalProductTitle.textContent = `${brand} ${category}`;
    
    // Populate Pricing (using the values passed from the grid card)
    modalProductPrice.textContent = `₹${currentPrice}`;
    originalPriceElem.textContent = `₹${originalPrice}`;
    
    // Update discount text if it exists
    const discountElem = document.querySelector('.product-price .discount');
    if (discountElem) {
        discountElem.textContent = `(${discount}% OFF)`;
    }
    
    // Show Modal
    productModal.classList.remove('hidden-modal');
}

// Close Modal
if(closeProductModal) {
    closeProductModal.addEventListener('click', () => {
        productModal.classList.add('hidden-modal');
    });
}

// Add to Cart Notification
if(addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
        checkAuthAndProceed("Add to Bag", "Added to Bag successfully! 🛒");
    });
}

// Size Selection Logic
const sizeBtns = document.querySelectorAll('.size-btn');
sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        sizeBtns.forEach(b => b.classList.remove('active-size'));
        btn.classList.add('active-size');
    });
});

// Quantity Logic
let quantity = 1;
const qtyMinus = document.getElementById('qty-minus');
const qtyPlus = document.getElementById('qty-plus');
const qtyDisplay = document.getElementById('qty-display');

if(qtyMinus && qtyPlus) {
    qtyMinus.addEventListener('click', () => {
        if(quantity > 1) {
            quantity--;
            qtyDisplay.textContent = quantity;
        }
    });
    
    qtyPlus.addEventListener('click', () => {
        if(quantity < 10) { // arbitrary limit
            quantity++;
            qtyDisplay.textContent = quantity;
        }
    });
}

// =========================================================
// HERO VIDEO LOGIC (PLAYLIST & SCROLL PAUSE)
// =========================================================

const heroVideo = document.getElementById('heroVideo');
if (heroVideo) {
    // Playlist of videos to play back-to-back (restored to original playlist)
    const videoPlaylist = [
        'assets/PixVerse_V6_Extend_360P_mujhe_video_thodi_bdi_.mp4',
        'assets/Untitled.mov'
    ];
    let currentVideoIndex = 0;

    // Start muted to comply with browser autoplay policy (guarantees video autoplays instantly on site visit)
    heroVideo.muted = true;

    // Initialize video source
    heroVideo.src = videoPlaylist[currentVideoIndex];

    // Advanced error handler to automatically bypass unsupported codecs/large files (.mov ProRes)
    heroVideo.addEventListener('error', () => {
        const error = heroVideo.error;
        console.error("Hero Video Loading Error:", error);
        
        // Code 4 (MEDIA_ERR_SRC_NOT_SUPPORTED) or Code 3 (MEDIA_ERR_DECODE)
        if (error && (error.code === 4 || error.code === 3)) {
            const currentSrc = videoPlaylist[currentVideoIndex];
            console.warn(`Format or codec not supported by browser for: ${currentSrc}`);
            
            // If the massive 342MB 'Untitled.mov' fails, fall back to 'assets/men.mov' (33.7MB QuickTime)
            if (currentSrc === 'assets/Untitled.mov') {
                console.log("Falling back from Untitled.mov to assets/men.mov...");
                videoPlaylist[currentVideoIndex] = 'assets/men.mov';
                heroVideo.src = 'assets/men.mov';
                heroVideo.muted = true; // MUST START MUTED to guarantee it autoplays instantly in fallback!
                heroVideo.load();
                heroVideo.play().catch(err => console.log("Fallback men.mov playback failed:", err));
            }
        }
    });
    
    // When a video ends, load and play the next one in the playlist
    heroVideo.addEventListener('ended', () => {
        currentVideoIndex = (currentVideoIndex + 1) % videoPlaylist.length;
        heroVideo.src = videoPlaylist[currentVideoIndex];
        heroVideo.muted = false; // Keep volume active on transition
        heroVideo.load(); // Force container reload for seamless codec transition
        heroVideo.play().catch(err => {
            console.log("Video transition playback blocked. Trying muted fallback...");
            heroVideo.muted = true;
            heroVideo.play().catch(e => console.log("Muted transition failed:", e));
        });
    });

    // High-performance IntersectionObserver observing #page1 to pause/play the video responsively
    const page1Element = document.getElementById('page1');
    if (page1Element) {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15 // Pause video when page 1 is less than 15% visible (scrolled to page 2)
        };

        const pageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Play video when page 1 is visible in viewport
                    if (heroVideo.paused) {
                        heroVideo.play().catch(err => {
                            console.log("Play on scroll resume blocked, using muted fallback...");
                            heroVideo.muted = true;
                            heroVideo.play().catch(e => console.log("Play resume failed:", e));
                        });
                    }
                } else {
                    // Pause video the instant page 1 goes out of view (entering Page 2 - New Arrival)
                    if (!heroVideo.paused) {
                        heroVideo.pause();
                        console.log("Video automatically paused on scroll away.");
                    }
                }
            });
        }, observerOptions);

        pageObserver.observe(page1Element);
    }

    // Initial play trigger: Try unmuted play first, but instantly fall back to muted autoplay to guarantee immediate playback on site visit!
    const startPlaying = () => {
        heroVideo.muted = false;
        heroVideo.play().catch(err => {
            console.log("Unmuted autoplay initially blocked. Falling back to muted autoplay to start video instantly...");
            heroVideo.muted = true;
            heroVideo.play().catch(e => console.error("Muted autoplay blocked too:", e));
        });
    };
    startPlaying();

    // Automatically unmute as soon as the user interacts with the page (compliance fallback)
    const unmuteOnInteraction = () => {
        if (heroVideo.muted) {
            heroVideo.muted = false;
            // Only trigger play if page 1 is still in view
            const rect = page1Element ? page1Element.getBoundingClientRect() : null;
            if (rect && rect.bottom > window.innerHeight * 0.3) {
                heroVideo.play().catch(e => console.log("Play on interaction failed:", e));
            }
        }
        document.removeEventListener('click', unmuteOnInteraction);
        document.removeEventListener('scroll', unmuteOnInteraction);
        document.removeEventListener('touchstart', unmuteOnInteraction);
    };
    document.addEventListener('click', unmuteOnInteraction);
    document.addEventListener('scroll', unmuteOnInteraction);
    document.addEventListener('touchstart', unmuteOnInteraction);
}

// =========================================================
// PREMIUM AUTHENTICATION (LOGIN & SIGN UP) LOGIC
// =========================================================

// Auth DOM elements
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const closeLoginModal = document.getElementById('close-login-modal');
const closeSignupModal = document.getElementById('close-signup-modal');
const switchToSignup = document.getElementById('switch-to-signup');
const switchToLogin = document.getElementById('switch-to-login');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authNav = document.getElementById('auth-nav');

const wishlistBtn = document.getElementById('wishlist-btn');
const buyNowBtn = document.getElementById('buy-now-btn');

// Active logged-in user state
let currentUser = JSON.parse(localStorage.getItem('aggarwal_current_user')) || null;

// Function to show toast notification
function showToast(message, isError = false) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    
    toast.textContent = message;
    toast.style.background = isError ? '#cf212b' : '#2e8b57'; // red for error, green for success
    
    toast.classList.remove('hidden-toast');
    
    // Clear previous timeout if any
    if (window.toastTimeoutId) {
        clearTimeout(window.toastTimeoutId);
    }
    
    window.toastTimeoutId = setTimeout(() => {
        toast.classList.add('hidden-toast');
    }, 3000);
}

// Update authentication UI header based on logged in state
function updateAuthUI() {
    if (currentUser) {
        authNav.innerHTML = `
            <div class="auth-user-greeting">
                <span>Hello, <strong>${currentUser.name}</strong></span>
                <button id="nav-logout-btn" class="auth-nav-btn">Logout</button>
            </div>
        `;
        
        // Bind logout button click
        document.getElementById('nav-logout-btn').addEventListener('click', () => {
            currentUser = null;
            localStorage.removeItem('aggarwal_current_user');
            updateAuthUI();
            showToast("Logged out successfully!");
        });
    } else {
        authNav.innerHTML = `
            <button id="nav-login-btn" class="auth-nav-btn">Login</button>
            <button id="nav-signup-btn" class="auth-nav-btn signup-accent">Sign Up</button>
        `;
        
        // Re-bind login and signup buttons click
        document.getElementById('nav-login-btn').addEventListener('click', () => {
            loginModal.classList.remove('hidden-auth-modal');
        });
        document.getElementById('nav-signup-btn').addEventListener('click', () => {
            signupModal.classList.remove('hidden-auth-modal');
        });
    }
}

// Bind modal toggling and close listeners
if (closeLoginModal) closeLoginModal.addEventListener('click', () => loginModal.classList.add('hidden-auth-modal'));
if (closeSignupModal) closeSignupModal.addEventListener('click', () => signupModal.classList.add('hidden-auth-modal'));

if (switchToSignup) {
    switchToSignup.addEventListener('click', () => {
        loginModal.classList.add('hidden-auth-modal');
        signupModal.classList.remove('hidden-auth-modal');
    });
}

if (switchToLogin) {
    switchToLogin.addEventListener('click', () => {
        signupModal.classList.add('hidden-auth-modal');
        loginModal.classList.remove('hidden-auth-modal');
    });
}

// Handle dynamic forms submission
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim().toLowerCase();
        const password = document.getElementById('signup-password').value.trim();
        
        if (password.length < 6) {
            showToast("Password must be at least 6 characters!", true);
            return;
        }
        
        // Get existing users from localStorage DB
        let users = JSON.parse(localStorage.getItem('aggarwal_users')) || [];
        
        // Check duplicate email
        const userExists = users.some(u => u.email === email);
        if (userExists) {
            showToast("Email is already registered. Please log in.", true);
            return;
        }
        
        // Create and save new user
        const newUser = { name, email, password };
        users.push(newUser);
        localStorage.setItem('aggarwal_users', JSON.stringify(users));
        
        // Log in new user automatically
        currentUser = newUser;
        localStorage.setItem('aggarwal_current_user', JSON.stringify(currentUser));
        
        signupForm.reset();
        signupModal.classList.add('hidden-auth-modal');
        updateAuthUI();
        showToast(`Account created! Welcome, ${name}!`);
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value.trim();
        
        // Get users from localStorage DB
        const users = JSON.parse(localStorage.getItem('aggarwal_users')) || [];
        
        // Check credentials match
        const foundUser = users.find(u => u.email === email && u.password === password);
        
        if (foundUser) {
            currentUser = foundUser;
            localStorage.setItem('aggarwal_current_user', JSON.stringify(currentUser));
            
            loginForm.reset();
            loginModal.classList.add('hidden-auth-modal');
            updateAuthUI();
            showToast(`Welcome back, ${currentUser.name}!`);
        } else {
            showToast("Invalid email or password!", true);
        }
    });
}

// Re-bind action button actions with logged in user restrictions
function checkAuthAndProceed(actionName, successMsg) {
    if (!currentUser) {
        showToast("Please login first to use this feature!", true);
        
        // Automatically prompt the login modal to improve user flow
        setTimeout(() => {
            loginModal.classList.remove('hidden-auth-modal');
        }, 800);
        return false;
    }
    showToast(successMsg);
    return true;
}

// Bind wishlist PDP click action
if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
        checkAuthAndProceed("Wishlist", "Added to your Wishlist! ❤️");
    });
}

// Bind buy now PDP click action
if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
        checkAuthAndProceed("Buy Now", "Order placed successfully! Thank you. 🛍️");
    });
}

// Initialize Auth Navigation UI
updateAuthUI();

