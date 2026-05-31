/**
 * Video Player Manager
 * Handles video playback, controls, and provider switching
 */

class VideoPlayer {
  constructor() {
    this.video = null;
    this.hls = null;
    this.currentProvider = null;
    this.currentItem = null;
    this.providers = [];
    this.init();
  }
  
  async init() {
    this.video = document.getElementById('video-player');
    if (!this.video) return;
    
    await this.loadProviders();
    this.setupControls();
    this.setupEventListeners();
  }
  
  async loadProviders() {
    try {
      const data = await contentFetcher.fetchProviders();
      this.providers = data.providers || [];
      console.log(`📡 Loaded ${this.providers.length} providers`);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  }
  
  async play(item) {
    this.currentItem = item;
    
    // Try providers in priority order
    const sortedProviders = this.providers.sort((a, b) => a.priority - b.priority);
    
    for (const provider of sortedProviders) {
      try {
        console.log(`🎬 Trying provider: ${provider.name}`);
        
        const streamData = await this.getStreamFromProvider(provider, item);
        
        if (streamData) {
          await this.loadStream(streamData, provider);
          this.currentProvider = provider;
          return;
        }
        
      } catch (error) {
        console.error(`Provider ${provider.name} failed:`, error);
      }
    }
    
    // All providers failed
    ToxicUtils.showNotification('Failed to load video from all providers', 'error');
  }
  
  async getStreamFromProvider(provider, item) {
    // If item has direct source URL
    if (item.sources && item.sources.length > 0) {
      const source = item.sources.find(s => s.provider === provider.id);
      if (source) {
        return { type: 'direct', url: source.url, quality: source.quality };
      }
    }
    
    // Search provider
    const searchUrl = `${API_BASE_URL}/search?provider=${provider.id}&q=${encodeURIComponent(item.title.en || item.title)}&type=${item.type || 'movie'}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (searchData.results && searchData.results.length > 0) {
      const result = searchData.results[0];
      
      // Get stream URL
      const streamUrl = `${API_BASE_URL}/stream?provider=${provider.id}&url=${encodeURIComponent(result.url)}`;
      const streamResponse = await fetch(streamUrl);
      return await streamResponse.json();
    }
    
    return null;
  }
  
  async loadStream(streamData, provider) {
    console.log(`✅ Loading stream from ${provider.name}:`, streamData.type);
    
    if (streamData.type === 'hls' || streamData.url.includes('.m3u8')) {
      this.loadHLS(streamData.url);
    } else if (streamData.type === 'iframe') {
      this.loadIframe(streamData.url);
    } else {
      this.loadDirect(streamData.url);
    }
    
    // Track analytics
    if (window.analytics) {
      analytics.trackVideoPlay({
        title: this.currentItem.title.en || this.currentItem.title,
        id: this.currentItem.id,
        type: this.currentItem.type || 'movie',
        provider: provider.name,
        quality: streamData.quality
      });
    }
  }
  
  loadHLS(url) {
    if (this.hls) {
      this.hls.destroy();
    }
    
    if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      this.video.src = url;
      this.video.play();
    } else if (window.Hls && Hls.isSupported()) {
      // HLS.js
      this.hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000
      });
      
      this.hls.loadSource(url);
      this.hls.attachMedia(this.video);
      
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.video.play();
        this.setupQualitySelector();
      });
      
      this.hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          ToxicUtils.showNotification('Stream error, trying next provider...', 'error');
        }
      });
    }
  }
  
  loadDirect(url) {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    
    this.video.src = url;
    this.video.play();
  }
  
  loadIframe(url) {
    const container = document.getElementById('player-container');
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    
    // Replace video with iframe
    if (this.video) {
      this.video.replaceWith(iframe);
      this.video = null;
    } else {
      container.innerHTML = '';
      container.appendChild(iframe);
    }
  }
  
  setupControls() {
    const playPauseBtn = document.getElementById('play-pause');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    if (playPauseBtn && this.video) {
      playPauseBtn.addEventListener('click', () => {
        if (this.video.paused) {
          this.video.play();
        } else {
          this.video.pause();
        }
      });
    }
    
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        const container = document.getElementById('player-container');
        if (!document.fullscreenElement) {
          container.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      });
    }
    
    if (downloadBtn && this.currentItem) {
      downloadBtn.addEventListener('click', () => {
        if (window.downloadManager) {
          downloadManager.downloadCurrent();
        }
      });
    }
  }
  
  setupEventListeners() {
    if (!this.video) return;
    
    // Progress bar
    const progressBar = document.getElementById('progress-bar');
    const progressFilled = document.getElementById('progress-filled');
    
    this.video.addEventListener('timeupdate', () => {
      const percent = (this.video.currentTime / this.video.duration) * 100;
      if (progressFilled) {
        progressFilled.style.width = `${percent}%`;
      }
      
      // Update time display
      const currentTime = document.getElementById('current-time');
      const duration = document.getElementById('duration');
      if (currentTime) currentTime.textContent = this.formatTime(this.video.currentTime);
      if (duration) duration.textContent = this.formatTime(this.video.duration);
      
      // Track progress
      if (window.analytics && this.currentItem) {
        analytics.trackVideoProgress(this.currentItem, this.video.currentTime, this.video.duration);
      }
    });
    
    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.video.currentTime = percent * this.video.duration;
      });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.video) return;
      
      switch(e.key) {
        case ' ':
          e.preventDefault();
          this.video.paused ? this.video.play() : this.video.pause();
          break;
        case 'f':
          document.getElementById('fullscreen-btn')?.click();
          break;
        case 'm':
          this.video.muted = !this.video.muted;
          break;
        case 'ArrowLeft':
          this.video.currentTime -= 10;
          break;
        case 'ArrowRight':
          this.video.currentTime += 10;
          break;
      }
    });
  }
  
  setupQualitySelector() {
    if (!this.hls) return;
    
    const qualityBtn = document.getElementById('quality-btn');
    if (!qualityBtn) return;
    
    const levels = this.hls.levels;
    if (levels.length <= 1) return;
    
    // Create quality menu
    const menu = document.createElement('div');
    menu.className = 'quality-menu';
    
    // Auto option
    const autoBtn = document.createElement('button');
    autoBtn.textContent = 'Auto';
    autoBtn.onclick = () => {
      this.hls.currentLevel = -1;
      qualityBtn.textContent = 'Auto';
      menu.remove();
    };
    menu.appendChild(autoBtn);
    
    // Quality levels
    levels.forEach((level, index) => {
      const btn = document.createElement('button');
      btn.textContent = `${level.height}p`;
      btn.onclick = () => {
        this.hls.currentLevel = index;
        qualityBtn.textContent = `${level.height}p`;
        menu.remove();
      };
      menu.appendChild(btn);
    });
    
    qualityBtn.onclick = () => {
      if (document.querySelector('.quality-menu')) {
        document.querySelector('.quality-menu').remove();
      } else {
        qualityBtn.after(menu);
      }
    };
  }
  
  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  destroy() {
    if (this.hls) {
      this.hls.destroy();
    }
  }
}

// Initialize player
let videoPlayer;
if (document.getElementById('video-player')) {
  videoPlayer = new VideoPlayer();
}