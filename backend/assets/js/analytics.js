/**
 * Analytics Manager
 * Google Analytics 4 + Custom Analytics
 */

class AnalyticsManager {
  constructor() {
    this.config = null;
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.events = [];
    this.init();
  }
  
  async init() {
    try {
      this.config = await contentFetcher.fetchConfig();
      
      if (this.config.analytics?.googleAnalyticsId) {
        this.initGoogleAnalytics();
      }
      
      this.trackPageView();
      this.setupEventListeners();
      this.startFlushInterval();
      
      console.log('📊 Analytics initialized');
    } catch (error) {
      console.error('Analytics init error:', error);
    }
  }
  
  initGoogleAnalytics() {
    const gaId = this.config.analytics.googleAnalyticsId;
    
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script1);
    
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', gaId, {
      'send_page_view': false,
      'anonymize_ip': true
    });
    
    console.log('✅ Google Analytics loaded');
  }
  
  trackPageView(page = window.location.pathname) {
    const event = {
      type: 'page_view',
      page,
      title: document.title,
      timestamp: new Date().toISOString()
    };
    
    this.trackEvent(event);
    
    if (window.gtag) {
      gtag('event', 'page_view', {
        page_path: page,
        page_title: document.title
      });
    }
  }
  
  trackSearch(query, type, resultsCount) {
    const event = {
      type: 'search',
      query,
      contentType: type,
      resultsCount,
      timestamp: new Date().toISOString()
    };
    
    this.trackEvent(event);
    
    if (window.gtag) {
      gtag('event', 'search', {
        search_term: query,
        content_type: type,
        results: resultsCount
      });
    }
  }
  
  trackVideoPlay(videoData) {
    const event = {
      type: 'video_play',
      title: videoData.title,
      id: videoData.id,
      contentType: videoData.type,
      provider: videoData.provider,
      timestamp: new Date().toISOString()
    };
    
    this.trackEvent(event);
    
    if (window.gtag) {
      gtag('event', 'video_start', {
        video_title: videoData.title,
        video_provider: videoData.provider
      });
    }
  }
  
  trackVideoProgress(videoData, progress, duration) {
    const milestones = [25, 50, 75, 100];
    const currentProgress = (progress / duration) * 100;
    
    milestones.forEach(milestone => {
      if (!videoData[`tracked_${milestone}`] && currentProgress >= milestone) {
        videoData[`tracked_${milestone}`] = true;
        
        const event = {
          type: 'video_progress',
          title: videoData.title,
          milestone: `${milestone}%`,
          timestamp: new Date().toISOString()
        };
        
        this.trackEvent(event);
        
        if (window.gtag) {
          gtag('event', 'video_progress', {
            video_title: videoData.title,
            video_percent: milestone
          });
        }
      }
    });
  }
  
  trackWatchlistAdd(item) {
    const event = {
      type: 'watchlist_add',
      title: item.title,
      contentType: item.type,
      timestamp: new Date().toISOString()
    };
    
    this.trackEvent(event);
    
    if (window.gtag) {
      gtag('event', 'add_to_watchlist', {
        item_name: item.title
      });
    }
  }
  
  trackDownload(item) {
    const event = {
      type: 'download',
      title: item.title,
      contentType: item.type,
      timestamp: new Date().toISOString()
    };
    
    this.trackEvent(event);
    
    if (window.gtag) {
      gtag('event', 'file_download', {
        file_name: item.title
      });
    }
  }
  
  trackError(error, context) {
    const event = {
      type: 'error',
      message: error.message,
      context,
      timestamp: new Date().toISOString()
    };
    
    this.trackEvent(event);
    
    if (window.gtag) {
      gtag('event', 'exception', {
        description: error.message,
        fatal: false
      });
    }
  }
  
  trackEvent(event) {
    event.sessionId = this.sessionId;
    event.userId = this.userId;
    event.page = window.location.pathname;
    
    this.events.push(event);
    
    // Also save to localStorage
    this.saveEvent(event);
  }
  
  async flushEvents() {
    if (this.events.length === 0) return;
    
    const eventsToSend = [...this.events];
    this.events = [];
    
    try {
      if (this.config?.analytics?.endpoint) {
        await fetch(this.config.analytics.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: eventsToSend })
        });
      }
    } catch (error) {
      console.error('Analytics flush error:', error);
      this.events = [...eventsToSend, ...this.events];
    }
  }
  
  startFlushInterval() {
    setInterval(() => this.flushEvents(), 30000);
    
    window.addEventListener('beforeunload', () => this.flushEvents());
  }
  
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getUserId() {
    let userId = localStorage.getItem('toxicstream_user_id');
    
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('toxicstream_user_id', userId);
    }
    
    return userId;
  }
  
  saveEvent(event) {
    try {
      const events = JSON.parse(localStorage.getItem('toxicstream_analytics') || '[]');
      events.push(event);
      
      if (events.length > 1000) {
        events.shift();
      }
      
      localStorage.setItem('toxicstream_analytics', JSON.stringify(events));
    } catch (error) {
      console.error('Event save error:', error);
    }
  }
  
  setupEventListeners() {
    document.addEventListener('search-performed', (e) => {
      this.trackSearch(e.detail.query, e.detail.type, e.detail.results);
    });
    
    window.addEventListener('error', (e) => {
      this.trackError(e.error, 'global_error');
    });
  }
}

// Initialize
let analytics;
document.addEventListener('DOMContentLoaded', () => {
  analytics = new AnalyticsManager();
});