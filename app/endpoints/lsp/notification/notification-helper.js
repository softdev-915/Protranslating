const _ = require('lodash');

const queryTranslatorFactory = req => (query) => {
  const filter = _.get(query, 'paginationParams.filter');
  if (filter) {
    try {
      const parsedFilter = JSON.parse(filter);
      if (parsedFilter.subject) {
        parsedFilter['email.subject'] = new RegExp(`.*${parsedFilter.subject}.*`);
        delete parsedFilter.subject;
      }
      if (parsedFilter.to) {
        parsedFilter['email.to'] = {
          $elemMatch: {
            email: new RegExp(`.*${parsedFilter.to}.*`),
          },
        };
        delete parsedFilter.to;
      }
      query.paginationParams.filter = parsedFilter;
    } catch (err) {
      const message = err.message || err;
      req.$logger.warn(`Error parsing filter as json: ${filter}. Error ${message}`);
    }
  }
  return query;
};

module.exports = {
  queryTranslatorFactory,
};
