const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const replacementDict = {
  customers: 'companies',
  Customers: 'Companies',
  CUSTOMERS: 'COMPANIES',
  customer: 'company',
  Customer: 'Company',
  CUSTOMER: 'COMPANY',
};

const replaceText = (text) => {
  if (typeof text !== 'string') {
    throw new Error('String was expected');
  }

  const rules = Object.keys(replacementDict);

  rules.forEach((k) => {
    text = text.replace(new RegExp(k, 'g'), replacementDict[k]);
  });
  return text;
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    // write your migration logic here.
    const schedulers = db.collection('schedulers');
    const collections = {
      schedulers,
    };
    return collections.schedulers.find().toArray()
      .then((dbSchedulers) => {
        const promises = [];
        dbSchedulers.forEach((scheduler) => {
        // set scheduler.email.variables.request.customer
          const hasCustomer = _.get(scheduler, 'email.variables.request.customer.name', false);
          if (hasCustomer) {
            delete scheduler.email.variables.request.customer;
            scheduler.email.variables.request.company = {};
            scheduler.email.variables.request.company.name = 'Company';
          }

          const hasCustomerName = _.get(scheduler, 'email.variables.quote.customerName', false);
          if (hasCustomerName && typeof hasCustomerName === 'string') {
            delete scheduler.email.variables.quote.customerName;
            scheduler.email.variables.quote.companyName = hasCustomerName;
          }

          // replace subject
          const hasSubject = _.get(scheduler, 'email.subject', false);
          if (hasSubject && typeof hasSubject === 'string') {
            scheduler.email.subject = replaceText(hasSubject);
          }

          // replace template
          const hasTemplate = _.get(scheduler, 'email.template', false);
          if (hasTemplate && typeof hasTemplate === 'string') {
            scheduler.email.template = replaceText(hasTemplate);
          }
          // eslint-disable-next-line arrow-body-style
          promises.push(() => {
            return collections.schedulers.update({ _id: scheduler._id },
              { $set: scheduler });
          });
        });
        // Copy all schedulers
        return Promise.resolve(promises).mapSeries(f => f());
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
