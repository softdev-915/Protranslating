const Promise = require('bluebird');

const loadData = (schema, data) => Promise.map(Object.keys(data), (key) => {
  if (data[key]) {
    if (Array.isArray(data[key])) {
      return Promise.all(data[key].filter(v => v).map(o => new schema[key](o).save()));
    }
    return new schema[key](data[key]).save();
  }
});

module.exports = {
  loadData,
};
