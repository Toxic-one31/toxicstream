const WebTorrent = require('webtorrent');
const parseTorrent = require('parse-torrent');

class TorrentStreamer {
  constructor() {
    this.client = new WebTorrent();
    this.activeTorrents = new Map();
    console.log('🌊 Torrent Streamer initialized');
  }
  
  async streamTorrent(magnetOrTorrentUrl, id) {
    return new Promise((resolve, reject) => {
      if (this.activeTorrents.has(id)) {
        return resolve(this.activeTorrents.get(id));
      }
      
      this.client.add(magnetOrTorrentUrl, { path: `/tmp/torrents/${id}` }, (torrent) => {
        console.log(`✅ Torrent added: ${torrent.name}`);
        
        const videoFile = torrent.files
          .filter(file => this.isVideoFile(file.name))
          .sort((a, b) => b.length - a.length)[0];
        
        if (!videoFile) {
          return reject(new Error('No video file found in torrent'));
        }
        
        const streamData = {
          torrent,
          file: videoFile,
          infoHash: torrent.infoHash,
          name: videoFile.name,
          size: videoFile.length,
          progress: 0
        };
        
        this.activeTorrents.set(id, streamData);
        
        torrent.on('download', () => {
          streamData.progress = (torrent.progress * 100).toFixed(2);
        });
        
        resolve(streamData);
      });
    });
  }
  
  getStreamHandler(id) {
    const streamData = this.activeTorrents.get(id);
    
    if (!streamData) {
      throw new Error('Torrent not found');
    }
    
    return (req, res) => {
      const { file } = streamData;
      const range = req.headers.range;
      
      if (!range) {
        res.status(416).send('Range header required');
        return;
      }
      
      const positions = range.replace(/bytes=/, '').split('-');
      const start = parseInt(positions[0], 10);
      const end = positions[1] ? parseInt(positions[1], 10) : file.length - 1;
      const chunksize = (end - start) + 1;
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${file.length}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4'
      });
      
      const stream = file.createReadStream({ start, end });
      stream.pipe(res);
    };
  }
  
  async getTorrentInfo(magnetOrTorrentUrl) {
    return new Promise((resolve, reject) => {
      parseTorrent.remote(magnetOrTorrentUrl, (err, parsedTorrent) => {
        if (err) return reject(err);
        
        resolve({
          name: parsedTorrent.name,
          infoHash: parsedTorrent.infoHash,
          files: parsedTorrent.files?.map(f => ({
            name: f.name,
            length: f.length
          })) || []
        });
      });
    });
  }
  
  removeTorrent(id) {
    const streamData = this.activeTorrents.get(id);
    
    if (streamData) {
      streamData.torrent.destroy();
      this.activeTorrents.delete(id);
      console.log(`🗑️ Torrent removed: ${id}`);
    }
  }
  
  isVideoFile(filename) {
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }
  
  getActiveTorrents() {
    const torrents = [];
    
    this.activeTorrents.forEach((data, id) => {
      torrents.push({
        id,
        name: data.name,
        progress: data.progress,
        size: data.size,
        infoHash: data.infoHash
      });
    });
    
    return torrents;
  }
}

module.exports = new TorrentStreamer();