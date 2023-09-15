const fs = require('fs');
const v8 = require('v8');
const moment = require('moment');
const configuration = require('../configuration');
const { getProcessId, getMemoryUsage } = require('../../utils/os/index');

const {
  HEAPDUMP_AFTER_TIME,
  HEAPDUMP_BEFORE_TIME,
  HEAP_SNAPSHOT_MEM_LOWER_LIMIT_GB,
  HEAP_SNAPSHOT_MEM_UPPER_LIMIT_GB,
} = configuration.environment;
const _getHeapSnapshotFilePath = () => `/tmp/${getProcessId()}.heapsnapshot`;
const createHeapSnapshot = (logger) => {
  const heapSnapshotFilePath = _getHeapSnapshotFilePath();
  logger.debug(`Creating heap snapshot, path ${heapSnapshotFilePath}`);
  const fileStream = fs.createWriteStream(heapSnapshotFilePath);
  const v8HeapSnapshotStream = v8.getHeapSnapshot();
  v8HeapSnapshotStream.pipe(fileStream);
  v8HeapSnapshotStream.on('finish', () => {
    logger.debug(`Heap snapshot created, path ${heapSnapshotFilePath}`);
  });
};
function isWithinTimeRange() {
  const currentTime = moment.utc();
  const startTime = moment.utc(HEAPDUMP_AFTER_TIME, 'HH:mm');
  const endTime = moment.utc(HEAPDUMP_BEFORE_TIME, 'HH:mm');
  return currentTime.isBetween(startTime, endTime);
}

const createHeapSnapshotIfNeeded = (logger) => {
  if (!isWithinTimeRange()) {
    return;
  }
  try {
    const memoryUsage = getMemoryUsage(); // GB
    const heapSnapshotFilePath = _getHeapSnapshotFilePath();
    if (memoryUsage.rss > HEAP_SNAPSHOT_MEM_LOWER_LIMIT_GB
      && memoryUsage.rss < HEAP_SNAPSHOT_MEM_UPPER_LIMIT_GB) {
      if (!fs.existsSync(heapSnapshotFilePath)) {
        createHeapSnapshot(logger);
      }
    }
  } catch (error) {
    logger.debug(`Failed to create heap snapshot: ${error}`);
  }
};

module.exports = {
  createHeapSnapshot,
  createHeapSnapshotIfNeeded,
};
