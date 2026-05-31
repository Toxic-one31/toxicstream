const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    timestamp: new Date().toISOString(),
    memory: {
      used: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`
    },
    version: '2.0.0',
    providers: 18
  });
});

module.exports = router;