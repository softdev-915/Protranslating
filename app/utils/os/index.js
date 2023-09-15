const _ = require('lodash');
const uuidV4 = require('uuid').v4;

const getProcessId = () => {
  let uniqueProcessId = process.pid;
  if (_.isNil(uniqueProcessId)) {
    uniqueProcessId = uuidV4();
  }
  return uniqueProcessId;
};

const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    rss: usage.rss / (1024 * 1024 * 1024),
  };
};

module.exports = { getProcessId, getMemoryUsage };
