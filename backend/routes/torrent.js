const express = require('express');
const router = express.Router();
const torrentStreamer = require('../utils/torrent');
const crypto = require('crypto');

router.post('/stream', async (req, res) => {
  try {
    const { magnet, torrentUrl } = req.body;
    
    if (!magnet && !torrentUrl) {
      return res.status(400).json({ error: 'Magnet or torrent URL required' });
    }
    
    const source = magnet || torrentUrl;
    const id = crypto.createHash('md5').update(source).digest('hex');
    
    console.log(`🌊 Starting torrent stream: ${id}`);
    
    const streamData = await torrentStreamer.streamTorrent(source, id);
    
    res.json({
      id,
      name: streamData.name,
      size: streamData.size,
      streamUrl: `/api/torrent/video/${id}`,
      progress: streamData.progress
    });
    
  } catch (error) {
    console.error('Torrent stream error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/video/:id', (req, res) => {
  try {
    const { id } = req.params;
    const handler = torrentStreamer.getStreamHandler(id);
    handler(req, res);
  } catch (error) {
    console.error('Video stream error:', error);
    res.status(404).json({ error: 'Torrent not found' });
  }
});

router.get('/info', async (req, res) => {
  try {
    const { magnet, url } = req.query;
    
    if (!magnet && !url) {
      return res.status(400).json({ error: 'Magnet or URL required' });
    }
    
    const info = await torrentStreamer.getTorrentInfo(magnet || url);
    res.json(info);
    
  } catch (error) {
    console.error('Torrent info error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/active', (req, res) => {
  const torrents = torrentStreamer.getActiveTorrents();
  res.json({ count: torrents.length, torrents });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  torrentStreamer.removeTorrent(id);
  res.json({ message: 'Torrent removed', id });
});

module.exports = router;