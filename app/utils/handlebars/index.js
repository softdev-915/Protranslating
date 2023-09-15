const dateHelpers = require('./date');
const documentHelpers = require('./document');
const userHelpers = require('./user');
const accountingHelpers = require('./accounting');
const taskHelpers = require('./task');

const _loadHelperGroup = (handlebars, helperGroup) => {
  const helpers = Object.keys(helperGroup);
  helpers.forEach((h) => {
    handlebars.registerHelper(h, helperGroup[h]);
  });
};

const loadHelpers = (handlebars) => {
  _loadHelperGroup(handlebars, dateHelpers);
  _loadHelperGroup(handlebars, documentHelpers);
  _loadHelperGroup(handlebars, userHelpers);
  _loadHelperGroup(handlebars, accountingHelpers);
  _loadHelperGroup(handlebars, taskHelpers);
};

module.exports = loadHelpers;
