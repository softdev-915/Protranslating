const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const users = db.collection('users');
    const taxForms = db.collection('taxForms');
    const countries = db.collection('countries');
    const leadSources = db.collection('leadSources');
    const intDep = db.collection('internalDepartments');
    return countries.find({}).toArray()
      .then(countryList => (
        intDep.find({}).toArray()
          .then(intDepList => (
            taxForms.find({}).toArray()
              .then(taxFormList => (
                leadSources.find({}).toArray()
                  .then(leadSourceList => (
                    users.find({}).toArray()
                      .then(userList => (
                        Promise.mapSeries(userList, (user) => {
                          const nationalityId = _.get(user, 'vendorDetails.nationality');
                          const nationality = countryList.find(c => c._id.equals(nationalityId));
                          const internalDepartmentsIds = _.get(user, 'vendorDetails.internalDepartments') ||
                            _.get(user, 'staffDetails.internalDepartments', []);
                          const internalDepartments = internalDepartmentsIds
                            .map(iId => intDepList.find(i => i._id.equals(iId)));
                          const hireDate = _.get(user, 'vendorDetails.hireDate', null);
                          const hireDateText = hireDate ? moment(hireDate).format('MM-DD-YYYY') : '';
                          const taxFormsIds = _.get(user, 'vendorDetails.billingInformation.taxForm', []);
                          const taxFormsArr = taxFormsIds
                            .map(tId => taxFormList.find(t => t._id.equals(tId)));
                          const salesRepId = _.get(user, 'contactDetails.salesRep', null);
                          const salesRep = salesRepId ?
                            userList.find(u => u._id.equals(salesRepId)) : {};
                          const salesRepText = `${_.get(salesRep, 'firstName', '')} ${_.get(salesRep, 'lastName', '')}`;
                          const leadSourceId = _.get(user, 'contactDetails.leadSource', null);
                          const leadSource = leadSourceId ?
                            leadSourceList.find(l => l._id.equals(leadSourceId)) : {};
                          return users.updateOne({
                            _id: user._id,
                          }, {
                            $set: {
                              nationalityText: _.get(nationality, 'name', ''),
                              mainPhoneText: _.get(user, 'contactDetails.mainPhone.number', '') +
                                _.get(user, 'contactDetails.mainPhone.number.ext', ''),
                              internalDepartmentsText: internalDepartments
                                .map(i => _.get(i, 'name', '')).join(', '),
                              hireDateText,
                              phoneNumberText: _.get(user, 'staffDetails.phoneNumber', '') ||
                                _.get(user, 'vendorDetails.phoneNumber', ''),
                              taxFormText: taxFormsArr.map(t => _.get(t, 'name', '')).join(', '),
                              salesRepText,
                              leadSourceText: _.get(leadSource, 'name', ''),
                              ataCertifiedText: _.get(user, 'vendorDetails.ataCertified', '').toString(),
                              escalatedText: _.get(user, 'vendorDetails.escalated', '').toString(),
                              fixedCostText: _.get(user, 'vendorDetails.billingInformation.fixedCost', '').toString(),
                              wtFeeWaivedText: _.get(user, 'vendorDetails.billingInformation.wtFeeWaived', '').toString(),
                              priorityPaymentText: _.get(user, 'vendorDetails.billingInformation.priorityPayment', '').toString(),
                            },
                          });
                        })
                      ))
                  ))
              ))
          ))
      ));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
