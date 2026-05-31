/**
 * Content Fetcher
 * Auto-updating JSON loader with caching
 */

class ContentFetcher {
  constructor() {
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }
  
  async fetch(url) {
    const cached = this.cache.get(url);
    const now = Date.now();
    
    // Return cache if fresh
    if (cached && (now - cached.timestamp) < this.cacheDuration) {
      return cached.data;
    }
    
    try {
      const response = await fetch(url + '?t=' + now);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update cache
      this.cache.set(url, {
        data,
        timestamp: now
      });
      
      return data;
      
    } catch (error) {
      console.error('Fetch error:', error);
      
      // Return stale cache if available
      if (cached) {
        console.warn('Using stale cache');
        return cached.data;
      }
      
      throw error;
    }
  }
  
  async fetchConfig() {
    return this.fetch('/data/config.json');
  }
  
  async fetchMovies() {
    return this.fetch('/data/movies.json');
  }
  
  async fetchAnime() {
    return this.fetch('/data/anime.json');
  }
  
  async fetchProviders() {
    return this.fetch('/data/providers.json');
  }
  
  async fetchGenres() {
    return this.fetch('/data/genres.json');
  }
  
  clearCache() {
    this.cache.clear();
    console.log('Cache cleared');
  }
}

// Initialize global fetcher
window.contentFetcher = new ContentFetcher();