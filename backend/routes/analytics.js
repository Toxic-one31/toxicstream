const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const ANALYTICS_DIR = path.join(__dirname, '../data/analytics');

fs.mkdir(ANALYTICS_DIR, { recursive: true }).catch(console.error);

router.post('/', async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid events data' });
    }
    
    const date = new Date().toISOString().split('T')[0];
    const filename = path.join(ANALYTICS_DIR, `${date}.json`);
    
    let existingData = [];
    try {
      const data = await fs.readFile(filename, 'utf8');
      existingData = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet
    }
    
    existingData.push(...events);
    
    await fs.writeFile(filename, JSON.stringify(existingData, null, 2));
    
    console.log(`📊 Saved ${events.length} analytics events`);
    
    res.json({ success: true, saved: events.length });
    
  } catch (error) {
    console.error('Analytics save error:', error);
    res.status(500).json({ error: 'Failed to save analytics' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const files = await fs.readdir(ANALYTICS_DIR);
    const recentFiles = files.slice(-parseInt(days));
    
    let allEvents = [];
    
    for (const file of recentFiles) {
      const data = await fs.readFile(path.join(ANALYTICS_DIR, file), 'utf8');
      allEvents.push(...JSON.parse(data));
    }
    
    const summary = {
      totalEvents: allEvents.length,
      pageViews: allEvents.filter(e => e.type === 'page_view').length,
      searches: allEvents.filter(e => e.type === 'search').length,
      videoPlays: allEvents.filter(e => e.type === 'video_play').length,
      downloads: allEvents.filter(e => e.type === 'download').length,
      uniqueUsers: new Set(allEvents.map(e => e.userId)).size,
      uniqueSessions: new Set(allEvents.map(e => e.sessionId)).size
    };
    
    res.json(summary);
    
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

module.exports = router;