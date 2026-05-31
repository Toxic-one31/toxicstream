/**
 * SEO Manager
 * Meta tags, Open Graph, Schema.org
 */

class SEOManager {
  constructor() {
    this.config = null;
    this.init();
  }
  
  async init() {
    try {
      this.config = await contentFetcher.fetchConfig();
    } catch (error) {
      console.error('SEO init error:', error);
    }
  }
  
  setPageMeta(data) {
    document.title = data.title 
      ? `${data.title} - ${this.config?.siteName || 'ToxicStream'}`
      : this.config?.seo?.title || 'ToxicStream';
    
    this.setMeta('description', data.description || this.config?.seo?.description);
    this.setMeta('keywords', data.keywords?.join(', ') || this.config?.seo?.keywords?.join(', '));
    
    this.setLink('canonical', data.canonical || window.location.href);
    
    this.setOpenGraph(data);
    this.setTwitterCard(data);
    this.setSchema(data);
  }
  
  setMeta(name, content) {
    if (!content) return;
    
    let meta = document.querySelector(`meta[name="${name}"]`);
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    
    meta.content = content;
  }
  
  setLink(rel, href) {
    if (!href) return;
    
    let link = document.querySelector(`link[rel="${rel}"]`);
    
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    
    link.href = href;
  }
  
  setOpenGraph(data) {
    this.setOGMeta('og:type', data.type || 'website');
    this.setOGMeta('og:title', data.title || this.config?.siteName);
    this.setOGMeta('og:description', data.description || this.config?.seo?.description);
    this.setOGMeta('og:url', data.canonical || window.location.href);
    this.setOGMeta('og:site_name', this.config?.siteName);
    this.setOGMeta('og:image', data.image || `${window.location.origin}/assets/images/og-image.jpg`);
  }
  
  setOGMeta(property, content) {
    if (!content) return;
    
    let meta = document.querySelector(`meta[property="${property}"]`);
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    
    meta.content = content;
  }
  
  setTwitterCard(data) {
    this.setTwitterMeta('twitter:card', 'summary_large_image');
    this.setTwitterMeta('twitter:title', data.title || this.config?.siteName);
    this.setTwitterMeta('twitter:description', data.description || this.config?.seo?.description);
    this.setTwitterMeta('twitter:image', data.image || `${window.location.origin}/assets/images/twitter-card.jpg`);
  }
  
  setTwitterMeta(name, content) {
    if (!content) return;
    
    let meta = document.querySelector(`meta[name="${name}"]`);
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    
    meta.content = content;
  }
  
  setSchema(data) {
    let schema;
    
    if (data.type === 'movie') {
      schema = this.createMovieSchema(data);
    } else if (data.type === 'website') {
      schema = this.createWebsiteSchema();
    } else {
      schema = this.createWebPageSchema(data);
    }
    
    this.injectSchema(schema);
  }
  
  createMovieSchema(movie) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Movie',
      'name': movie.title,
      'description': movie.description,
      'image': movie.poster,
      'datePublished': movie.releaseDate,
      'genre': movie.genres,
      'aggregateRating': movie.rating ? {
        '@type': 'AggregateRating',
        'ratingValue': movie.rating,
        'bestRating': '10'
      } : undefined
    };
  }
  
  createWebsiteSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': this.config?.siteName || 'ToxicStream',
      'url': window.location.origin,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': `${window.location.origin}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };
  }
  
  createWebPageSchema(data) {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': data.title || document.title,
      'description': data.description || this.config?.seo?.description,
      'url': window.location.href
    };
  }
  
  injectSchema(schema) {
    const existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) existing.remove();
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }
}

// Initialize
let seoManager;
document.addEventListener('DOMContentLoaded', () => {
  seoManager = new SEOManager();
});