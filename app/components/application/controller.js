module.exports = {
  create(middleware) {
    return (req, res, next) => {
      middleware(req, res, next).catch(next);
    };
  },
};
