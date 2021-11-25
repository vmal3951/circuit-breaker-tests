const pidusage = require('pidusage');
const os = require('os');
const v8 = require('v8');

let eventLoopStats; // eslint-disable-line

try {
  eventLoopStats = require('event-loop-stats'); // eslint-disable-line
} catch (error) {
  console.warn('event-loop-stats not found, ignoring event loop metrics...');
}

module.exports = (cb) => {
  pidusage(process.pid, (err, stat) => {
    // Convert from B to MB
    stat.memory = stat.memory / 1024 / 1024;
    stat.load = os.loadavg();
    stat.timestamp = Date.now();
    stat.heap = v8.getHeapStatistics();

    if (eventLoopStats) {
      stat.loop = eventLoopStats.sense();
    }

    cb(stat)
  });
}
