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
    const documentation = db.collection('documentation');
    const collections = {
      documentation,
    };
    return collections.documentation.find({}).toArray()
      .then((dbDocuments) => {
      // Other docs can also mention customers
      // so { name: 'customer-management' } will not be enough
      // any reference to customer will be replaced

        const promises = [];
        dbDocuments.forEach((dbDoc) => {
          const hasName = _.get(dbDoc, 'name', false);
          if (hasName && typeof hasName === 'string') {
            dbDoc.name = replaceText(hasName);
          }

          const hasTitle = _.get(dbDoc, 'title', false);
          if (hasTitle && typeof hasTitle === 'string') {
            dbDoc.title = replaceText(hasTitle);
          }

          const hasHelp = _.get(dbDoc, 'help', false);
          if (hasHelp && typeof hasHelp === 'string') {
            dbDoc.help = replaceText(hasHelp);
          }

          const hasUnformattedHelp = _.get(dbDoc, 'unformattedHelp', false);
          if (hasUnformattedHelp && typeof hasUnformattedHelp === 'string') {
            dbDoc.unformattedHelp = replaceText(hasUnformattedHelp);
          }

          // eslint-disable-next-line arrow-body-style
          promises.push(() => {
            return collections.documentation.update({ _id: dbDoc._id },
              { $set: dbDoc });
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
