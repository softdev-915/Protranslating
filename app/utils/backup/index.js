const { ObjectId } = require('mongoose').Types;

module.exports.monthPeriodQuery = ({ date, attribute, lspId }) => {
  const dateUtc = date.utc();
  const lsp = attribute === 'timestamp' ? lspId : new ObjectId(lspId);
  return {
    lspId: lsp,
    [attribute]: {
      $gte: dateUtc.startOf('month').startOf('day').toDate(),
      $lte: dateUtc.endOf('month').endOf('day').toDate(),
    },
  };
};
