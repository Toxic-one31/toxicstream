/**
 * Watchlist & User Preferences Manager
 * Complete implementation from previous messages
 */

class WatchlistManager {
  constructor() {
    this.storageKey = 'toxicstream_watchlist';
    this.prefsKey = 'toxicstream_preferences';
    this.historyKey = 'toxicstream_history';
    
    this.watchlist = this.load(this.storageKey) || [];
    this.preferences = this.load(this.prefsKey) || this.getDefaultPreferences();
    this.history = this.load(this.historyKey) || [];
    
    this.init();
  }
  
  init() {
    this.createWatchlistUI();
    this.attachEventListeners();
    this.applyPreferences();
  }
  
  getDefaultPreferences() {
    return {
      theme: 'dark',
      language: 'en',
      autoplay: true,
      skipIntro: true,
      quality: 'auto',
      subtitles: true,
      volume: 100
    };
  }
  
  addToWatchlist(item) {
    const exists = this.watchlist.find(i => i.id === item.id);
    if (exists) {
      this.showNotification('Already in watchlist', 'info');
      return;
    }
    
    const watchlistItem = {
      id: item.id,
      type: item.type,
      title: item.title,
      poster: item.poster,
      year: item.year,
      addedAt: new Date().toISOString()
    };
    
    this.watchlist.unshift(watchlistItem);
    this.save(this.storageKey, this.watchlist);
    this.updateWatchlistUI();
    this.showNotification('Added to watchlist ✓', 'success');
    
    // Track analytics
    if (window.analytics) {
      analytics.trackWatchlistAdd(item);
    }
  }
  
  removeFromWatchlist(itemId) {
    this.watchlist = this.watchlist.filter(i => i.id !== itemId);
    this.save(this.storageKey, this.watchlist);
    this.updateWatchlistUI();
    this.showNotification('Removed from watchlist', 'info');
  }
  
  addToHistory(item, progress = 0) {
    this.history = this.history.filter(i => i.id !== item.id);
    
    const historyItem = {
      id: item.id,
      type: item.type,
      title: item.title,
      poster: item.poster,
      progress: progress,
      watchedAt: new Date().toISOString()
    };
    
    this.history.unshift(historyItem);
    
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }
    
    this.save(this.historyKey, this.history);
  }
  
  createWatchlistUI() {
    // Add watchlist button to navbar
    const navbar = document.querySelector('.navbar .nav-right');
    if (navbar && !document.querySelector('.watchlist-btn')) {
      const btn = document.createElement('button');
      btn.className = 'icon-btn watchlist-btn';
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="watchlist-count">${this.watchlist.length}</span>
      `;
      btn.onclick = () => this.toggleWatchlistModal();
      navbar.insertBefore(btn, navbar.firstChild);
    }
    
    // Create modal
    if (!document.getElementById('watchlist-modal')) {
      const modal = document.createElement('div');
      modal.className = 'watchlist-modal';
      modal.id = 'watchlist-modal';
      modal.innerHTML = `
        <div class="modal-overlay" onclick="watchlistManager.toggleWatchlistModal()"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2>My Watchlist</h2>
            <button class="btn-close" onclick="watchlistManager.toggleWatchlistModal()">×</button>
          </div>
          <div class="modal-body">
            <div id="watchlist-grid" class="watchlist-grid"></div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
  }
  
  updateWatchlistUI() {
    const grid = document.getElementById('watchlist-grid');
    const countBadge = document.querySelector('.watchlist-count');
    
    if (countBadge) {
      countBadge.textContent = this.watchlist.length;
      countBadge.style.display = this.watchlist.length > 0 ? 'flex' : 'none';
    }
    
    if (!grid) return;
    
    if (this.watchlist.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          <h3>Your watchlist is empty</h3>
          <p>Add movies and shows to watch later</p>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = this.watchlist.map(item => `
      <div class="watchlist-card">
        <img src="${item.poster}" alt="${item.title}" loading="lazy">
        <div class="card-content">
          <h4>${item.title}</h4>
          <button class="remove-btn" onclick="watchlistManager.removeFromWatchlist('${item.id}')">Remove</button>
        </div>
      </div>
    `).join('');
  }
  
  toggleWatchlistModal() {
    const modal = document.getElementById('watchlist-modal');
    if (modal) {
      modal.classList.toggle('active');
      if (modal.classList.contains('active')) {
        this.updateWatchlistUI();
      }
    }
  }
  
  updateHistoryUI() {
    // Continue watching section
    const section = document.getElementById('continue-watching');
    if (!section) return;
    
    const recentItems = this.history.filter(i => i.progress > 5 && i.progress < 95).slice(0, 10);
    
    if (recentItems.length === 0) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    const grid = section.querySelector('.content-grid');
    
    grid.innerHTML = recentItems.map(item => `
      <div class="card continue-card" onclick="window.location.href='/watch.html?id=${item.id}'">
        <div class="card-image">
          <img src="${item.poster}" alt="${item.title}" loading="lazy">
          <div class="progress-overlay">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${item.progress}%"></div>
            </div>
          </div>
        </div>
        <div class="card-content">
          <h4>${item.title}</h4>
          <p>${Math.round(item.progress)}% watched</p>
        </div>
      </div>
    `).join('');
  }
  
  applyPreferences() {
    document.body.dataset.theme = this.preferences.theme;
  }
  
  attachEventListeners() {
    // Add to watchlist buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('.add-to-watchlist-btn')) {
        const card = e.target.closest('.card');
        const itemData = JSON.parse(card.dataset.item || '{}');
        this.addToWatchlist(itemData);
      }
    });
  }
  
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Storage error:', error);
    }
  }
  
  load(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Load error:', error);
      return null;
    }
  }
  
  showNotification(message, type) {
    if (window.ToxicUtils) {
      ToxicUtils.showNotification(message, type);
    }
  }
}

// Initialize
let watchlistManager;
document.addEventListener('DOMContentLoaded', () => {
  watchlistManager = new WatchlistManager();
});