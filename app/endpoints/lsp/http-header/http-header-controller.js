
module.exports = {
  httpHeader(req, res) {
    return res.status(200).json({ req: req.headers, res: res.getHeaders() });
  },
};
