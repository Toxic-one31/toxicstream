const flixter = require('./flixter');
const flixer = require('./flixer');
const rivestream = require('./rivestream');
const tmovie = require('./tmovie');
const dopebox = require('./dopebox');
const lookmovie = require('./lookmovie');
const animepahe = require('./animepahe');
const fmovies = require('./fmovies');
const goojara = require('./goojara');
const yts = require('./yts');
const solarmovie = require('./solarmovie');
const sflix = require('./sflix');
const watchcartoon = require('./watchcartoon');
const dramacool = require('./dramacool');

const scrapers = {
  rivestream,
  flixter,
  flixer,
  tmovie,
  dopebox,
  lookmovie,
  animepahe,
  fmovies,
  goojara,
  yts,
  solarmovie,
  sflix,
  watchcartoon,
  dramacool
};

async function search(provider, query, type = 'all') {
  const scraper = scrapers[provider];
  
  if (!scraper) {
    throw new Error(`Provider "${provider}" not found`);
  }
  
  return await scraper.search(query, type);
}

async function searchAll(query, type = 'all') {
  const promises = Object.entries(scrapers).map(async ([name, scraper]) => {
    try {
      if (type !== 'anime' && name === 'animepahe') return [];
      if (type !== 'anime' && name === 'watchcartoon') return [];
      if (type !== 'kdrama' && name === 'dramacool') return [];
      if (type === 'anime' && ['yts'].includes(name)) return [];
      
      const results = await scraper.search(query, type);
      return results.map(r => ({ ...r, provider: name }));
    } catch (error) {
      console.error(`${name} search failed:`, error.message);
      return [];
    }
  });
  
  const allResults = await Promise.all(promises);
  const combined = allResults.flat();
  
  return deduplicateResults(combined);
}

async function getStream(provider, url) {
  const scraper = scrapers[provider];
  
  if (!scraper) {
    throw new Error(`Provider "${provider}" not found`);
  }
  
  return await scraper.getStream(url);
}

async function getEpisodes(provider, id, season = 1) {
  const scraper = scrapers[provider];
  
  if (!scraper || !scraper.getEpisodes) {
    throw new Error(`Provider "${provider}" does not support episodes`);
  }
  
  return await scraper.getEpisodes(id, season);
}

function deduplicateResults(results) {
  const seen = new Map();
  
  return results.filter(item => {
    const normalizedTitle = item.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    
    const key = `${normalizedTitle}_${item.year}`;
    
    if (seen.has(key)) {
      const existing = seen.get(key);
      if (compareQuality(item, existing) > 0) {
        seen.set(key, item);
        return true;
      }
      return false;
    }
    
    seen.set(key, item);
    return true;
  });
}

function compareQuality(a, b) {
  const qualityOrder = { '2160p': 5, '4K': 5, '1080p': 4, '720p': 3, '480p': 2, 'CAM': 1 };
  const qualityA = qualityOrder[a.quality] || 0;
  const qualityB = qualityOrder[b.quality] || 0;
  return qualityA - qualityB;
}

module.exports = {
  search,
  searchAll,
  getStream,
  getEpisodes
};