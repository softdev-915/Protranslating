/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const TAX_ID_FORMS = ['1099 Eligible', 'W-9'];
const ELIGIBLE_TAX_FORM = '1099 Eligible';
const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const billsCol = db.collection('bills');
  const usersCol = db.collection('users');
  const taxFormCol = db.collection('taxForms');
  const cursor = await billsCol.find({
    vendor: { $exists: true },
  });
  while (await cursor.hasNext()) {
    const bill = await cursor.next();
    const vendor = await usersCol.findOne({ _id: bill.vendor });
    if (_.isNil(vendor) || _.isNil(vendor.vendorDetails)) return;
    const { billingInformation } = vendor.vendorDetails;
    const taxForms = _.get(billingInformation, 'taxForm', []);
    const taxFormsInDb = await taxFormCol.find({
      _id: { $in: taxForms },
    }, 'name').toArray();
    await billsCol.updateOne({ _id: bill._id }, {
      $set: {
        hasTaxIdForms: _.defaultTo(taxFormsInDb, []).some(t => TAX_ID_FORMS.includes(t.name)),
        has1099EligibleForm: _.defaultTo(taxFormsInDb, [])
          .some(t => ELIGIBLE_TAX_FORM.includes(t.name)),
      },
    });
  }
};

if (require.main === module) {
  migration().then(() => process.exit(0));
} else {
  module.exports = migration;
}
