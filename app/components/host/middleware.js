const os = require('os');

const HOSTNAME = os.hostname();

module.exports = () => (_req, res, next) => {
  res.setHeader('lms-node', HOSTNAME);
  res.setHeader('Env', process.env.NODE_ENV);
  next();
};
