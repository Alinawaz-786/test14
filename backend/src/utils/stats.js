const fs = require('fs').promises;
const fsSync = require('fs');

class StatsManager {
  constructor(dataPath) {
    this.dataPath = dataPath;
    this.cache = null;
    this.lastCalculated = 0;
    this.setupWatcher();
  }

  setupWatcher() {
    fsSync.watch(this.dataPath, (eventType) => {
      if (eventType === 'change') {
        // Invalidate cache when file changes
        this.cache = null;
      }
    });
  }

  async calculateStats() {
    try {
      const raw = await fs.readFile(this.dataPath, 'utf8');
      const items = JSON.parse(raw);
      
      const stats = {
        total: items.length,
        averagePrice: this.mean(items.map(item => item.price)),
        lastCalculated: new Date().toISOString()
      };

      this.cache = stats;
      this.lastCalculated = Date.now();
      return stats;
    } catch (err) {
      throw err;
    }
  }

  async getStats() {
    if (!this.cache) {
      return this.calculateStats();
    }
    return this.cache;
  }

  mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
}

module.exports = StatsManager;