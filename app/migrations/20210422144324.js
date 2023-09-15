const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const breakdownUnitsMapping = {
  Reps: {
    breakdown: 'Repetitions',
    translationUnit: 'Words',
  },
  '101%': {
    breakdown: '101%',
    translationUnit: 'Words',
  },
  '100%': {
    breakdown: '100%',
    translationUnit: 'Words',
  },
  '99-95%': {
    breakdown: '95-99%',
    translationUnit: 'Words',
  },
  '94-85%': {
    breakdown: '85-94%',
    translationUnit: 'Words',
  },
  '84-75%': {
    breakdown: '75-84%',
    translationUnit: 'Words',
  },
  'No Match': {
    breakdown: 'No Match',
    translationUnit: 'Words',
  },
  Fuzzy: {
    breakdown: 'Fuzzy Matches',
    translationUnit: 'Words',
  },
  Hourly: {
    breakdown: null,
    translationUnit: 'Hour',
  },
  Pages: {
    breakdown: null,
    translationUnit: 'Page',
  },
  Minutes: {
    breakdown: null,
    translationUnit: 'Minute',
  },
};

const processRequest = async (request, db) => {
  const translationUnitCol = db.collection('translationUnits');
  const breakdownCol = db.collection('breakdowns');
  await Promise.map(request.workflows, async (workflow) => {
    await Promise.map(workflow.tasks, async (task) => {
      await Promise.map(task.providerTasks, async (providerTask) => {
        if (_.isNil(providerTask.quantity)) {
          return Promise.resolve();
        }
        await Promise.map(providerTask.quantity, async (quantity, quantityIndex) => {
          const { amount, units } = quantity;
          const breakdownUnit = _.get(breakdownUnitsMapping, units);
          const breakdown = _.get(breakdownUnit, 'breakdown');
          const translationUnit = _.get(breakdownUnit, 'translationUnit');
          const translationUnitDb = await translationUnitCol.findOne(
            { name: translationUnit, lspId: request.lspId });
          const breakdownDb = await breakdownCol.findOne(
            { name: breakdown, lspId: request.lspId });
          if (_.isNil(providerTask.billDetails)) {
            providerTask.billDetails = [];
          }
          if (!_.isNil(providerTask.billDetails[quantityIndex])) {
            Object.assign(providerTask.billDetails[quantityIndex], {
              quantity: amount,
            });
          } else {
            providerTask.billDetails.push({
              quantity: amount,
            });
          }
          if (_.isNil(task.invoiceDetails)) {
            task.invoiceDetails = [];
          }
          let invoiceBreakdown;
          if (_.isNil(breakdownDb)) {
            invoiceBreakdown = null;
          } else {
            invoiceBreakdown = _.pick(breakdownDb, ['_id', 'name']);
          }
          let invoiceUnit;
          if (_.isNil(translationUnitDb)) {
            invoiceUnit = null;
          } else {
            invoiceUnit = _.pick(translationUnitDb, ['_id', 'name']);
          }
          const newInvoiceDetail = {
            invoice: {
              breakdown: invoiceBreakdown,
              translationUnit: invoiceUnit,
              unitPrice: 0,
              quantity: 0,
            },
            projectedCost: {
              breakdown: null,
              translationUnit: null,
              unitPrice: 0,
              quantity: 0,
            },
          };
          if (!_.isNil(task.invoiceDetails[quantityIndex])) {
            Object.assign(task.invoiceDetails[quantityIndex], newInvoiceDetail);
          } else {
            task.invoiceDetails.push(newInvoiceDetail);
          }
        });
      });
    });
  });
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const requestsCol = db.collection('requests');
    const breakdownCol = db.collection('breakdowns');
    let breakdownCreated = false;
    const stream = requestsCol.find({
      workflows: {
        $exists: true,
        $not: { $size: 0 },
      },
    }).stream();
    stream.on('error', (err) => {
      throw err;
    });
    stream.on('data', async (request) => {
      stream.pause();
      try {
        if (!breakdownCreated) {
          await breakdownCol.updateOne({ name: 'Fuzzy Matches', lspId: request.lspId }, {
            $set: {
              name: 'Fuzzy Matches', lspId: request.lspId,
            },
          }, { upsert: true });
          breakdownCreated = true;
        }
        await processRequest(request, db);
        await requestsCol.updateOne(
          { _id: request._id },
          { $set: { workflows: request.workflows } },
        );
      } catch (e) {
        console.log(`Error ocurred ${e}`);
      }
      stream.resume();
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
