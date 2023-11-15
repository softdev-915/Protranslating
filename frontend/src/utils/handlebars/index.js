import * as arrayHelpers from './array';
import * as collectionHelpers from './collection';
import * as comparisonHelpers from './comparison';
import * as dateHelpers from './date';
import * as fsHelpers from './fs';
import * as htmlHelpers from './html';
import * as mathHelpers from './math';
import * as miscHelpers from './misc';
import * as numberHelpers from './number';
import * as objectHelpers from './object';
import * as stringHelpers from './string';
import * as ipHelpers from './ip';

// custom helpers
import * as documentHelpers from './document';
import * as userHelpers from './user';
import * as accountingHelpers from './accounting';
import * as invoiceHelpers from './invoice';

const _loadHelperGroup = (handlebars, helperGroup) => {
  const helpers = Object.keys(helperGroup);
  helpers.forEach((h) => {
    handlebars.registerHelper(h, helperGroup[h]);
  });
};

const loadHelpers = (handlebars) => {
  _loadHelperGroup(handlebars, arrayHelpers);
  _loadHelperGroup(handlebars, collectionHelpers);
  _loadHelperGroup(handlebars, comparisonHelpers);
  _loadHelperGroup(handlebars, dateHelpers);
  _loadHelperGroup(handlebars, fsHelpers);
  _loadHelperGroup(handlebars, htmlHelpers);
  _loadHelperGroup(handlebars, mathHelpers);
  _loadHelperGroup(handlebars, miscHelpers);
  _loadHelperGroup(handlebars, numberHelpers);
  _loadHelperGroup(handlebars, objectHelpers);
  _loadHelperGroup(handlebars, stringHelpers);
  _loadHelperGroup(handlebars, documentHelpers);
  _loadHelperGroup(handlebars, userHelpers);
  _loadHelperGroup(handlebars, ipHelpers);
  _loadHelperGroup(handlebars, accountingHelpers);
  _loadHelperGroup(handlebars, invoiceHelpers);
};

export default loadHelpers;
