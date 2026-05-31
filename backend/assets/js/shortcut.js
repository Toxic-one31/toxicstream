/**
 * Keyboard Shortcuts System
 */

class KeyboardShortcuts {
  constructor() {
    this.shortcuts = {
      '/': () => this.focusSearch(),
      'h': () => window.location.href = '/',
      'w': () => watchlistManager?.toggleWatchlistModal(),
      ' ': () => this.togglePlayPause(),
      'f': () => this.toggleFullscreen(),
      'm': () => this.toggleMute(),
      'ArrowLeft': () => this.rewind(10),
      'ArrowRight': () => this.forward(10),
      'ArrowUp': () => this.volumeUp(),
      'ArrowDown': () => this.volumeDown(),
      '?': () => this.showShortcuts(),
      'Escape': () => this.closeModals()
    };
    
    this.init();
  }
  
  init() {
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
  }
  
  handleKeyPress(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    const handler = this.shortcuts[e.key];
    
    if (handler) {
      e.preventDefault();
      handler();
    }
  }
  
  focusSearch() {
    document.querySelector('.search-bar')?.focus();
  }
  
  togglePlayPause() {
    const video = document.querySelector('video');
    if (video) {
      video.paused ? video.play() : video.pause();
    }
  }
  
  toggleFullscreen() {
    const container = document.querySelector('.player-container');
    if (container) {
      if (!document.fullscreenElement) {
        container.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  }
  
  toggleMute() {
    const video = document.querySelector('video');
    if (video) {
      video.muted = !video.muted;
    }
  }
  
  rewind(seconds) {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = Math.max(0, video.currentTime - seconds);
    }
  }
  
  forward(seconds) {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = Math.min(video.duration, video.currentTime + seconds);
    }
  }
  
  volumeUp() {
    const video = document.querySelector('video');
    if (video) {
      video.volume = Math.min(1, video.volume + 0.1);
    }
  }
  
  volumeDown() {
    const video = document.querySelector('video');
    if (video) {
      video.volume = Math.max(0, video.volume - 0.1);
    }
  }
  
  showShortcuts() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
      <div class="modal-content">
        <h2>⌨️ Keyboard Shortcuts</h2>
        <div class="shortcuts-grid">
          <div><kbd>/</kbd> Focus search</div>
          <div><kbd>H</kbd> Go home</div>
          <div><kbd>W</kbd> Watchlist</div>
          <div><kbd>Space</kbd> Play/Pause</div>
          <div><kbd>F</kbd> Fullscreen</div>
          <div><kbd>M</kbd> Mute</div>
          <div><kbd>←</kbd> Rewind 10s</div>
          <div><kbd>→</kbd> Forward 10s</div>
          <div><kbd>↑</kbd> Volume up</div>
          <div><kbd>↓</kbd> Volume down</div>
        </div>
        <button class="btn-primary" onclick="this.closest('.shortcuts-modal').remove()">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  closeModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
      modal.classList.remove('active');
    });
  }
}

// Initialize
new KeyboardShortcuts();