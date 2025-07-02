// Main JavaScript functionality for GG+ Unblocked

class GameSite {
  constructor() {
    this.currentFilter = 'all';
    this.currentSearchQuery = '';
    this.gamesPerPage = 24;
    this.currentPage = 1;
    this.displayedGames = [];
    this.allGames = gamesData;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateGamesCount();
    this.loadInitialGames();
    this.loadPopularGames();
    this.loadCategoryGames();
    this.setupIntersectionObserver();
    this.setupServiceWorker();
  }

  setupEventListeners() {
    // Nav toggle for mobile
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('show-menu');
        navToggle.classList.toggle('active');
      });
    }

    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
      
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSearch(e.target.value);
        }
      });
    }
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.handleSearch(searchInput.value);
      });
    }

    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter__btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.target.dataset.filter;
        this.handleFilter(filter);
        this.updateActiveFilter(e.target);
      });
    });

    // Category cards
    const categoryCards = document.querySelectorAll('.category__card');
    categoryCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const category = e.currentTarget.dataset.category;
        this.handleCategoryFilter(category);
      });
    });

    // Load more button
    const loadMoreBtn = document.getElementById('load-more');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.loadMoreGames();
      });
    }

    // Smooth scrolling for navigation links
    const navLinksInternal = document.querySelectorAll('a[href^="#"]');
    navLinksInternal.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          const headerHeight = document.querySelector('.header').offsetHeight;
          const targetPosition = targetElement.offsetTop - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });

    // Header scroll effect
    window.addEventListener('scroll', () => {
      const header = document.querySelector('.header');
      if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
      } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = 'none';
      }
    });

    // Footer category links
    const footerCategoryLinks = document.querySelectorAll('.footer__links a[data-category]');
    footerCategoryLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const category = e.target.dataset.category;
        this.handleCategoryFilter(category);
        document.getElementById('games').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  handleSearch(query) {
    this.currentSearchQuery = query.trim();
    this.currentPage = 1;
    this.displayedGames = [];
    
    // Check if we're on the index page
    const isIndexPage = window.location.pathname === '/' || window.location.pathname.includes('index.html');
    
    if (this.currentSearchQuery) {
      this.allGames = searchGames(this.currentSearchQuery);
      
      if (isIndexPage) {
        // On index page, update the popular games grid with search results
        const popularGamesGrid = document.getElementById('popular-games-grid');
        if (popularGamesGrid) {
          popularGamesGrid.innerHTML = '';
          if (this.allGames.length === 0) {
            popularGamesGrid.innerHTML = `
              <div class="no-games">
                <div class="no-games__icon">🔍</div>
                <h3 class="no-games__title">No games found</h3>
                <p class="no-games__description">Try searching for different keywords.</p>
              </div>
            `;
          } else {
            this.allGames.slice(0, 24).forEach((game, index) => {
              const gameCard = this.createGameCard(game, index);
              popularGamesGrid.appendChild(gameCard);
            });
          }
        }
      } else {
        this.loadInitialGames();
      }
    } else {
      if (isIndexPage) {
        // Reset to popular games on index page
        this.loadPopularGames();
      } else {
        this.allGames = getGamesByFilter(this.currentFilter);
        this.loadInitialGames();
      }
    }
    
    if (!isIndexPage) {
      this.updateLoadMoreButton();
    }
  }

  handleFilter(filter) {
    this.currentFilter = filter;
    this.currentPage = 1;
    this.displayedGames = [];
    this.currentSearchQuery = '';
    
    // Clear search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = '';
    }
    
    this.allGames = getGamesByFilter(filter);
    this.loadInitialGames();
    this.updateLoadMoreButton();
  }

  handleCategoryFilter(category) {
    this.currentFilter = 'category';
    this.currentPage = 1;
    this.displayedGames = [];
    this.currentSearchQuery = '';
    
    // Clear search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = '';
    }
    
    // Update filter buttons
    const filterBtns = document.querySelectorAll('.filter__btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    
    this.allGames = getGamesByCategory(category);
    this.loadInitialGames();
    this.updateLoadMoreButton();
    
    // Update section title
    const sectionTitle = document.querySelector('.games .section__title');
    if (sectionTitle) {
      sectionTitle.textContent = `${gameCategories[category].name} Games`;
    }
  }

  updateActiveFilter(activeBtn) {
    const filterBtns = document.querySelectorAll('.filter__btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
    
    // Reset section title
    const sectionTitle = document.querySelector('.games .section__title');
    if (sectionTitle) {
      sectionTitle.textContent = 'All Games';
    }
  }

  loadInitialGames() {
    const gamesToShow = this.allGames.slice(0, this.gamesPerPage);
    this.displayedGames = [...gamesToShow];
    this.renderGames(gamesToShow);
  }

  loadMoreGames() {
    const startIndex = this.currentPage * this.gamesPerPage;
    const endIndex = startIndex + this.gamesPerPage;
    const newGames = this.allGames.slice(startIndex, endIndex);
    
    if (newGames.length > 0) {
      this.displayedGames = [...this.displayedGames, ...newGames];
      this.appendGames(newGames);
      this.currentPage++;
    }
    
    this.updateLoadMoreButton();
  }

  renderGames(games) {
    const gamesGrid = document.getElementById('games-grid');
    if (!gamesGrid) return;
    
    gamesGrid.innerHTML = '';
    
    if (games.length === 0) {
      gamesGrid.innerHTML = `
        <div class="no-games">
          <div class="no-games__icon">🎮</div>
          <h3 class="no-games__title">No games found</h3>
          <p class="no-games__description">Try adjusting your search or browse different categories.</p>
        </div>
      `;
      return;
    }
    
    games.forEach((game, index) => {
      const gameCard = this.createGameCard(game, index);
      gamesGrid.appendChild(gameCard);
    });
  }

  appendGames(games) {
    const gamesGrid = document.getElementById('games-grid');
    if (!gamesGrid) return;
    
    games.forEach((game, index) => {
      const gameCard = this.createGameCard(game, this.displayedGames.length - games.length + index);
      gamesGrid.appendChild(gameCard);
    });
  }

  createGameCard(game, index) {
    const gameCard = document.createElement('div');
    gameCard.className = 'game-item fade-in-up';
    gameCard.style.animationDelay = `${(index % 12) * 0.1}s`;
    
    const slug = createGameSlug(game.title);
    const iconSrc = game.iconLink || `games-data/${slug}.png`;
    
    gameCard.innerHTML = `
      <img src="${iconSrc}" alt="${game.title}" class="game-item-icon">
      <div class="game-item-title">${game.title}</div>
      ${game.popular ? '<span class="game__badge game__badge--popular">Popular</span>' : ''}
      ${game.new ? '<span class="game__badge game__badge--new">New</span>' : ''}
      ${game.trending ? '<span class="game__badge game__badge--trending">Trending</span>' : ''}
    `;
    
    // Add click handler to redirect to game page
    gameCard.addEventListener('click', () => {
      window.location.href = `games/${slug}.html`;
    });
    
    // Add keyboard navigation
    gameCard.setAttribute('tabindex', '0');
    gameCard.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = `games/${slug}.html`;
      }
    });
    
    return gameCard;
  }

  updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('load-more');
    const loadMoreContainer = document.querySelector('.load-more__container');
    
    if (!loadMoreBtn || !loadMoreContainer) return;
    
    const hasMoreGames = (this.currentPage * this.gamesPerPage) < this.allGames.length;
    
    if (hasMoreGames && this.allGames.length > this.gamesPerPage) {
      loadMoreContainer.style.display = 'block';
      loadMoreBtn.textContent = `Load More Games (${this.allGames.length - this.displayedGames.length} remaining)`;
    } else {
      loadMoreContainer.style.display = 'none';
    }
  }

  updateGamesCount() {
    const gamesCountElement = document.getElementById('games-count');
    if (gamesCountElement) {
      gamesCountElement.textContent = `${gamesData.length}+`;
    }
  }

  setupIntersectionObserver() {
    // Animate elements when they come into view
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements that should animate in
    const animateElements = document.querySelectorAll('.hero__content, .search__container, .category__card');
    animateElements.forEach(el => observer.observe(el));
  }

  setupServiceWorker() {
    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }

  loadPopularGames() {
    const popularGamesGrid = document.getElementById('popular-games-grid');
    if (!popularGamesGrid) return;

    // Clear the grid first
    popularGamesGrid.innerHTML = '';

    // Get popular games from the data
    const popularGames = this.allGames.filter(game => game.popular);
    console.log('Popular games found:', popularGames.length);
    
    if (popularGames.length === 0) {
      popularGamesGrid.innerHTML = `
        <div class="no-games">
          <div class="no-games__icon">🔥</div>
          <h3 class="no-games__title">No popular games found</h3>
          <p class="no-games__description">Check back soon for trending games!</p>
        </div>
      `;
      return;
    }

    // Use the same createGameCard method as category pages
    popularGames.slice(0, 24).forEach((game, index) => {
      const gameCard = this.createGameCard(game, index);
      popularGamesGrid.appendChild(gameCard);
    });
  }

  loadCategoryGames() {
    // Check if we're on a category page
    const categoryMatch = window.location.pathname.match(/(\w+)\.html/);
    if (categoryMatch) {
      const pageName = categoryMatch[1].toLowerCase();
      const validCategories = ['action', 'arcade', 'adventure', 'puzzle', 'racing', 'sports'];
      if (validCategories.includes(pageName)) {
        // Load games for this category
        this.allGames = getGamesByCategory(pageName);
        const gamesGrid = document.getElementById('games-grid');
        if (gamesGrid) {
          gamesGrid.innerHTML = '';
          this.renderGames(this.allGames);
          // Update the count
          const countElement = document.getElementById(`${pageName}-count`);
          if (countElement) {
            countElement.textContent = `(${this.allGames.length} games)`;
          }
        }
      }
    }
  }
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Add CSS for no games state
const style = document.createElement('style');
style.textContent = `
  .no-games {
    grid-column: 1 / -1;
    text-align: center;
    padding: var(--space-16) var(--space-4);
  }
  
  .no-games__icon {
    font-size: 4rem;
    margin-bottom: var(--space-4);
    opacity: 0.5;
  }
  
  .no-games__title {
    font-size: var(--font-size-2xl);
    font-weight: 600;
    margin-bottom: var(--space-2);
    color: var(--text-primary);
  }
  
  .no-games__description {
    color: var(--text-secondary);
    font-size: var(--font-size-lg);
  }
  
  @media (max-width: 768px) {
    .no-games__icon {
      font-size: 3rem;
    }
    
    .no-games__title {
      font-size: var(--font-size-xl);
    }
    
    .no-games__description {
      font-size: var(--font-size-base);
    }
  }
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GameSite();
});

// Handle browser back/forward buttons
window.addEventListener('popstate', (e) => {
  // Handle state changes if needed
  location.reload();
});

// Preload critical resources
const preloadLinks = [
  'assets/css/style.css',
  'assets/css/responsive.css'
];

preloadLinks.forEach(href => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  document.head.appendChild(link);
});

// Performance monitoring
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'measure') {
        console.log(`${entry.name}: ${entry.duration}ms`);
      }
    });
  });
  
  observer.observe({ entryTypes: ['measure'] });
}

// Error handling
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  // You could send this to an error tracking service
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  // You could send this to an error tracking service
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameSite };
} 
 