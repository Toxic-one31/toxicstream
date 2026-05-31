const express = require('express');
const router = express.Router();
const scrapers = require('../scrapers');

router.get('/', async (req, res) => {
  try {
    const { url, provider } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    console.log(`🎬 Extracting stream: ${url}`);
    
    const streamData = await scrapers.getStream(provider, url);
    
    if (!streamData) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    res.json(streamData);
    
  } catch (error) {
    console.error('Stream extraction error:', error);
    res.status(500).json({ 
      error: 'Stream extraction failed',
      message: error.message 
    });
  }
});

router.get('/episodes', async (req, res) => {
  try {
    const { id, provider, season } = req.query;
    
    if (!id || !provider) {
      return res.status(400).json({ error: 'ID and provider required' });
    }
    
    const episodes = await scrapers.getEpisodes(provider, id, season);
    
    res.json({
      id,
      provider,
      season: season || 1,
      count: episodes.length,
      episodes
    });
    
  } catch (error) {
    console.error('Episode fetch error:', error);
    res.status(500).json({ 
      error: 'Episode fetch failed',
      message: error.message 
    });
  }
});

module.exports = router;