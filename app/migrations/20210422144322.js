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
    breakdown: '101%',
    translationUnit: 'Words',
  },
  '99-95%': {
    breakdown: '101%',
    translationUnit: 'Words',
  },
  '94-85%': {
    breakdown: '101%',
    translationUnit: 'Words',
  },
  '84-75%': {
    breakdown: '101%',
    translationUnit: 'Words',
  },
  'No Match': {
    breakdown: '101%',
    translationUnit: 'Words',
  },
  Fuzzy: {
    breakdown: '101%',
    translationUnit: 'Fuzzy',
  },
  Hourly: {
    breakdown: '101%',
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

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const requestsCol = db.collection('requests');
    const translationUnitCol = db.collection('translationUnits');
    const breakdownCol = db.collection('breakdowns');
    let breakdownCreated = false;
    const stream = requestsCol.find({
      $and: [{
        workflows: {
          $exists: true,
          $not: { $size: 0 },
        },
      }, {
        'workflows.tasks.providerTasks.quantity.units': { $ne: '' },
      }],
    }).stream();
    return new Promise((resolve, reject) => {
      stream.on('error', (err) => {
        reject(err);
      });
      stream.on('end', () => {
        resolve();
      });
      stream.on('data', async (request) => {
        stream.pause();
        if (!breakdownCreated) {
          await breakdownCol.updateOne({ name: 'Fuzzy Matches', lspId: request.lspId }, {
            $set: {
              name: 'Fuzzy Matches', lspId: request.lspId,
            },
          }, { upsert: true });
          breakdownCreated = true;
        }
        await Promise.map(request.workflows, async (workflow) => {
          await Promise.map(workflow.tasks, async (task) => {
            await Promise.map(task.providerTasks, async (providerTask) => {
              if (_.isNil(providerTask.quantity)) {
                stream.resume();
              }
              await Promise.map(providerTask.quantity, async (quantity, quantityIndex) => {
                const { amount, units } = quantity;
                if (_.isNil(units) || _.isNil(units)) stream.resume();
                const breakdownUnit = _.get(breakdownUnitsMapping, units);
                const breakdown = _.get(breakdownUnit, 'breakdown');
                const translationUnit = _.get(breakdownUnit, 'translationUnit');
                if (_.isNil(breakdown) || _.isNil(translationUnit)) stream.resume();
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
                const newInvoiceDetail = {
                  invoice: {
                    breakdown: _.pick(breakdownDb, ['_id', 'name']),
                    translationUnit: _.pick(translationUnitDb, ['_id', 'name']),
                    untPrice: 0,
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
        await requestsCol.updateOne(
          { _id: request._id },
          { $set: { workflows: request.workflows } },
        );
        stream.resume();
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
