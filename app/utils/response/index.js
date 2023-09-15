const cacheForever = (res) => {
  res.setHeader('Cache-Control', 'max-age=31556926');
};

module.exports = {
  cacheForever,
};
