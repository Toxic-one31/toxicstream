/**
 * Download Manager
 * Video download with progress tracking
 */

class DownloadManager {
  constructor() {
    this.downloads = this.loadDownloads();
    this.init();
  }
  
  init() {
    this.createDownloadUI();
  }
  
  createDownloadUI() {
    const playerControls = document.querySelector('.player-controls');
    if (!playerControls) return;
    
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
      downloadBtn.onclick = () => this.downloadCurrent();
    }
  }
  
  async downloadCurrent() {
    const video = document.querySelector('video');
    if (!video || !video.src) {
      this.showNotification('No video to download', 'error');
      return;
    }
    
    const title = document.querySelector('h1')?.textContent || 'video';
    const videoUrl = video.src;
    
    this.showNotification('Starting download...', 'info');
    
    try {
      if (this.isDirectVideoUrl(videoUrl)) {
        await this.directDownload(videoUrl, title);
      } else {
        await this.blobDownload(videoUrl, title);
      }
    } catch (error) {
      console.error('Download failed:', error);
      this.showNotification('Download failed', 'error');
    }
  }
  
  isDirectVideoUrl(url) {
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.webm'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  }
  
  async directDownload(url, title) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.sanitizeFilename(title)}.mp4`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    this.saveDownload({
      title,
      url,
      date: new Date().toISOString()
    });
    
    this.showNotification('Download started!', 'success');
    
    // Track download
    if (window.analytics) {
      analytics.trackDownload({ title, type: 'video' });
    }
  }
  
  async blobDownload(url, title) {
    this.showDownloadProgress(0);
    
    try {
      const response = await fetch(url);
      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength, 10);
      let loaded = 0;
      
      const reader = response.body.getReader();
      const chunks = [];
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        if (total) {
          const progress = (loaded / total) * 100;
          this.showDownloadProgress(progress);
        }
      }
      
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${this.sanitizeFilename(title)}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(blobUrl);
      
      this.saveDownload({
        title,
        url,
        size: this.formatBytes(loaded),
        date: new Date().toISOString()
      });
      
      this.hideDownloadProgress();
      this.showNotification('Download complete!', 'success');
      
    } catch (error) {
      this.hideDownloadProgress();
      throw error;
    }
  }
  
  showDownloadProgress(percent) {
    let progressBar = document.querySelector('.download-progress');
    
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'download-progress';
      progressBar.innerHTML = `
        <div class="progress-bar">
          <div class="progress-fill"></div>
          <span class="progress-text">Downloading: 0%</span>
        </div>
      `;
      document.body.appendChild(progressBar);
    }
    
    const fill = progressBar.querySelector('.progress-fill');
    const text = progressBar.querySelector('.progress-text');
    
    fill.style.width = `${percent}%`;
    text.textContent = `Downloading: ${Math.round(percent)}%`;
  }
  
  hideDownloadProgress() {
    const progressBar = document.querySelector('.download-progress');
    if (progressBar) {
      setTimeout(() => progressBar.remove(), 1000);
    }
  }
  
  saveDownload(download) {
    this.downloads.push(download);
    localStorage.setItem('toxicstream_downloads', JSON.stringify(this.downloads));
  }
  
  loadDownloads() {
    const saved = localStorage.getItem('toxicstream_downloads');
    return saved ? JSON.parse(saved) : [];
  }
  
  sanitizeFilename(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }
  
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  showNotification(message, type) {
    if (window.ToxicUtils) {
      ToxicUtils.showNotification(message, type);
    }
  }
}

// Initialize
let downloadManager;
document.addEventListener('DOMContentLoaded', () => {
  downloadManager = new DownloadManager();
});